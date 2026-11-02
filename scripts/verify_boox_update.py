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
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--base', type=Path, required=True)
parser.add_argument('--apk', type=Path, required=True)
parser.add_argument('--build-tools', type=Path, required=True)
parser.add_argument('--qa-directory', type=Path)
parser.add_argument('--preserve-fitting', action='store_true', help='Require the existing PDF fitting implementation and PDF.js to be unchanged')
parser.add_argument('--label', help='Expected visible Android application name')
parser.add_argument('--fitting-update', action='store_true', help='Require the four-mode Android fitting checks')
parser.add_argument('--reader-polish', action='store_true', help='Require page-turn, deletion, palette, bookmark and scan regressions')
parser.add_argument('--motero-refinement', action='store_true', help='Verify launcher M, fullscreen hooks and full-width palette modes')
parser.add_argument('--reader-controls', action='store_true', help='Verify width variants, optional marginal references and chrome dismissal')
parser.add_argument('--without-pspdfkit', action='store_true', help='Require an SDK-free APK')
parser.add_argument('--preserve-reader', action='store_true', help='Require the complete Reader bundle to remain byte-identical for this removal-only update')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]

def sha(data): return hashlib.sha256(data).hexdigest()

def source(mapping, name):
    candidates = [i for i, path in enumerate(mapping['sources']) if path.endswith('/src/' + name)]
    assert len(candidates) == 1, (name, candidates)
    return mapping['sourcesContent'][candidates[0]]

def info(apk):
    signature = subprocess.run([str(args.build_tools / 'apksigner'), 'verify', '--verbose', '--print-certs', str(apk)],
                              capture_output=True, text=True, check=True).stdout
    digest = re.search(r'certificate SHA-256 digest: ([0-9a-f]+)', signature).group(1)
    assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature
    badging = subprocess.run([str(args.build_tools / 'aapt2'), 'dump', 'badging', str(apk)],
                            capture_output=True, text=True, check=True).stdout
    package, code, version = re.search(r"package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", badging).groups()
    label = re.search(r"application-label:'([^']+)'", badging).group(1)
    return dict(package=package, version_code=int(code), version_name=version, certificate_sha256=digest, application_label=label)

old, new = info(args.base), info(args.apk)
assert new['package'] == old['package'] == 'org.zotero.android.debug'
assert new['certificate_sha256'] == old['certificate_sha256']
assert new['version_code'] > old['version_code']
expected_code = int(re.search(r'versionCode = (\d+)', (root / 'buildSrc/src/main/kotlin/BuildConfig.kt').read_text()).group(1))
assert new['version_code'] == expected_code
if args.label:
    assert new['application_label'] == args.label
subprocess.run([str(args.build_tools / 'zipalign'), '-c', '-P', '16', '4', str(args.apk)],
               capture_output=True, text=True, check=True)

