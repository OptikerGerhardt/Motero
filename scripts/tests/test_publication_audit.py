"""Check history leaks, exact fixture exceptions and nested release archives."""
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

SCRIPT = Path(__file__).resolve().parents[1] / 'audit_publication.py'
spec = importlib.util.spec_from_file_location('publication_audit', SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class PublicationAudit(unittest.TestCase):
    def test_public_fixture_exception_is_content_bound(self):
        data = (audit.ROOT / 'debug.keystore').read_bytes()
        exceptions = json.loads((audit.ROOT / 'scripts/publication-exceptions.json').read_text())
        self.assertTrue(audit.inspect('debug.keystore', data, exceptions)['allowed_public_fixture'])
        self.assertFalse(audit.inspect('debug.keystore', data + b'changed', exceptions)['allowed_public_fixture'])

    def test_deleted_secret_in_history_and_nested_archive_are_blocked(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.run(['git', '-C', directory, *args], check=True, capture_output=True)
            git('init', '-q')
            git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
            token = 'gh' + 'p_' + 'A' * 36
            (root / 'deleted.txt').write_text(token)
            git('add', '.'); git('commit', '-qm', 'fixture with leak')
            git('rm', 'deleted.txt'); git('commit', '-qm', 'remove file')
            nested = io.BytesIO()
            with zipfile.ZipFile(nested, 'w') as archive:
                archive.writestr('private.pem', '-----BEGIN ' + 'PRIVATE KEY-----')
            outer = root / 'release.zip'
            with zipfile.ZipFile(outer, 'w') as archive:
                archive.writestr('inner.zip', nested.getvalue())
            report = root / 'report.json'
            result = subprocess.run([sys.executable, str(SCRIPT), '--repository', directory,
                '--archive', str(outer), '--output', str(report)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            value = json.loads(report.read_text())
            self.assertGreaterEqual(value['unreviewed_findings'], 2)  # Stored ZIP bytes can also match in their container.
            self.assertTrue(any(item['path'] == 'deleted.txt' for item in value['findings']))
            self.assertNotIn(token, result.stdout)
            self.assertTrue(any('inner.zip!private.pem' in item['path'] for item in value['findings']))


if __name__ == '__main__':
    unittest.main()
