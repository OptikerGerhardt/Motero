#!/usr/bin/env python3
"""Exercise side-by-side install, Beta update and signature refusal on a disposable AOSP emulator."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
STABLE = 'org.zotero.android.debug'
BETA = 'org.zotero.android.beta'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adb', type=Path, required=True)
    parser.add_argument('--serial', required=True)
    parser.add_argument('--build-tools', type=Path, required=True)
    parser.add_argument('--stable-apk', type=Path, required=True)
    parser.add_argument('--beta-apk', type=Path, required=True)
    parser.add_argument('--beta-build', type=int, required=True)
    parser.add_argument('--secret-file', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    assert re.fullmatch(r'emulator-\d+', args.serial), 'Use a disposable Android emulator'
    assert args.beta_build > 1

    def run(*command, check=True, timeout=180, env=None):
        return subprocess.run(command, check=check, timeout=timeout, env=env, capture_output=True, text=True)

    def adb(*command, check=True, timeout=180):
        return run(args.adb, '-s', args.serial, *command, check=check, timeout=timeout)

    def install(apk, expected=None):
        result = adb('install', '--no-streaming', '-r', apk, check=False, timeout=360)
        log = result.stdout + result.stderr
        if expected:
            assert result.returncode and expected in log, log
        else:
            assert result.returncode == 0 and 'Success' in log, log
        print(apk.name, expected or 'installed', flush=True)

    def installed_version(package):
        info = adb('shell', 'dumpsys', 'package', package).stdout
        return int(re.search(r'\bversionCode=(\d+)', info).group(1))

    deadline = time.monotonic() + 900
    while time.monotonic() < deadline:
        try:
            started = adb('shell', 'getprop', 'sys.boot_completed', check=False, timeout=8)
            if started.returncode == 0 and started.stdout.strip() == '1':
                break
        except subprocess.TimeoutExpired:
            pass
        time.sleep(3)
    else:
        raise SystemExit('Disposable emulator did not finish booting')
    assert adb('shell', 'getprop', 'ro.kernel.qemu').stdout.strip() == '1'
    api = int(adb('shell', 'getprop', 'ro.build.version.sdk').stdout.strip())
    assert api in (31, 35), f'Unexpected emulator API {api}'
    adb('root')
    adb('wait-for-device')
    assert adb('shell', 'id', '-u').stdout.strip() == '0'
    for package in (STABLE, BETA):
        assert not adb('shell', 'pm', 'list', 'packages', package).stdout.strip(), 'Use an empty AVD'

    stable_policy = json.loads((ROOT / 'signing/release-policy.json').read_text())
    cert = run(args.build_tools / 'apksigner', 'verify', '--print-certs', args.stable_apk).stdout
    assert 'certificate SHA-256 digest: ' + stable_policy['certificate_sha256'] in cert
    install(args.stable_apk)

    def private_marker(package):
        data = '/data/user/0/' + package
        directory = data + '/files'
        path = directory + '/motero-beta-probe.txt'
        uid = adb('shell', 'stat', '-c', '%u', data).stdout.strip()
        assert int(uid) >= 10000, uid
        marker = uuid.uuid4().hex
        adb('shell', 'mkdir', '-p', directory)
        adb('shell', f'printf %s {marker} > {path} && chown {uid}:{uid} {directory} {path}')
        return data, path, uid, marker

    def check_marker(data, path, uid, marker):
        assert adb('shell', 'stat', '-c', '%u', data).stdout.strip() == uid
        assert adb('shell', 'cat', path).stdout == marker

    stable_version = installed_version(STABLE)
    stable_marker = private_marker(STABLE)
    stable_path = adb('shell', 'pm', 'path', STABLE).stdout.strip()
    secret = json.loads(args.secret_file.read_text())
    with tempfile.TemporaryDirectory(prefix='motero-beta-fixtures-') as directory:
        temporary = Path(directory)
        key_store = temporary / 'beta.p12'
        key_store.write_bytes(base64.b64decode(secret['keystore_base64'], validate=True))
        key_store.chmod(0o600)
        sign_env = dict(os.environ, MOTERO_BETA_FIXTURE_STORE=secret['store_password'],
                        MOTERO_BETA_FIXTURE_KEY=secret['key_password'])
        android_jar = args.build_tools.parents[1] / 'platforms/android-37.0/android.jar'

        def fixture(name, build, signing_options, env=None):
            manifest = temporary / 'AndroidManifest.xml'
            manifest.write_text(f'''<manifest xmlns:android="http://schemas.android.com/apk/res/android"
                package="{BETA}" android:versionCode="{build}" android:versionName="{build}">
                <uses-sdk android:minSdkVersion="28" android:targetSdkVersion="36"/>
                <application android:label="Local Beta gate fixture" android:hasCode="false"/>
                </manifest>''')
            unsigned = temporary / 'unsigned.apk'
            apk = temporary / name
            run(args.build_tools / 'aapt2', 'link', '-I', android_jar, '--manifest', manifest, '-o', unsigned)
            run(args.build_tools / 'apksigner', 'sign', *signing_options,
                '--v1-signing-enabled', 'false', '--v2-signing-enabled', 'false',
                '--v3-signing-enabled', 'true', '--out', apk, unsigned, env=env)
            return apk

        prior = fixture('BetaUpdateBaseline.apk', args.beta_build - 1,
            ['--ks', key_store, '--ks-key-alias', secret['key_alias'],
             '--ks-pass', 'env:MOTERO_BETA_FIXTURE_STORE', '--key-pass', 'env:MOTERO_BETA_FIXTURE_KEY'], sign_env)
        rejected = fixture('WrongBetaSigner.apk', args.beta_build + 1,
            ['--ks', ROOT / 'debug.keystore', '--ks-key-alias', 'androiddebugkey', '--ks-pass', 'pass:android'])
        install(prior)
        beta_marker = private_marker(BETA)
        assert beta_marker[2] != stable_marker[2], 'Expected separate application sandboxes'
        install(args.beta_apk)
        assert installed_version(BETA) == args.beta_build
        check_marker(*beta_marker)
        install(rejected, 'INSTALL_FAILED_UPDATE_INCOMPATIBLE')
        assert installed_version(BETA) == args.beta_build
        check_marker(*beta_marker)
        check_marker(*stable_marker)
        assert adb('shell', 'pm', 'path', STABLE).stdout.strip() == stable_path
        assert installed_version(STABLE) == stable_version

    adb('logcat', '-b', 'crash', '-c')
    launch = adb('shell', 'am', 'start', '-n', BETA + '/org.zotero.android.screens.root.RootActivity')
    assert 'Error:' not in launch.stdout + launch.stderr
    deadline = time.monotonic() + 150
    while time.monotonic() < deadline:
        activity = adb('shell', 'dumpsys', 'activity', 'activities').stdout
        if re.search(r'(?:topResumedActivity=|mResumedActivity:|ResumedActivity:)[^\n]*' + re.escape(BETA) + '/', activity):
            break
        time.sleep(2)
    else:
        raise SystemExit('Beta did not reach a foreground activity: ' + adb('logcat', '-d', '-b', 'crash').stdout[-2000:])
    assert BETA not in adb('logcat', '-d', '-b', 'crash').stdout
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result = dict(android_api=api, stable_version=stable_version, beta_version=args.beta_build,
        beta_sha256=hashlib.sha256(args.beta_apk.read_bytes()).hexdigest(), parallel_install=True,
        separate_application_uids=True, prior_beta_data_retained=True, stable_data_retained=True,
        public_test_key_update_rejected=True, beta_launch_verified=True, baseline='synthetic previous Beta')
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result), flush=True)


if __name__ == '__main__':
    main()