with zipfile.ZipFile(args.apk) as apk:
    assert apk.testzip() is None
    with zipfile.ZipFile(args.base) as base:
        previous_reader = base.read('assets/reader/reader.zip')
        if args.motero_refinement:
            expected_path = re.search(r'android:pathData="([^"]+)"', (root / 'app/src/main/res/drawable-v24/ic_launcher_foreground.xml').read_text()).group(1)
            assert expected_path.startswith('M34,76V32H43L54,51'), 'Expected geometric Motero M'
            for name in ['res/drawable-anydpi-v24/ic_launcher_foreground.xml', 'res/drawable/ic_launcher_monochrome.xml']:
                raw = apk.read(name)
                assert expected_path.encode() in raw or expected_path.encode('utf-16le') in raw, name
                if not args.without_pspdfkit:
                    assert (raw != base.read(name)) if old['version_code'] < 298 else (raw == base.read(name)), name
            for name in ['res/drawable-anydpi-v24/$ic_launcher_foreground__0.xml', 'res/drawable/ic_launcher_background.xml', 'res/mipmap-anydpi-v26/ic_launcher.xml']:
                if not args.without_pspdfkit:
                    assert apk.read(name) == base.read(name), 'Keep original icon color/background configuration: ' + name
            for density in ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']:
                name = 'res/mipmap-' + density + '-v4/ic_launcher.png'
                actual = Image.open(io.BytesIO(apk.read(name))).convert('RGBA')
                expected = Image.open(root / ('app/src/main/res/mipmap-' + density + '/ic_launcher.png')).convert('RGBA')
                assert actual.size == expected.size and actual.tobytes() == expected.tobytes(), name
                assert (apk.read(name) != base.read(name)) if old['version_code'] < 298 else (apk.read(name) == base.read(name)), name
        entry_names_unchanged = set(base.namelist()) == set(apk.namelist())
        if not args.without_pspdfkit:
            assert entry_names_unchanged, 'Unexpected APK entry additions/removals'
        def sdk_runtime(name):
            return name.startswith('assets/pspdfkit/') or name.endswith('/libpspdfkit.so')
        removed_sdk_runtime = [n for n in base.namelist() if sdk_runtime(n)]
        unchanged_runtime_files = [n for n in base.namelist() if n.startswith(('assets/', 'lib/'))
                                   and not n.endswith('/')
                                   and n not in ('assets/reader/reader.zip', 'assets/reader/reader_hash.txt')
                                   and not (args.without_pspdfkit and sdk_runtime(n))]
        for name in unchanged_runtime_files:
            assert name in apk.namelist(), 'Missing runtime file: ' + name
            assert apk.read(name) == base.read(name), 'Unexpected runtime change: ' + name
        if args.without_pspdfkit:
            assert removed_sdk_runtime, 'Baseline must contain the SDK being removed'
            assert not any(sdk_runtime(n) or 'pspdf' in n.lower() for n in apk.namelist()), 'SDK runtime/resources remain'
            for name in ['META-INF/androidx.webkit_webkit.version',
                         'META-INF/androidx.compose.material_material.version']:
                assert apk.read(name) == base.read(name), 'Preserve formerly transitive library version: ' + name
    reader = apk.read('assets/reader/reader.zip')
    reader_hash = sha(reader)
    if args.preserve_reader:
        assert reader == previous_reader, 'Reader must remain byte-identical'
    assert reader_hash == apk.read('assets/reader/reader_hash.txt').decode().strip()
    assert reader == (root / 'app/src/main/assets/reader/reader.zip').read_bytes()
    dex = [apk.read(n) for n in apk.namelist() if re.fullmatch(r'classes\d*\.dex', n)]
    if args.without_pspdfkit:
        for data in dex:
            assert not re.search(rb'com[/\.]pspdfkit|com[/\.]nutrient|libpspdfkit', data, re.I), 'Vendor classes remain in DEX'
        manifest = subprocess.run([str(args.build_tools / 'aapt2'), 'dump', 'xmltree', str(args.apk), '--file', 'AndroidManifest.xml'], capture_output=True, text=True, check=True).stdout
        assert not re.search(r'pspdfkit|nutrient', manifest, re.I), 'Vendor manifest component remains'
    for name in [b'ReaderQuickControlActions', b'ReaderColoredTagShortcuts', b'ReaderHighlightQuote', b'ReaderSidebarFilter',
                 b'ReaderAnnotationScreenClosed', b'reportScreenClosed', b'didReportClosed']:
        assert any(name in d for d in dex), name
    assert not any(b'isScrubberSuppressedByScroll' in d for d in dex)
    if args.motero_refinement:
        for name in [b'ReaderSystemBars', b'addOnWindowFocusChangeListener']:
            assert any(name in d for d in dex), name
    if args.reader_polish:
        for name in [b'resetAndroidReaderInput', b'deleteAnnotations']:
            assert any(name in d for d in dex), name
    if args.reader_controls:
        for name in [b'fitWidthCrop', b'includeMarginalia', b'onDismissReaderChrome', b'syncReaderChromeVisibility']:
            assert any(name in d for d in dex), name
    with zipfile.ZipFile(io.BytesIO(reader)) as bundle:
        assert bundle.testzip() is None
        mapping = json.loads(bundle.read('view.js.map'))
        assert bundle.read('view.css') == (root / 'reader/build/android/view.css').read_bytes()
        verified = []
        for name in ['pdf/boox-reader.js', 'pdf/pdf-view.js', 'pdf/content-fit.mjs', 'pdf/direct-highlight.js',
                     'pdf/hardware-navigation.mjs', 'index.android.js', 'common/view.js',
                     'pdf/reading-layout.mjs', 'pdf/android-page-fitting.js', 'pdf/chrome-tap-guard.mjs', 'pdf/page.js']:
            assert source(mapping, name) == (root / 'reader/src' / name).read_text(), name
            verified.append(name)
        with zipfile.ZipFile(io.BytesIO(previous_reader)) as previous:
            for name in previous.namelist():
                if name.startswith('pdf/') and not name.endswith('/'):
                    assert bundle.read(name) == previous.read(name), name
        if args.preserve_fitting:
            with zipfile.ZipFile(io.BytesIO(previous_reader)) as previous:
                previous_mapping = json.loads(previous.read('view.js.map'))
                assert source(mapping, 'pdf/content-fit.mjs') == source(previous_mapping, 'pdf/content-fit.mjs')
                # Input handling can change while all fitting functions stay identical.
                def fitting_functions(value):
                    return value[value.index('\n\tzoomPageWidth() {'):value.index('\n\t_clearPendingBackdropTap(')]
                assert fitting_functions(source(mapping, 'pdf/pdf-view.js')) == fitting_functions(source(previous_mapping, 'pdf/pdf-view.js'))
                for name in previous.namelist():
                    if name.startswith('pdf/') and not name.endswith('/'):
                        assert bundle.read(name) == previous.read(name), name

