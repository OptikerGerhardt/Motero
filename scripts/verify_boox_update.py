#!/usr/bin/env python3
"""Verify update identity and that an APK contains the tested Reader sources."""
from pathlib import Path
import argparse
import hashlib
import io
import json
import os
import re
import subprocess
import zipfile
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument('--base', type=Path, required=True)
parser.add_argument('--apk', type=Path, required=True)
parser.add_argument('--build-tools', type=Path, required=True)
parser.add_argument('--qa-directory', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]

def sha(data): return hashlib.sha256(data).hexdigest()

def info(apk):
    signature = subprocess.run([str(args.build_tools / 'apksigner'), 'verify', '--verbose', '--print-certs', str(apk)],
                              capture_output=True, text=True, check=True).stdout
    digest = re.search(r'certificate SHA-256 digest: ([0-9a-f]+)', signature).group(1)
    assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature
    badging = subprocess.run([str(args.build_tools / 'aapt2'), 'dump', 'badging', str(apk)],
                            capture_output=True, text=True, check=True).stdout
    package, code, version = re.search(r"package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", badging).groups()
    return dict(package=package, version_code=int(code), version_name=version, certificate_sha256=digest)

old, new = info(args.base), info(args.apk)
assert new['package'] == old['package'] == 'org.zotero.android.debug'
assert new['certificate_sha256'] == old['certificate_sha256']
assert new['version_code'] > old['version_code']
expected_code = int(re.search(r'versionCode = (\d+)', (root / 'buildSrc/src/main/kotlin/BuildConfig.kt').read_text()).group(1))
assert new['version_code'] == expected_code

with zipfile.ZipFile(args.apk) as apk:
    assert apk.testzip() is None
    with zipfile.ZipFile(args.base) as base:
        unchanged_runtime_files = [n for n in base.namelist() if n.startswith(('assets/', 'lib/'))
                                   and not n.endswith('/')
                                   and n not in ('assets/reader/reader.zip', 'assets/reader/reader_hash.txt')]
        for name in unchanged_runtime_files:
            assert name in apk.namelist(), 'Missing runtime file: ' + name
            assert apk.read(name) == base.read(name), 'Unexpected runtime change: ' + name
    reader = apk.read('assets/reader/reader.zip')
    reader_hash = sha(reader)
    assert reader_hash == apk.read('assets/reader/reader_hash.txt').decode().strip()
    assert reader == (root / 'app/src/main/assets/reader/reader.zip').read_bytes()
    dex = [apk.read(n) for n in apk.namelist() if re.fullmatch(r'classes\d*\.dex', n)]
    for name in [b'ReaderQuickControlActions', b'ReaderColoredTagShortcuts', b'ReaderHighlightQuote', b'ReaderSidebarFilter']:
        assert any(name in d for d in dex), name
    assert not any(b'isScrubberSuppressedByScroll' in d for d in dex)
    with zipfile.ZipFile(io.BytesIO(reader)) as bundle:
        assert bundle.testzip() is None
        mapping = json.loads(bundle.read('view.js.map'))
        verified = []
        for name in ['pdf/boox-reader.js', 'pdf/pdf-view.js', 'pdf/direct-highlight.js',
                     'pdf/hardware-navigation.mjs', 'index.android.js']:
            candidates = [i for i, source in enumerate(mapping['sources']) if source.endswith('/src/' + name)]
            assert len(candidates) == 1, (name, candidates)
            assert mapping['sourcesContent'][candidates[0]] == (root / 'reader/src' / name).read_text(), name
            verified.append(name)

qa = {}
if args.qa_directory:
    unit_log = (args.qa_directory / 'reader-final-tests.log').read_text()
    assert re.search(r'ℹ fail 0\b', unit_log)
    assert re.search(r'ℹ cancelled 0\b', unit_log)
    reader_tests = int(re.search(r'ℹ tests (\d+)', unit_log).group(1))
    features = (args.qa_directory / 'reader-features.log').read_text()
    assert 'PASS: all new Reader features' in features and 'PAGE ERROR' not in features
    gestures = (args.qa_directory / 'reader-final-gestures.log').read_text()
    assert 'PASS: width and resize' in gestures and 'PAGE ERROR' not in gestures
    native_xml = root / 'app/build/test-results/testDevDebugUnitTest/TEST-org.zotero.android.screens.reader.ReaderQuickControlActionsTest.xml'
    native = ET.parse(native_xml).getroot()
    assert native.get('failures') == native.get('errors') == native.get('skipped') == '0'
    qa = dict(reader_tests=reader_tests, native_logic_tests=int(native.get('tests')),
              browser_features_passed=True, browser_gestures_passed=True)

report = dict(new, previous_version_code=old['version_code'], sha256=sha(args.apk.read_bytes()),
              size_bytes=args.apk.stat().st_size, reader_sha256=reader_hash, dex_count=len(dex),
              reader_sources_verified=verified,
              unchanged_runtime_files_verified=len(unchanged_runtime_files),
              selected_features=[1, 2, 5, 6, 16, 17, 18, 20, 21],
              **qa, verified=True,
              physical_device_tested=False)
(root / 'BUILD_VERIFICATION.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
