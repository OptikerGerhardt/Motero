"""Exercise publication refusals using real APK/signing tools without the production key."""
import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(os.environ.get('MOTERO_TEST_BUILD_TOOLS','/workspace/android-sdk/build-tools/36.0.0'))
APK = Path(os.environ.get('MOTERO_TEST_UNSIGNED_APK',str(ROOT/'app/build/outputs/apk/dev/release/app-dev-release-unsigned.apk')))

class SigningGuards(unittest.TestCase):
    def run_command(self, script, *args, env=None):
        return subprocess.run([sys.executable,str(ROOT/'scripts'/script),*map(str,args)],env=env,capture_output=True,text=True)

    def test_missing_secret_stops_before_creating_an_apk(self):
        with tempfile.TemporaryDirectory() as d:
            output=Path(d)/'release.apk';env=os.environ.copy();env.pop('MOTERO_RELEASE_SIGNING',None)
            result=self.run_command('sign_release.py','--apk',APK,'--output',output,'--build-tools',TOOLS,env=env)
            self.assertNotEqual(result.returncode,0);self.assertIn('is missing',result.stderr)
            self.assertFalse(output.exists())

    def test_known_public_test_key_cannot_be_used_as_production_key(self):
        with tempfile.TemporaryDirectory() as d:
            output=Path(d)/'release.apk';env=os.environ.copy()
            env['MOTERO_RELEASE_SIGNING']=json.dumps(dict(keystore_base64=base64.b64encode((ROOT/'debug.keystore').read_bytes()).decode(),store_password='android',key_password='android',key_alias='androiddebugkey'))
            result=self.run_command('sign_release.py','--apk',APK,'--output',output,'--build-tools',TOOLS,env=env)
            self.assertNotEqual(result.returncode,0)
            self.assertFalse(output.exists(), 'Rejected signing must not leave a distributable output')

    def test_public_verifier_rejects_an_apk_signed_with_the_old_key(self):
        with tempfile.TemporaryDirectory() as d:
            legacy=Path(d)/'legacy.apk'
            subprocess.run([str(TOOLS/'apksigner'),'sign','--ks',str(ROOT/'debug.keystore'),'--ks-key-alias','androiddebugkey',
                '--ks-pass','pass:android','--out',str(legacy),str(APK)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            result=self.run_command('verify_release.py','--apk',legacy,'--build-tools',TOOLS)
            self.assertNotEqual(result.returncode,0);self.assertIn('does not match',result.stderr)

if __name__ == '__main__': unittest.main()