qa = {}
if args.qa_directory:
    if args.without_pspdfkit:
        audit = json.loads((args.qa_directory / 'sdk-removal-audit.json').read_text())
        assert audit['verified'] and audit['production_vendor_references'] == 0
        dependencies = (args.qa_directory / 'android-dependencies.log').read_text()
        assert not re.search(r'com\.pspdfkit|my\.nutrient|com\.nutrient', dependencies, re.I)
        assert 'BUILD SUCCESSFUL' in dependencies
    unit_log = (args.qa_directory / 'reader-final-tests.log').read_text()
    assert re.search(r'ℹ fail 0\b', unit_log)
    assert re.search(r'ℹ cancelled 0\b', unit_log)
    reader_tests = int(re.search(r'ℹ tests (\d+)', unit_log).group(1))
    features = (args.qa_directory / 'reader-features.log').read_text()
    assert 'PASS: all new Reader features' in features and 'PAGE ERROR' not in features
    for check in ['opacity: \'0.5\'', 'PASS fixed bookmark PDF position independent of tap and zoom',
                  'PASS upper right edge bookmarks', 'PASS rotated page bookmark',
                  'PASS annotation reopens after selection-clear bridge',
                  'PASS first tap after palette color opens annotation popup',
                  'PASS first tap after touch palette selection opens annotation popup']:
        assert check in features, check
    gestures = (args.qa_directory / 'reader-final-gestures.log').read_text()
    assert 'PASS: width and resize' in gestures and 'PAGE ERROR' not in gestures
    if args.fitting_update:
        fitting = (args.qa_directory / 'reader-fitting.log').read_text()
        for check in ['PASS: all Android fitting checks',
                      'PASS content fit and first hardware press across Vertical, Horizontal and Wrapped',
                      'PASS all display rotations preserve content and cached recognition',
                      'PASS touch highlighting, palette and first annotation tap with active fitting']:
            assert check in fitting, check
        if not args.reader_controls:
            assert 'PASS original Mul PDF odd/even and complete content fit' in fitting
        assert 'Error' not in fitting and 'AssertionError' not in fitting
    if args.reader_controls:
        controls = (args.qa_directory / 'reader-controls.log').read_text()
        for check in ['PASS three width references, content-height scrolling and cropped hardware page limits in all layouts',
                      'PASS cropped width never fits the page height',
                      'PASS first annotation tap only dismisses chrome; second tap opens annotation without moving the PDF',
                      'PASS first empty-page tap dismisses chrome once',
                      'PASS visible chrome preserves direct hold-and-drag highlighting',
                      'PASS actual /hoeffe.pdf header crop and reference toggle',
                      'PASS actual /kant.pdf header crop and reference toggle',
                      'PASS: all new Android reader controls']:
            assert check in controls, check
        assert 'Error' not in controls and 'AssertionError' not in controls
    if args.reader_polish:
        stability = (args.qa_directory / 'reader-stability.log').read_text()
        for check in ['PASS page turn paints only prepared target geometry',
                      'PASS input during preparation cancels pending page fitting',
                      'PASS deleting selected annotation clears pointer and first backdrop tap works',
                      'PASS stale editor close preserves newer selection',
                      'PASS exact Zotero colors, borderless buttons, pointer and dark theme',
                      'PASS canonical underline conversion preserves comments tags text and sends deletion',
                      'PASS bookmark uses raw content frame independent of selected fit and margins',
                      'PASS image-only gray paper and footnote bounds without OCR',
                      'PASS: all Android reader stability checks']:
            assert check in stability, check
        assert 'Error' not in stability and 'AssertionError' not in stability
        if args.motero_refinement:
            assert 'PASS palette mode buttons fill equal halves with centered icons and edge touch targets' in stability
    native_xml = root / 'app/build/test-results/testDevDebugUnitTest/TEST-org.zotero.android.screens.reader.ReaderQuickControlActionsTest.xml'
    native = ET.parse(native_xml).getroot()
    assert native.get('failures') == native.get('errors') == native.get('skipped') == '0'
    native_suites = [ET.parse(p).getroot() for p in native_xml.parent.glob('TEST-*.xml')]
    assert native_suites
    if args.without_pspdfkit:
        engine_test = ET.parse(native_xml.parent / 'TEST-org.zotero.android.screens.reader.PdfEngineIndependenceTest.xml').getroot()
        assert int(engine_test.get('tests')) == 4
        assert engine_test.get('failures') == engine_test.get('errors') == engine_test.get('skipped') == '0'
    assert all(int(s.get('failures', 0)) == int(s.get('errors', 0)) == 0 for s in native_suites)
    qa = dict(reader_tests=reader_tests, native_logic_tests=int(native.get('tests')),
              native_tests_total=sum(int(s.get('tests', 0)) for s in native_suites),
              native_tests_skipped=sum(int(s.get('skipped', 0)) for s in native_suites),
              browser_features_passed=True, browser_gestures_passed=True)
    if args.fitting_update:
        qa['browser_fitting_passed'] = True
    if args.reader_polish:
        qa['browser_stability_passed'] = True
    if args.reader_controls:
        qa['browser_reader_controls_passed'] = True
        qa['concrete_pdf_test_pages'] = {'hoeffe': [26, 27, 191, 192], 'kant': [369, 370, 380, 381]}

report = dict(new, previous_version_code=old['version_code'], sha256=sha(args.apk.read_bytes()),
              size_bytes=args.apk.stat().st_size, reader_sha256=reader_hash, dex_count=len(dex),
              reader_sources_verified=verified,
              unchanged_runtime_files_verified=len(unchanged_runtime_files),
              selected_features=[1, 2, 5, 6, 16, 17, 18, 20, 21],
              fitting_unchanged=args.preserve_fitting,
              pdfjs_unchanged=True,
              zip_alignment_verified=True,
              apk_entry_names_unchanged=entry_names_unchanged,
              sdk_removed=args.without_pspdfkit,
              removed_sdk_runtime_files=len(removed_sdk_runtime) if args.without_pspdfkit else 0,
              complete_reader_unchanged=(reader == previous_reader),
              **qa, verified=True,
              physical_device_tested=False,
              motero_icon_verified=args.motero_refinement,
              fullscreen_hooks_verified=args.motero_refinement,
              palette_halves_verified=args.motero_refinement)
(root / 'BUILD_VERIFICATION.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
