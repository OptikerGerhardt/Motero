#!/usr/bin/env python3
"""Replace unsigned CI input with a verified private-signed release; never publish unsigned APKs."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--directory', type=Path, required=True)
parser.add_argument('--build-tools', type=Path, required=True)
args = parser.parse_args()
metadata = json.loads((args.directory / 'release-metadata.json').read_text())
apk = args.directory / metadata['apk']
assert apk.is_file(), 'No signed APK exists; refusing publication'
report = args.directory / 'Motero_SigningVerification.json'
subprocess.run(['python3', str(root / 'scripts/verify_release.py'), '--apk', str(apk),
    '--build-tools', str(args.build_tools), '--output', str(report)], check=True)
with zipfile.ZipFile(args.directory / metadata['source']) as source:
    snapshot = json.loads(source.read('SOURCE_SNAPSHOT.json'))
assert snapshot['version_code'] == metadata['version_code']
commit = subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
assert snapshot['android_commit'] == commit, 'Source archive belongs to a different commit'
for path in args.directory.glob('*-unsigned.apk'):
    path.unlink()
metadata['unsigned'] = False
metadata['signing_certificate_sha256'] = json.loads(report.read_text())['certificate_sha256']
(args.directory / 'release-metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
assert len(list(args.directory.glob('*.apk'))) == 1
paths = sorted(p for p in args.directory.iterdir() if p.is_file() and p.name != 'SHA256SUMS.txt')
(args.directory / 'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in paths))
print('Only the private-signed verified APK, source and reports are eligible for release.')
