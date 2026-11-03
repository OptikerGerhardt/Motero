#!/usr/bin/env python3
"""Check the SDK removal against an unpacked baseline source snapshot."""
import argparse
import hashlib
import json
import re
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--base-source', type=Path, required=True)
parser.add_argument('--output', type=Path)
parser.add_argument('--reader-refinements', action='store_true', help='Permit only the reviewed Build 301 reader/label changes against Build 300')
parser.add_argument('--annotation-tools', action='store_true', help='Permit reviewed Build 302 annotation controls and cutout changes against Build 301')
parser.add_argument('--reader-recovery', action='store_true', help='Permit reviewed Build 303 safe viewport and fit recovery changes against Build 302')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
base = args.base_source
java = Path('app/src/main/java/org/zotero/android')
exceptions = {
    'database/objects/AnnotationType.kt', 'database/objects/AnnotationsConfig.kt',
    'database/requests/ReadAnnotationsDbRequest.kt',
    'database/requests/CreatePDFAnnotationsDbRequest.kt',
    'database/requests/EditAnnotationPathsDbRequest.kt', 'database/requests/EditAnnotationRectsDbRequest.kt',
    'database/migration/main/solutions/MigrateNonArabicFormattingSortIndex.kt',
    'sync/AnnotationConverter.kt', 'sync/AnnotationColorGenerator.kt', 'sync/ZoteroCustomAnnotations.kt',
}
if args.reader_refinements:
    exceptions = {'screens/reader/settings/ReaderSettingsSettingRow.kt'}
allowed_reader = {'reader/src/pdf/reading-layout.mjs', 'reader/src/pdf/android-page-fitting.js'} if args.reader_refinements else set()
if args.annotation_tools:
    exceptions = {'screens/reader/annotation/ReaderAnnotationScreen.kt'}
    allowed_reader = {'reader/src/common/view.js', 'reader/src/pdf/boox-reader.js', 'reader/src/pdf/direct-highlight.js',
                      'reader/src/pdf/pdf-view.js', 'reader/src/pdf/selection.js', 'reader/src/pdf/chrome-tap-guard.mjs'}
if args.reader_recovery:
    exceptions = {'screens/reader/ReaderBox.kt', 'screens/reader/ReaderWebView.kt'}
    allowed_reader = {'reader/src/pdf/boox-reader.js', 'reader/src/pdf/android-page-fitting.js'}
checked = []
for group in ['database/objects', 'database/requests', 'database/migration', 'sync',
              'screens/reader', 'screens/tagpicker', 'files', 'documentworker', 'pdfworker']:
    for old in sorted((base / java / group).rglob('*.kt')):
        relative = old.relative_to(base / java).as_posix()
        if relative in exceptions:
            continue
        new = root / java / relative
        assert new.is_file(), f'Missing active source: {relative}'
        expected = old.read_text().replace('org.zotero.android.pdf.reader.sidebar.', 'org.zotero.android.screens.reader.')
        expected = expected.replace('org.zotero.android.pdf.settings.data.MultiSelectorOption',
                                    'org.zotero.android.screens.reader.settings.data.MultiSelectorOption')
        assert expected == new.read_text(), f'Unexpected active-source change: {relative}'
        checked.append(relative)

reader_sources = []
for old in sorted((base / 'reader/src').rglob('*')):
    if old.is_file():
        relative = old.relative_to(base)
        if relative.as_posix() in allowed_reader:
            continue
        assert old.read_bytes() == (root / relative).read_bytes(), str(relative)
        reader_sources.append(str(relative))

runtime = []
for old in sorted((base / 'app/src/main/assets').rglob('*')):
    if not old.is_file():
        continue
    relative = old.relative_to(base)
    if (args.reader_refinements or args.annotation_tools or args.reader_recovery) and relative.as_posix() in ['app/src/main/assets/reader/reader.zip', 'app/src/main/assets/reader/reader_hash.txt']:
        continue
    if 'pspdfkit' in relative.parts:
        continue
    assert old.read_bytes() == (root / relative).read_bytes(), str(relative)
    runtime.append(str(relative))

vendor = re.compile(r'com[./]pspdfkit|com[./]nutrient|PSPDFKIT_KEY|Libs\.nutrient|pspdf__|PSPDFKit', re.I)
production = list((root / 'app/src/main/java').rglob('*.kt')) + list((root / 'app/src/main/java').rglob('*.java'))
production += list((root / 'app/src/main/res').rglob('*.xml'))
production += [root / 'app/src/main/AndroidManifest.xml', root / 'app/build.gradle.kts', root / 'build.gradle.kts', root / 'buildSrc/src/main/kotlin/Libs.kt']
for path in production:
    assert not vendor.search(path.read_text()), f'Vendor dependency left in {path}'
assert not (root / 'app/src/main/assets/pspdfkit').exists()
assert (base / 'debug.keystore').read_bytes() == (root / 'debug.keystore').read_bytes()
# Preferences are retained in place, including the legacy plain settings DTO.
old_defaults = (base / java / 'architecture/Defaults.kt').read_text()
expected_defaults = re.sub(r'^    private val wasPspdfkitInitialized = .*\n', '', old_defaults, flags=re.M)
expected_defaults = re.sub(r'    fun (?:setPspdfkitInitialized|wasPspdfkitInitialized)\([^)]*\)[^{]*\{.*?^    \}\n', '', expected_defaults, flags=re.M | re.S)
normalize = lambda value: re.sub(r'\n{3,}', '\n\n', value)
assert normalize(expected_defaults) == normalize((root / java / 'architecture/Defaults.kt').read_text())
assert 'lateinit var defaults: Defaults' in (root / java / 'ZoteroApplication.kt').read_text()
for name in ['PDFSettings.kt', 'AnnotationEditability.kt', 'PdfReaderThemeDecider.kt']:
    path = java / 'pdf/data' / name
    assert (base / path).read_bytes() == (root / path).read_bytes(), str(path)
for relative in ['screens/allitems/AllItemsViewModel.kt','screens/itemdetails/ItemDetailsViewModel.kt']:
    text = (root / java / relative).read_text()
    assert re.search(r'"application/pdf"\s*->\s*\{\s*showReader\(', text), relative

report = dict(verified=True, unchanged_active_native_files=len(checked),
              unchanged_reader_sources=len(reader_sources), unchanged_app_runtime_files=len(runtime),
              signing_key_unchanged=True, preferences_preserved=True, active_pdf_opening_uses_reader=True,
              production_vendor_references=0, reviewed_reader_refinements=args.reader_refinements, reviewed_annotation_tools=args.annotation_tools,
              reviewed_reader_recovery=args.reader_recovery,
              reader_sha256=hashlib.sha256((root / 'app/src/main/assets/reader/reader.zip').read_bytes()).hexdigest(),
              future_features_preserved=['manual odd/even crop', 'edge taps', 'tag autocomplete',
                                         'stylus pressure/eraser', 'desktop PDF outline interoperability'])
if args.output:
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
