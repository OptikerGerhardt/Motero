#!/usr/bin/env python3
"""Verify public test identity, version, pinned assets and current reader source in an APK."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--apk', type=Path, required=True)
parser.add_argument('--build-tools', type=Path, required=True)
parser.add_argument('--output', type=Path)
args = parser.parse_args()
signature = subprocess.check_output([str(args.build_tools / 'apksigner'), 'verify', '--verbose', '--print-certs', str(args.apk)], text=True)
assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature
certificate = re.search(r'certificate SHA-256 digest: ([0-9a-f]+)', signature).group(1)
assert certificate == 'c4e70a6935d239246540532b6d3ea514eb2a428e1e8eaacbf94c8a9a01989299', 'Unexpected test signing key'
badging = subprocess.check_output([str(args.build_tools / 'aapt2'), 'dump', 'badging', str(args.apk)], text=True)
package, code = re.search(r"package: name='([^']+)' versionCode='(\d+)'", badging).groups()
assert package == 'org.zotero.android.debug'
assert int(code) == int(re.search(r'const val versionCode = (\d+)', (root / 'buildSrc/src/main/kotlin/BuildConfig.kt').read_text()).group(1))
assert "application-label:'Motero'" in badging
subprocess.run([str(args.build_tools / 'zipalign'), '-c', '-P', '16', '4', str(args.apk)], check=True, stdout=subprocess.DEVNULL)
sha = lambda data: hashlib.sha256(data).hexdigest()
assets = json.loads((root / 'vendor/runtime-assets.json').read_text())
engine = json.loads((root / 'vendor/pdfjs-mobile.json').read_text())
matched = []
with zipfile.ZipFile(args.apk) as apk:
    assert apk.testzip() is None
    for name, digest in assets['files'].items():
        assert sha(apk.read('assets/' + name.removeprefix('app/src/main/assets/'))) == digest, name
    reader_data = apk.read('assets/reader/reader.zip')
    assert sha(reader_data) == apk.read('assets/reader/reader_hash.txt').decode().strip()
    with zipfile.ZipFile(io.BytesIO(reader_data)) as reader:
        assert reader.testzip() is None
        for name, digest in engine['files'].items():
            assert sha(reader.read(name)) == digest, name
        mapping = json.loads(reader.read('view.js.map'))
        for name, content in zip(mapping['sources'], mapping['sourcesContent']):
            if '/./src/' not in name or '!' in name:
                continue
            relative = name.split('/./src/', 1)[1]
            path = root / 'reader/src' / relative
            if path.suffix in ['.js', '.mjs', '.ts', '.tsx'] and path.is_file():
                assert content == path.read_text(), 'Stale embedded reader source: ' + relative
                matched.append(relative)
        assert 'pdf/manual-crop-editor.js' in matched and 'pdf/pdf-view.js' in matched
report = dict(verified=True, package=package, version_code=int(code), certificate_sha256=certificate,
    apk_sha256=sha(args.apk.read_bytes()), runtime_files=len(assets['files']), pdfjs_files=len(engine['files']), reader_sources=len(matched))
if args.output:
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
