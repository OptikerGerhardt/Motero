#!/usr/bin/env python3
"""Sign a non-debuggable Android 9+ APK with a private key and the public rotation proof."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--apk', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--build-tools', type=Path, required=True)
parser.add_argument('--secret-file', type=Path, help='Private local setup only; CI uses MOTERO_RELEASE_SIGNING')
args = parser.parse_args()
policy = json.loads((root / 'signing/release-policy.json').read_text())
raw = args.secret_file.read_text() if args.secret_file else os.environ.get('MOTERO_RELEASE_SIGNING', '')
if not raw:
    raise SystemExit('MOTERO_RELEASE_SIGNING is missing. Refusing to publish with a development key.')
try:
    secret = json.loads(raw)
    assert isinstance(secret, dict)
    key = base64.b64decode(secret['keystore_base64'], validate=True)
    assert key and all(isinstance(secret[k], str) and secret[k] for k in ['store_password','key_password','key_alias'])
except (ValueError, KeyError, AssertionError):
    raise SystemExit('Invalid signing secret. The secret value is intentionally not logged.')
badging = subprocess.check_output([str(args.build_tools / 'aapt2'), 'dump', 'badging', str(args.apk)], text=True)
assert "package: name='" + policy['application_id'] + "'" in badging
assert 'application-debuggable' not in badging, 'Public APK must not be debuggable'
minimum = int(re.search(r"(?:minSdkVersion|sdkVersion):'(\d+)'", badging).group(1))
assert minimum >= policy['minimum_android_api'], 'Public APK must require Android 9 or newer'
assert hashlib.sha256((root / 'signing/motero-release.der').read_bytes()).hexdigest() == policy['certificate_sha256']
args.output.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix='motero-sign-') as directory:
    keystore = Path(directory) / 'signing.p12'
    keystore.write_bytes(key)
    keystore.chmod(0o600)
    env = os.environ.copy()
    env['MOTERO_STORE_PASSWORD'] = secret['store_password']
    env['MOTERO_KEY_PASSWORD'] = secret['key_password']
    staged = Path(directory) / 'signed.apk'
    cmd = [str(args.build_tools / 'apksigner'), 'sign', '--ks', str(keystore), '--ks-key-alias', secret['key_alias'],
        '--ks-pass', 'env:MOTERO_STORE_PASSWORD', '--key-pass', 'env:MOTERO_KEY_PASSWORD',
        '--lineage', str(root / 'signing/motero-release.lineage'), '--rotation-min-sdk-version', '28',
        '--v1-signing-enabled', 'false', '--v2-signing-enabled', 'false', '--v3-signing-enabled', 'true',
        '--v4-signing-enabled', 'false', '--out', str(staged), str(args.apk)]
    result = subprocess.run(cmd, env=env, capture_output=True)
    if result.returncode:
        raise SystemExit('APK signing failed. Private key material and passwords are intentionally not logged.')
    subprocess.run(['python3', str(root / 'scripts/verify_release.py'), '--apk', str(staged),
        '--build-tools', str(args.build_tools)], check=True)
    import shutil
    shutil.copyfile(staged, args.output)
print('Signed public APK with the pinned private Motero identity; legacy-key rollback remains disabled.')
