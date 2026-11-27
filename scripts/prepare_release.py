#!/usr/bin/env python3
"""Prepare a tested APK, complete tracked source including submodules, notes and hashes."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--apk', type=Path)
parser.add_argument('--output', type=Path, default=root / 'dist')
parser.add_argument('--metadata-only', action='store_true')
parser.add_argument('--unsigned-ci', action='store_true', help='Prepare non-installable CI input; signing must happen in the protected release job')
parser.add_argument('--beta-build', type=int, help='Package a verified APK for the separate Beta channel')
parser.add_argument('--build-tools', type=Path)
args = parser.parse_args()
config = (root / 'buildSrc/src/main/kotlin/BuildConfig.kt').read_text()
code = int(re.search(r'const val versionCode = (\d+)', config).group(1))
base_version = '.'.join(re.search(r'\b' + key + r'\s*=\s*(\d+)', config).group(1) for key in ['major', 'minor', 'patch'])
beta = args.beta_build is not None
if beta:
    assert args.beta_build > 0 and not args.unsigned_ci
    code = args.beta_build
    version = f'{base_version}-beta.{code}'
    prefix = f'Motero_Beta_{code}'
    title = f'Motero Beta {base_version} (Build {code})'
else:
    version = f'{base_version}-{code}'
    prefix = f'Motero_Build{code}'
    title = 'Motero 1.0' if code == 315 else 'Motero 1.1' if code == 326 else 'Motero ' + base_version
metadata = dict(version=version, version_code=code, tag='v' + version,
                apk=prefix + '.apk', source=prefix + '_Source.zip', release_title=title)
if args.metadata_only:
    print(json.dumps(metadata))
    raise SystemExit()
assert args.apk and args.apk.is_file(), 'A built and tested APK is required'
args.output.mkdir(parents=True, exist_ok=True)
if not args.unsigned_ci:
    tools = args.build_tools or Path(os.environ.get('ANDROID_HOME', '')) / 'build-tools/36.0.0'
    verify = ['python3', str(root / 'scripts/verify_release.py'), '--apk', str(args.apk), '--build-tools', str(tools)]
    if beta:
        verify += ['--beta-build', str(code)]
    subprocess.run(verify, check=True)
metadata['unsigned'] = args.unsigned_ci
apk = args.output / (f'Motero_Build{code}-unsigned.apk' if args.unsigned_ci else metadata['apk'])
if args.apk.resolve() != apk.resolve():
    shutil.copyfile(args.apk, apk)
sha = lambda data: hashlib.sha256(data).hexdigest()
git = lambda *values: subprocess.check_output(['git', '-C', str(root), *values], text=True).strip()
names = subprocess.check_output(['git', '-C', str(root), 'ls-files', '-z', '--recurse-submodules']).decode().split('\0')
files = {}
source = args.output / metadata['source']
with zipfile.ZipFile(source, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for name in sorted(set(names) - {''}):
        path = root / name
        assert '.git' not in Path(name).parts and '..' not in Path(name).parts
        if path.is_symlink():
            data = os.readlink(path).encode()
            info = zipfile.ZipInfo(name)
            info.create_system = 3
            info.external_attr = 0o120777 << 16
            archive.writestr(info, data)
        elif path.is_file():
            assert path.resolve().is_relative_to(root.resolve()), name
            data = path.read_bytes()
            archive.write(path, name)
        else:
            raise SystemExit('Submodule or tracked source is not initialized: ' + name)
        files[name] = sha(data)
    snapshot = {**{k:v for k,v in metadata.items() if k != 'unsigned'}, 'android_commit': git('rev-parse', 'HEAD'),
        'reader_commit': subprocess.check_output(['git', '-C', str(root / 'reader'), 'rev-parse', 'HEAD'], text=True).strip(),
        'apk_binding': 'The final signed APK is identified separately in SHA256SUMS.txt.', 'files': files,
        'restoration': 'Complete tracked source tree including initialized submodules. No Git metadata or local credentials. See README.md for building.'}
    archive.writestr('SOURCE_SNAPSHOT.json', json.dumps(snapshot, indent=2) + '\n')
with zipfile.ZipFile(source) as archive:
    assert archive.testzip() is None
    assert set(archive.namelist()) == set(files) | {'SOURCE_SNAPSHOT.json'}
    for name, digest in files.items():
        assert sha(archive.read(name)) == digest, name
changelog = (root / 'CHANGELOG.md').read_text()
match = re.search(r'^## ' + re.escape(version) + r'[^\n]*\n(.*?)(?=^## |\Z)', changelog, re.M | re.S)
changes = match.group(1).strip() if match else 'Änderungen stehen im Changelog und in den Commits dieses Tags.'
notes = f"{metadata['release_title']} (Build {code})\n\n{changes}\n\nAPK als Update über die bestehende Motero-Version installieren. Paket org.zotero.android.debug; unveränderter privater Motero-Signierer mit V3-Zertifikatsrotation, Android 9+. Die beigefügten Berichte dokumentieren die automatischen API-31/35-Update-Prüfungen; physische Geräteprüfungen sind separat.\n\nDie vollständigen Quellen einschließlich Submodulen sind beigefügt. Automatische Tests und Build-Prüfungen ersetzen keinen physischen Geräte-/BOOX-Tastatur- oder Kontosync-Test.\n"
if beta:
    notes = (f'{title}\n\n{changes}\n\n'
             'Motero Beta läuft als eigene App (org.zotero.android.beta, Android 9+) mit eigenen lokalen Daten. '
             'In Obtainium die GitHub-Quelle erneut hinzufügen, Vorabversionen aktivieren und den Release-Titelfilter '
             f'`^Motero Beta` eintragen. Die APK dieses Builds heißt {metadata["apk"]}.\n\n'
             'Vollständige Quellen, Prüfsummen und API-31/35-Prüfberichte sind beigefügt. '
             'Praxistests auf BOOX und Live-Kontosync stehen separat aus.\n')
(args.output / 'RELEASE_NOTES.md').write_text(notes)
(args.output / 'release-metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
(args.output / 'SHA256SUMS.txt').write_text(''.join(sha(path.read_bytes()) + '  ' + path.name + '\n'
    for path in [apk, source]))
print(json.dumps(dict(metadata, source_files=len(files), apk_sha256=sha(apk.read_bytes()), source_sha256=sha(source.read_bytes()))))
