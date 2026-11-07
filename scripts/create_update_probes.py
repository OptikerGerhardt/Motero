#!/usr/bin/env python3
"""Build development-signed emulator fixtures outside all publication directories."""
import argparse
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--build-tools', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
android_jar = args.build_tools.parents[1] / 'platforms/android-37.0/android.jar'
package = 'org.zotero.android.debug'
legacy = package + '.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
current = package + '.MOTERO_DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
probes = [
    ('LegacyTest303.apk', package, 303, f'<permission android:name="{legacy}" android:protectionLevel="signature"/><uses-permission android:name="{legacy}"/>'),
    ('RejectedOldKey9999.apk', package, 9999, ''),
    ('UntrustedLegacyClient.apk', 'org.motero.test.legacyclient', 1, f'<uses-permission android:name="{current}"/>'),
]
for filename, application_id, version, permissions in probes:
    with tempfile.TemporaryDirectory(prefix='motero-update-probe-') as directory:
        temp = Path(directory)
        manifest = temp / 'AndroidManifest.xml'
        manifest.write_text(f'''<manifest xmlns:android="http://schemas.android.com/apk/res/android"
            package="{application_id}" android:versionCode="{version}" android:versionName="1.0.0-{version}">
            <uses-sdk android:minSdkVersion="28" android:targetSdkVersion="36"/>
            {permissions}
            <application android:label="Local migration test fixture" android:hasCode="false" android:debuggable="true"/>
        </manifest>''')
        unsigned, aligned = temp / 'unsigned.apk', temp / 'aligned.apk'
        subprocess.run([str(args.build_tools / 'aapt2'), 'link', '-I', str(android_jar),
            '--manifest', str(manifest), '-o', str(unsigned)], check=True)
        subprocess.run([str(args.build_tools / 'zipalign'), '-P', '16', '4', str(unsigned), str(aligned)], check=True)
        subprocess.run([str(args.build_tools / 'apksigner'), 'sign', '--ks', str(ROOT / 'debug.keystore'),
            '--ks-key-alias', 'androiddebugkey', '--ks-pass', 'pass:android',
            '--out', str(args.output / filename), str(aligned)], check=True)
print('Created public-development-key fixtures for emulator testing only; never publish these APKs.')
