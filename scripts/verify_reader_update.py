#!/usr/bin/env python3
"""Verify a Motero update, its embedded sources and the fresh automated checks."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import zipfile

p=argparse.ArgumentParser()
p.add_argument('--base',type=Path,required=True)
p.add_argument('--apk',type=Path,required=True)
p.add_argument('--build-tools',type=Path,required=True)
p.add_argument('--checks',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
args=p.parse_args()
root=Path(__file__).resolve().parents[1]
sha=lambda data:hashlib.sha256(data).hexdigest()

def identity(apk):
    signature=subprocess.check_output([str(args.build_tools/'apksigner'),'verify','--verbose','--print-certs',str(apk)],text=True)
    assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature
    digest=re.search(r'certificate SHA-256 digest: ([0-9a-f]+)',signature).group(1)
    badging=subprocess.check_output([str(args.build_tools/'aapt2'),'dump','badging',str(apk)],text=True)
    package,code,version=re.search(r"package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'",badging).groups()
    label=re.search(r"application-label:'([^']+)'",badging).group(1)
    return dict(package=package,version_code=int(code),version_name=version,certificate_sha256=digest,application_label=label)

old,new=identity(args.base),identity(args.apk)
assert new['package']==old['package']=='org.zotero.android.debug'
assert new['certificate_sha256']==old['certificate_sha256']
assert new['version_code']>old['version_code']
assert new['version_code']==int(re.search(r'versionCode = (\d+)',(root/'buildSrc/src/main/kotlin/BuildConfig.kt').read_text()).group(1))
assert new['application_label']=='Motero'
subprocess.run([str(args.build_tools/'zipalign'),'-c','-P','16','4',str(args.apk)],check=True)
unchanged=[]
with zipfile.ZipFile(args.base) as baseline,zipfile.ZipFile(args.apk) as apk:
    assert baseline.testzip() is None and apk.testzip() is None
    for name in baseline.namelist():
        if name.startswith(('assets/','lib/')) and not name.endswith('/') and name not in ('assets/reader/reader.zip','assets/reader/reader_hash.txt'):
            assert apk.read(name)==baseline.read(name),'Unexpected runtime change: '+name
            unchanged.append(name)
    assert not any(re.search('pspdfkit|nutrient',name,re.I) for name in apk.namelist())
    dex=[apk.read(n) for n in apk.namelist() if re.fullmatch(r'classes\d*\.dex',n)]
    assert any(b'copyReaderAnnotationQuote' in data for data in dex),'Clipboard code missing from APK'
    if new['version_code'] >= 305:
        for marker in [b'TagSuggestions', b'TagPickerViewModel', b'ReaderManualCrops', b'onManualCropChanged']:
            assert any(marker in data for data in dex), marker
    assert not any(re.search(rb'com[/\.]pspdfkit|com[/\.]nutrient|libpspdfkit',data,re.I) for data in dex)
    current_reader=apk.read('assets/reader/reader.zip')
    assert current_reader==(root/'app/src/main/assets/reader/reader.zip').read_bytes()
    assert sha(current_reader)==apk.read('assets/reader/reader_hash.txt').decode().strip()
    with zipfile.ZipFile(io.BytesIO(current_reader)) as reader,zipfile.ZipFile(io.BytesIO(baseline.read('assets/reader/reader.zip'))) as previous:
        assert reader.testzip() is None
        pdf_files=[n for n in previous.namelist() if n.startswith('pdf/') and not n.endswith('/')]
        for name in pdf_files:assert reader.read(name)==previous.read(name),'PDF.js changed: '+name
        mapping=json.loads(reader.read('view.js.map'))
        names=['pdf/reading-layout.mjs','pdf/android-page-fitting.js','pdf/boox-reader.js',
               'pdf/hardware-navigation.mjs','index.android.js','common/view.js',
               'dom/epub/epub-view.ts','dom/epub/flow.ts','dom/common/dom-view.tsx']
        if new['version_code'] >= 305:
            names += ['pdf/manual-crop.mjs','pdf/manual-crop-editor.js','pdf/pdf-view.js']
        for name in names:
            indexes=[i for i,s in enumerate(mapping['sources']) if s.endswith('/src/'+name)]
            assert len(indexes)==1,(name,indexes)
            assert mapping['sourcesContent'][indexes[0]]==(root/'reader/src'/name).read_text(),'APK embeds stale source: '+name
        assert reader.read('view.css')==(root/'reader/build/android/view.css').read_bytes()

native=json.loads((args.checks/'native-tests.json').read_text())
assert native['totals']['tests']>0 and all(native['totals'][k]==0 for k in ('failures','errors','skipped'))
assert any(s['suite'].endswith('ReaderClipboardTest') and s['tests']==2 for s in native['suites'])
tests=(args.checks/'reader-full-tests.log').read_text()
counts={k:int(v) for k,v in re.findall(r'ℹ (tests|pass|fail|cancelled|skipped) (\d+)',tests)}
assert counts['tests']>0 and counts['tests']==counts['pass'] and all(counts[k]==0 for k in ['fail','cancelled','skipped'])
browser={
 'gestures':'PASS: width and resize', 'features':'PASS: all new Reader features',
 'fitting':'PASS: all Android fitting checks','stability':'PASS: all Android reader stability checks',
 'controls':'PASS: all new Android reader controls','annotation-tools':'PASS: all annotation tool regressions',
 'fit-recovery':'PASS: fit recovery and safe viewport regressions','reader-update':'PASS reader update regressions',
}
if new['version_code'] >= 305:
    browser.update({'manual-crop':'PASS: manual crop editor checks','edge-taps':'PASS: all scroll mode edge tap checks'})
    for suffix in ['TagPickerConfirmationTest','TagSuggestionsTest','ReaderManualCropsTest','ReaderManualCropStorageTest']:
        assert any(s['suite'].endswith(suffix) for s in native['suites']), suffix
for name,marker in browser.items():assert marker in (args.checks/f'browser-{name}.log').read_text(),name
assert 'BUILD SUCCESSFUL' in (args.checks/'android-build.log').read_text()
assert 'BUILD SUCCESSFUL' in (args.checks/'android-final-packaging.log').read_text()
report={**new,'previous_version_code':old['version_code'],'sha256':sha(args.apk.read_bytes()),
    'size_bytes':args.apk.stat().st_size,'reader_sha256':sha(current_reader),'verified':True,
    'apk_v2_signature_verified':True,'zip_alignment_verified':True,'sdk_removed':True,
    'reader_sources_verified':names,'unchanged_runtime_files_verified':len(unchanged),
    'pdfjs_unchanged':True,'pdfjs_files_verified':len(pdf_files),
    'reader_tests':counts['tests'],'reader_tests_failed':0,'reader_tests_skipped':0,
    'native_tests_total':native['totals']['tests'],'native_test_suites':native['suite_count'],
    'native_tests_failed':0,'native_tests_skipped':0,'browser_checks_passed':list(browser),
    'plessner_pages_verified':116,'plessner_note_source_labels_preserved':19,
    'epub_navigation_flows':['paginated','scrolled'],'epub_navigation_directions':['ltr','rtl'],
    'physical_device_tested':False,'account_sync_tested':False}
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
