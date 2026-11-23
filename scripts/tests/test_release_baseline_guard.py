"""Pure checks do not require network access, an Android SDK, or Git history."""

import importlib.util
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[1] / 'release_baseline_guard.py'
spec = importlib.util.spec_from_file_location('release_baseline_guard', SOURCE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

OLD = 'a' * 40
NEW = 'b' * 40


class ReleaseBaselineGuardTest(unittest.TestCase):
    def test_parse_versions_and_gitlink(self):
        self.assertEqual(335, mod.parse_version_code('  const val versionCode = 335 // Build\n'))
        self.assertEqual(OLD, mod.parse_reader_tree(f'160000 commit {OLD}\treader\n'))
        with self.assertRaises(ValueError):
            mod.parse_version_code('val versionCode = "335"')
        with self.assertRaises(ValueError):
            mod.parse_version_code('const val versionCode = 335\nconst val versionCode = 334')
        with self.assertRaises(ValueError):
            mod.parse_reader_tree(f'100644 blob {OLD}\treader')

    def test_current_release_and_reader_pass(self):
        self.assertEqual([], mod.evaluate(335, 335, OLD, OLD, True, 'identical'))

    def test_develop_334_is_blocked_even_if_forked_off_main(self):
        problems = mod.evaluate(335, 334, OLD, OLD, True, 'identical')
        self.assertTrue(any('versionCode 334' in p for p in problems))

    def test_stale_develop_is_blocked_after_new_main_commit(self):
        problems = mod.evaluate(335, 335, OLD, OLD, False, 'identical')
        self.assertTrue(any('NOT an ancestor' in p for p in problems))

    def test_newer_reader_is_allowed_if_descendant(self):
        self.assertEqual([], mod.evaluate(335, 336, OLD, NEW, True, 'ahead'))

    def test_old_or_diverged_reader_is_blocked(self):
        for status in ('behind', 'diverged', 'unknown', None):
            with self.subTest(status=status):
                self.assertTrue(mod.evaluate(335, 335, OLD, NEW, True, status))

    def test_missing_pins_fail_closed(self):
        self.assertTrue(mod.evaluate(335, 335, 'garbled', NEW, True, 'ahead'))


if __name__ == '__main__':
    unittest.main()
