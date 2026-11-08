#!/usr/bin/env python3
"""Exercise real PackageManager migration and data retention on an owned emulator only."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
import uuid

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--adb', type=Path, required=True)
parser.add_argument('--serial', default='emulator-5554')
parser.add_argument('--baseline-apk', type=Path, required=True)
parser.add_argument('--candidate-apk', type=Path, required=True)
parser.add_argument('--rejected-apk', type=Path)
parser.add_argument('--current-baseline-apk', type=Path)
parser.add_argument('--rollback-probe-apk', type=Path, required=True)
parser.add_argument('--legacy-client-apk', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--boot-timeout', type=int, default=600)
parser.add_argument('--emulator-pid', type=int)
parser.add_argument('--emulator-log', type=Path)
args = parser.parse_args()
assert args.serial.startswith('emulator-'), 'Refusing to modify a physical device'
package = 'org.zotero.android.debug'
permission = package + '.MOTERO_DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'


def adb(*values, check=True, input=None, timeout=50):
    result = subprocess.run([str(args.adb), '-s', args.serial, *map(str, values)],
        input=input, capture_output=True, text=True, timeout=timeout)
    if check and result.returncode:
        raise RuntimeError('adb command failed: ' + result.stdout + result.stderr)
    return result


deadline = time.monotonic() + args.boot_timeout
def boot_failure(message):
    detail = message
    if args.emulator_log and args.emulator_log.exists():
        detail += '\n' + args.emulator_log.read_text(errors='replace')[-12000:]
    if os.environ.get('GITHUB_ACTIONS') == 'true':
        print('::error title=Android emulator startup::' + detail.replace('%','%25').replace('\r','%0D').replace('\n','%0A'), flush=True)
    raise SystemExit(detail)

while time.monotonic() < deadline:
    if args.emulator_pid:
        try:
            state = Path('/proc/' + str(args.emulator_pid) + '/stat').read_text().split(') ', 1)[1][0]
            if state == 'Z':
                boot_failure('Emulator exited before boot completed')
        except FileNotFoundError:
            boot_failure('Emulator exited before boot completed')
    result = adb('shell', 'getprop', 'sys.boot_completed', check=False, timeout=10)
    if result.returncode == 0 and result.stdout.strip() == '1':
        break
    time.sleep(3)
else:
    boot_failure('Emulator did not finish booting within the test deadline')
assert adb('shell', 'getprop', 'ro.kernel.qemu').stdout.strip() == '1', 'Emulator identity check failed'
adb('root')
adb('wait-for-device')
assert adb('shell', 'id', '-u').stdout.strip() == '0', 'A rooted AOSP test image is required'


def install(path, expected_error=None):
    result = adb('install', '--no-streaming', '-r', '-t', path, check=False, timeout=300)
    text = result.stdout + result.stderr
    if expected_error:
        assert result.returncode and expected_error in text, text
        print('Expected refusal:', expected_error, flush=True)
    else:
        assert result.returncode == 0 and 'Success' in text, text
        print('Installed:', Path(path).name, flush=True)
    return text


install(args.baseline_apk)
data = '/data/user/0/' + package
owner_before = adb('shell', 'stat', '-c', '%u', data).stdout.strip()
marker = 'motero-migration-' + uuid.uuid4().hex
adb('shell', 'run-as', package, 'mkdir', '-p', 'files')
adb('shell', '-T', 'run-as', package, 'tee', 'files/motero-update-probe.txt', input=marker)
marker_path = data + '/files/motero-update-probe.txt'
assert adb('shell', 'cat', marker_path).stdout == marker
rejection = None
if args.rejected_apk:
    rejection = install(args.rejected_apk, 'INSTALL_FAILED_DUPLICATE_PERMISSION')
    assert adb('shell', 'cat', marker_path).stdout == marker

install(args.candidate_apk)
assert adb('shell', 'cat', marker_path).stdout == marker, 'Existing private app data was lost'
owner_after = adb('shell', 'stat', '-c', '%u', data).stdout.strip()
assert owner_before == owner_after, 'Application UID changed during the update'
candidate_dump = adb('shell', 'dumpsys', 'package', package).stdout
version = int(re.search(r'versionCode=(\d+)', candidate_dump).group(1))
assert re.search(re.escape(permission) + r': granted=true', candidate_dump), 'New internal permission was not granted'
def launch_and_check():
    adb('logcat', '-b', 'crash', '-c')
    launch = adb('shell', 'am', 'start', '-n', package + '/org.zotero.android.screens.root.RootActivity')
    assert 'Error:' not in launch.stdout + launch.stderr, launch.stdout + launch.stderr
    # RootActivity immediately forwards to login/dashboard; am start -W may time out
    # waiting for the already-finished forwarding activity even after a valid launch.
    deadline = time.monotonic() + 90
    while time.monotonic() < deadline:
        activities = adb('shell', 'dumpsys', 'activity', 'activities').stdout
        if re.search(r'(?:topResumedActivity=|mResumedActivity:|ResumedActivity:)[^\n]*' + re.escape(package) + '/', activities):
            break
        time.sleep(2)
    else:
        raise AssertionError('The updated app did not reach a resumed activity')
    time.sleep(3)
    assert adb('shell', 'pidof', package).stdout.strip(), 'Updated app crashed during startup'
    crashes = adb('logcat', '-d', '-b', 'crash').stdout
    assert not re.search(r'(?:Process: |Cmdline: )' + re.escape(package), crashes), 'Updated app crashed during startup'

launch_and_check()
install(args.rollback_probe_apk, 'INSTALL_FAILED_UPDATE_INCOMPATIBLE')
assert adb('shell', 'cat', marker_path).stdout == marker
install(args.legacy_client_apk)
client_dump = adb('shell', 'dumpsys', 'package', 'org.motero.test.legacyclient').stdout
assert permission in client_dump, 'Probe did not request the internal permission'
assert not re.search(re.escape(permission) + r': granted=true', client_dump), 'The public old key gained the private receiver permission'

current_update = None
if args.current_baseline_apk:
    # This test owns the guarded, rooted emulator. Reset only its test install.
    adb('uninstall', package)
    install(args.current_baseline_apk)
    owner = adb('shell', 'stat', '-c', '%u', data).stdout.strip()
    adb('shell', 'mkdir', '-p', data + '/files')
    adb('shell', '-T', 'tee', marker_path, input=marker)
    adb('shell', 'chown', '-R', owner + ':' + owner, data + '/files')
    adb('shell', 'restorecon', '-RF', data + '/files')
    install(args.candidate_apk)
    launch_and_check()
    assert adb('shell', 'cat', marker_path).stdout == marker
    assert adb('shell', 'stat', '-c', '%u', data).stdout.strip() == owner
    install(args.rollback_probe_apk, 'INSTALL_FAILED_UPDATE_INCOMPATIBLE')
    current_update = {'baseline_sha256': hashlib.sha256(args.current_baseline_apk.read_bytes()).hexdigest(),
        'private_data_marker_preserved': True, 'application_uid_preserved': True, 'updated_app_started': True, 'old_key_update_rejected': True}

report = {'passed': True, 'android_api': int(adb('shell', 'getprop', 'ro.build.version.sdk').stdout),
    'emulator_only': True, 'version_code': version, 'candidate_sha256': hashlib.sha256(args.candidate_apk.read_bytes()).hexdigest(),
    'legacy_duplicate_permission_failure_reproduced': rejection is not None,
    'private_data_marker_preserved': True, 'application_uid_preserved': True,
    'updated_app_started': True,
    'old_key_update_rejected': True, 'old_key_client_permission_denied': True,
    'receiver_permission': permission, 'current_release_update': current_update}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report), flush=True)
