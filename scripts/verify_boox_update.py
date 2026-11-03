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
parser.add_argument('--roman-references', action='store_true', help='Require actual Kant Roman reference and adaptive native button regressions')
parser.add_argument('--preserve-reader', action='store_true', help='Require the complete Reader bundle to remain byte-identical for this removal-only update')
parser.add_argument('--annotation-tools', action='store_true', help='Require live magnifier, trailing punctuation, palette thirds, quick editing and native sharing')
parser.add_argument('--reader-recovery', action='store_true', help='Require Build 303 share thread, overview fit recovery and safe reading viewport checks')
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
    if args.roman_references:
        for name in [b'ReaderOptionLabelsKt', b'compactReaderOptionLabels', b'readerOptionLabel']:
            assert any(name in d for d in dex), name
    if args.annotation_tools:
        for name in [b'DocumentSharingKt', b'ShareDocument', b'setClipData']:
            assert any(name in d for d in dex), name
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
                     'pdf/reading-layout.mjs', 'pdf/android-page-fitting.js', 'pdf/chrome-tap-guard.mjs', 'pdf/page.js'] + (['pdf/direct-selection.mjs', 'pdf/selection-magnifier.js', 'pdf/selection.js'] if args.annotation_tools else []):
            assert source(mapping, name) == (root / 'reader/src' / name).read_text(), name
            verified.append(name)
        with zipfile.ZipFile(io.BytesIO(previous_reader)) as previous:
            for name in previous.namelist():
                if name.startswith('pdf/') and not name.endswith('/'):
                    assert bundle.read(name) == previous.read(name), name
            if args.reader_recovery:
                previous_mapping = json.loads(previous.read('view.js.map'))
                for name in ['pdf/reading-layout.mjs', 'pdf/content-fit.mjs', 'pdf/hardware-navigation.mjs']:
                    assert source(mapping, name) == source(previous_mapping, name), 'Preserve crop geometry and hardware scroll math: ' + name
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
        if args.roman_references:
            for check in ['PASS actual Kant Roman folios B XLI B XLII B XLIX B L, Include/Exclude, masks and complete footnotes',
                          'PASS analyzed neighboring pages share Exclude and Include',
                          'PASS Roman references across three scroll modes and content width height fitting',
                          'PASS Roman reference masks follow all display rotations']:
                assert check in controls, check
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
            assert ('PASS palette mode buttons fill equal thirds with centered icons and edge touch targets' if args.annotation_tools else 'PASS palette mode buttons fill equal halves with centered icons and edge touch targets') in stability
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
    if args.roman_references:
        labels = ET.parse(native_xml.parent / 'TEST-org.zotero.android.screens.reader.ReaderOptionLabelsTest.xml').getroot()
        assert int(labels.get('tests')) == 3
        assert labels.get('failures') == labels.get('errors') == labels.get('skipped') == '0'
    if args.annotation_tools:
        tools = (args.qa_directory / 'reader-annotation-tools.log').read_text()
        for check in ['PASS attached final punctuation is persisted in text and geometry; live magnifier disappears on release',
                      'PASS equal palette thirds and normal synced deletion clear selection and pointer state',
                      'PASS long press reopens the same annotation quick palette and color updates preserve identity',
                      'PASS long press works with Android selection mode and visible chrome',
                      'PASS note quick colors preserve content and early movement retains native dragging',
                      'PASS multitouch cancellation removes the magnifier without creating an annotation',
                      'PASS: all annotation tool regressions']:
            assert check in tools, check
        assert 'Error' not in tools and 'AssertionError' not in tools
        share_test = ET.parse(native_xml.parent / 'TEST-org.zotero.android.screens.reader.DocumentSharingTest.xml').getroot()
        assert share_test.get('tests') == '2'
        assert share_test.get('failures') == share_test.get('errors') == share_test.get('skipped') == '0'
        share = (root/'app/src/main/java/org/zotero/android/helpers/DocumentSharing.kt').read_text()
        assert 'FLAG_GRANT_READ_URI_PERMISSION' in share and 'FLAG_GRANT_WRITE_URI_PERMISSION' not in share
        assert 'ClipData.newRawUri' in share and 'ACTION_SEND' in share
        screen = (root/'app/src/main/java/org/zotero/android/screens/reader/annotation/ReaderAnnotationScreen.kt').read_text()
        assert '.background(MaterialTheme.colorScheme.surface)\n            .windowInsetsPadding' in screen
        assert 'WindowInsets.displayCutout' in screen
    if args.reader_recovery:
        recovery = (args.qa_directory / 'reader-fit-recovery.log').read_text()
        for check in [
            'PASS native zoom buttons and real Wrapped taps restore the complete fit without a seeded zoom origin',
            'PASS a real pinch starting outside the PDF page restores fitting',
            'PASS explicit Off forgets the old fit instead of restoring it from the overview',
            'PASS simulated camera safe area stays constant through toolbar toggles and hardware page turns in all scroll modes',
            'PASS actual Fuchs PDF keeps all four crop edges across page changes, Include/Exclude, overview recovery and reopening',
            'PASS: fit recovery and safe viewport regressions',
        ]:
            assert check in recovery, check
        assert 'AssertionError' not in recovery and 'TimeoutError' not in recovery
        thread_test = ET.parse(native_xml.parent / 'TEST-org.zotero.android.screens.reader.DocumentSharingThreadTest.xml').getroot()
        assert thread_test.get('tests') == '6'
        assert thread_test.get('failures') == thread_test.get('errors') == thread_test.get('skipped') == '0'
        vm = (root / 'app/src/main/java/org/zotero/android/screens/itemdetails/ItemDetailsViewModel.kt').read_text()
        observer = vm[vm.index('private fun setupFileObservers()'):vm.index('fun attachmentOpened(')]
        assert '.launchIn(viewModelScope)' in observer and '.launchIn(coroutineScope)' not in observer
        box = (root / 'app/src/main/java/org/zotero/android/screens/reader/ReaderBox.kt').read_text()
        assert 'WindowInsets.statusBarsIgnoringVisibility.only(WindowInsetsSides.Top)' in box
        assert 'val cutout = WindowInsets.displayCutout' in box
        assert 'val safeInsets = if (hasCutout)' in box and '.union(cutout)' in box
        assert 'else WindowInsets(0, 0, 0, 0)' in box
        assert 'ReaderWebView(viewModel = viewModel, modifier = readingModifier)' in box
        web = (root / 'app/src/main/java/org/zotero/android/screens/reader/ReaderWebView.kt').read_text()
        assert 'modifier = modifier' in web
    qa = dict(reader_tests=reader_tests, native_logic_tests=int(native.get('tests')),
              native_tests_total=sum(int(s.get('tests', 0)) for s in native_suites),
              native_test_suites=len(native_suites),
              native_tests_skipped=sum(int(s.get('skipped', 0)) for s in native_suites),
              browser_features_passed=True, browser_gestures_passed=True)
    if args.fitting_update:
        qa['browser_fitting_passed'] = True
    if args.reader_polish:
        qa['browser_stability_passed'] = True
    if args.reader_controls:
        qa['browser_reader_controls_passed'] = True
        qa['concrete_pdf_test_pages'] = {'hoeffe': [26, 27, 191, 192], 'kant': [369, 370, 380, 381]}
        if args.roman_references:
            qa['concrete_pdf_test_pages']['kant_roman'] = [133, 134, 140]
            qa['roman_references_verified'] = True
            qa['adaptive_label_tests'] = 3
            qa['native_buttons_device_tested'] = False

    if args.reader_recovery:
        qa['native_sharing_thread_tests'] = 6
        qa['browser_fit_recovery_passed'] = True
        qa.setdefault('concrete_pdf_test_pages', {})['fuchs'] = [6, 100, 201, 206, 207, 208, 301, 411]

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
              annotation_tools_verified=args.annotation_tools, document_sharing_verified=args.annotation_tools, cutout_background_source_verified=args.annotation_tools,
              share_main_thread_regressions_verified=args.reader_recovery, fit_recovery_verified=args.reader_recovery,
              safe_reading_viewport_source_verified=args.reader_recovery, crop_geometry_unchanged=args.reader_recovery,
              **qa, verified=True,
              physical_device_tested=False,
              motero_icon_verified=args.motero_refinement,
              fullscreen_hooks_verified=args.motero_refinement,
              palette_halves_verified=args.motero_refinement and not args.annotation_tools,
              palette_thirds_verified=args.annotation_tools, physical_sharing_tested=False, physical_cutout_tested=False)
(root / 'BUILD_VERIFICATION.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
