"""Reject stale or failed builds while allowing infrastructure-only release repairs."""
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'reuse_tested_build.py'
spec = importlib.util.spec_from_file_location('reuse', SCRIPT)
reuse = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reuse)


class BuildReuse(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git('init', '-q')
        self.git('config', 'user.name', 'Fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
        self.write('app/build.gradle.kts', 'versionCode = 307')
        self.write('.github/workflows/motero.yml', 'original')
        self.commit()
        self.before = self.git('rev-parse', 'HEAD').strip()

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.root), *args], text=True, stderr=subprocess.DEVNULL)

    def write(self, name, value):
        p = self.root / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(value)

    def commit(self):
        self.git('add', '.')
        self.git('commit', '-qm', 'fixture')

    def test_infrastructure_only_changes_preserve_the_tested_build(self):
        self.write('.github/workflows/motero.yml', 'fixed emulator setup')
        self.write('scripts/check_android_update.py', 'fixed boot diagnostics')
        self.commit()
        self.assertEqual(len(reuse.validate_changes(self.root, self.before, 'HEAD')), 2)

    def test_native_application_changes_require_a_fresh_build(self):
        self.write('app/build.gradle.kts', 'versionCode = 308')
        self.commit()
        with self.assertRaisesRegex(AssertionError, 'fresh build is required'):
            reuse.validate_changes(self.root, self.before, 'HEAD')

    def test_reader_pointer_changes_require_a_fresh_build(self):
        self.git('update-index', '--add', '--cacheinfo', '160000,' + self.before + ',reader')
        self.git('commit', '-qm', 'add reader gitlink')
        before = self.git('rev-parse', 'HEAD').strip()
        self.git('update-index', '--cacheinfo', '160000,' + before + ',reader')
        self.git('commit', '-qm', 'change reader gitlink')
        with self.assertRaisesRegex(AssertionError, 'reader'):
            reuse.validate_changes(self.root, before, 'HEAD')

    def test_source_binding_and_passed_build_are_required(self):
        expected = dict(version='1.0.0-307', version_code=307, tag='v1.0.0-307', apk='app.apk', source='source.zip')
        run = dict(head_branch='main', event='push', path='.github/workflows/motero.yml', head_sha=self.before)
        metadata = dict(expected, unsigned=True)
        snapshot = dict(expected, android_commit=self.before)
        jobs = [dict(name='build', conclusion='success')]
        reuse.validate_provenance(run, jobs, metadata, snapshot, expected)
        with self.assertRaisesRegex(AssertionError, 'did not pass'):
            reuse.validate_provenance(run, [dict(name='build', conclusion='failure')], metadata, snapshot, expected)
        with self.assertRaisesRegex(AssertionError, 'does not belong'):
            reuse.validate_provenance(run, jobs, metadata, dict(snapshot, android_commit='wrong'), expected)
        with self.assertRaisesRegex(AssertionError, 'Version mismatch'):
            reuse.validate_provenance(run, jobs, dict(metadata, version_code=306), snapshot, expected)


if __name__ == '__main__':
    unittest.main()
