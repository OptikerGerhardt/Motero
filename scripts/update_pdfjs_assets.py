#!/usr/bin/env python3
"""Package an explicitly rebuilt Zotero PDF.js checkout; normal CI uses the pin."""
import hashlib
import io
import json
from pathlib import Path
import subprocess
import zipfile

from pdfjs_assets import BUNDLES, validate_engine

ROOT = Path(__file__).resolve().parents[1]


def main():
    source = ROOT / 'reader/pdfjs/pdf.js'
    git = lambda *args: subprocess.check_output(['git', '-C', str(source), *args], text=True).strip()
    assert not git('status', '--porcelain', '--untracked-files=no'), 'Build clean upstream sources first'
    assert git('rev-parse', '--is-shallow-repository') == 'false', 'Fetch full history before compiling PDF.js'
    commit = git('rev-parse', 'HEAD')
    config = json.loads((source / 'pdfjs.config').read_text())
    build = json.loads((source / 'build/version.json').read_text())
    count = int(git('rev-list', '--count', config['baseVersion'] + '..HEAD'))
    assert build['version'] == config['versionPrefix'] + str(count), 'Rebuild after fetching full history'
    assert commit.startswith(build['commit']), 'Build does not match the source pin'
    generic = source / 'build/generic'
    files = {}
    for name in ['LICENSE', 'build/pdf.mjs', 'build/pdf.worker.mjs', 'web/viewer.html',
                 'web/viewer.mjs', 'web/images/loading-icon.gif']:
        files['pdf/' + name] = (generic / name).read_bytes()
    for directory in ['cmaps', 'standard_fonts', 'iccs', 'wasm']:
        for path in sorted((generic / 'web' / directory).rglob('*')):
            if path.is_file():
                files['pdf/' + path.relative_to(generic).as_posix()] = path.read_bytes()
    files['pdf/web/viewer.css'] = (ROOT / 'reader/pdfjs/viewer.css').read_bytes()
    compatibility = (ROOT / 'reader/pdfjs/compatibility.js').read_bytes()
    for name in BUNDLES:
        files[name] = compatibility + files[name]
    sha = lambda data: hashlib.sha256(data).hexdigest()
    manifest = dict(schema=1, source='https://github.com/zotero/pdf.js', commit=commit,
                    version=build['version'], build=build['commit'],
                    files={name: sha(data) for name, data in sorted(files.items())})
    validate_engine(manifest, files, commit, compatibility)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for name, data in sorted(files.items()):
            entry = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            entry.external_attr = 0o100644 << 16
            entry.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(entry, data)
    manifest['archive_sha256'] = sha(buffer.getvalue())
    (ROOT / 'vendor/pdfjs-mobile.zip').write_bytes(buffer.getvalue())
    (ROOT / 'vendor/pdfjs-mobile.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f"Packaged PDF.js {build['version']} ({commit}): {len(files)} files")


if __name__ == '__main__':
    main()
