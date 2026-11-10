#!/usr/bin/env python3
"""Validate the pinned runtime and restore the matching mobile PDF.js distribution."""
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

from pdfjs_assets import validate_engine

root = Path(__file__).resolve().parents[1]
sha = lambda data: hashlib.sha256(data).hexdigest()
assets = json.loads((root / 'vendor/runtime-assets.json').read_text())
for name, digest in assets['files'].items():
    path = root / name
    if not path.is_file() or sha(path.read_bytes()) != digest:
        raise SystemExit('Missing or changed runtime asset: ' + name)
manifest = json.loads((root / 'vendor/pdfjs-mobile.json').read_text())
archive = root / 'vendor/pdfjs-mobile.zip'
assert sha(archive.read_bytes()) == manifest['archive_sha256'], 'PDF.js archive checksum mismatch'
with zipfile.ZipFile(archive) as source:
    assert source.testzip() is None
    assert {name for name in source.namelist() if not name.endswith('/')} == set(manifest['files'])
    files = {name: source.read(name) for name in manifest['files']}
    commit = subprocess.check_output(['git', '-C', str(root / 'reader/pdfjs/pdf.js'),
        'rev-parse', 'HEAD'], text=True).strip()
    validate_engine(manifest, files, commit, (root / 'reader/pdfjs/compatibility.js').read_bytes())
    for name, data in files.items():
        assert name.startswith('pdf/') and '..' not in Path(name).parts
        for target in ['reader/build/mobile', 'reader/build/android']:
            path = root / target / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
print(f"Verified {len(assets['files'])} runtime assets and restored {len(manifest['files'])} PDF.js files")
