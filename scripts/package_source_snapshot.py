#!/usr/bin/env python3
"""Overlay current project sources onto the previous complete, recoverable source archive."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

p = argparse.ArgumentParser()
p.add_argument('--base-source', type=Path, required=True)
p.add_argument('--apk', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
p.add_argument('--build', type=int, required=True)
p.add_argument('--baseline-build', type=int, required=True)
args = p.parse_args()
root = Path(__file__).resolve().parents[1]
sha = lambda value: hashlib.sha256(value).hexdigest()

def source_files(directory):
    result = subprocess.check_output(['git', '-C', str(directory), 'ls-files', '-z', '--cached', '--others', '--exclude-standard'])
    for name in result.decode().split('\0'):
        path = directory / name
        if name and path.is_file() and not path.is_symlink():
            yield path

with zipfile.ZipFile(args.base_source) as previous:
    assert previous.testzip() is None
    manifest = json.loads(previous.read('SOURCE_SNAPSHOT.json'))
    names = set(previous.namelist()) - {'SOURCE_SNAPSHOT.json'}
    names.update('zotero-android/' + str(path.relative_to(root)) for directory in (root, root / 'reader') for path in source_files(directory))
    # Build logs are deliberately ignored by Git; include the actual verification evidence explicitly.
    names.update('zotero-android/' + str(path.relative_to(root)) for path in (root / 'qa' / f'build{args.build}').rglob('*') if path.is_file())
    files = {}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for name in sorted(names):
            if name.endswith('/'):
                continue
            path = root / name.removeprefix('zotero-android/')
            if name.startswith('zotero-android/') and path.is_file():
                assert path.resolve().is_relative_to(root.resolve()), name
                data = path.read_bytes()
            else:
                data = previous.read(name)
            files[name] = sha(data)
            archive.writestr(name, data)
        manifest.update(build=args.build, date='2026-11-07', baseline_build=args.baseline_build,
            status='automated_checks_passed', working_tree_overlay=True, bundle_commits_are_baselines=True,
            restoration=f'Import the Git bundles first, then overlay every file under zotero-android; the flat tree contains all Build-{args.build} changes and generated runtime assets.',
            apk_sha256=sha(args.apk.read_bytes()), reader_sha256=sha((root / 'app/src/main/assets/reader/reader.zip').read_bytes()),
            android_commit=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip(),
            reader_commit=subprocess.check_output(['git','-C',str(root/'reader'),'rev-parse','HEAD'],text=True).strip(),
            file_count=len(files), files=files)
        archive.writestr('SOURCE_SNAPSHOT.json', json.dumps(manifest, indent=2) + '\n')
with zipfile.ZipFile(args.output) as archive:
    assert archive.testzip() is None
    current = json.loads(archive.read('SOURCE_SNAPSHOT.json'))
    assert len(archive.namelist()) == current['file_count'] + 1
    for name, digest in current['files'].items():
        assert sha(archive.read(name)) == digest, name
print(json.dumps(dict(files=len(files), sha256=sha(args.output.read_bytes()), bytes=args.output.stat().st_size)))
