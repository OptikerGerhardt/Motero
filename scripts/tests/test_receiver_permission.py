"""Exercise the release check against actual DEX/manifest output and an old-key fixture."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(os.environ.get('MOTERO_TEST_BUILD_TOOLS', '/workspace/android-sdk/build-tools/36.0.0'))
APK = Path(os.environ.get('MOTERO_TEST_UNSIGNED_APK', str(ROOT / 'app/build/outputs/apk/dev/release/app-dev-release-unsigned.apk')))


class ReceiverPermissionMigration(unittest.TestCase):
    def verify(self, apk):
        return subprocess.run([sys.executable, str(ROOT / 'scripts/verify_receiver_permission.py'),
            '--apk', str(apk), '--build-tools', str(TOOLS)], capture_output=True, text=True)

    def test_release_manifest_and_androidx_use_the_same_new_permission(self):
        result = self.verify(APK)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(json.loads(result.stdout)['receiver_permission_verified'])

    def test_redeclaring_the_legacy_permission_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            subprocess.run([sys.executable, str(ROOT / 'scripts/create_update_probes.py'),
                '--build-tools', str(TOOLS), '--output', directory], capture_output=True, check=True)
            result = self.verify(Path(directory) / 'LegacyTest303.apk')
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Legacy signature permission would block certificate rotation', result.stderr)


if __name__ == '__main__':
    unittest.main()
