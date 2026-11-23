"""Check release rules and squash integration using a disposable Git repository."""

import importlib.util
import os
from pathlib import Path
import tempfile
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

    def test_stale_develop_is_blocked_after_new_release(self):
        problems = mod.evaluate(335, 335, OLD, OLD, False, 'identical')
        self.assertTrue(any('no verified checkpoint' in p for p in problems))

    def test_newer_reader_is_allowed_if_descendant(self):
        self.assertEqual([], mod.evaluate(335, 336, OLD, NEW, True, 'ahead'))

    def test_old_or_diverged_reader_is_blocked(self):
        for status in ('behind', 'diverged', 'unknown', None):
            with self.subTest(status=status):
                self.assertTrue(mod.evaluate(335, 335, OLD, NEW, True, status))

    def test_missing_pins_fail_closed(self):
        self.assertTrue(mod.evaluate(335, 335, 'garbled', NEW, True, 'ahead'))


class SquashCheckpointTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        previous = Path.cwd()
        self.addCleanup(os.chdir, previous)
        os.chdir(directory.name)
        mod.git('init', '-b', 'main')
        mod.git('config', 'user.name', 'Motero Test')
        mod.git('config', 'user.email', 'test@example.invalid')
        self.commit('reader-fix', 'base')
        mod.git('branch', 'develop')
        self.released = self.commit('reader-fix', 'published fix')
        mod.git('checkout', 'develop')
        self.commit('emulator', 'develop-only test')

    def commit(self, filename, content):
        path = Path(filename)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content + '\n', encoding='utf-8')
        mod.git('add', filename)
        mod.git('commit', '-m', filename)
        return mod.git('rev-parse', 'HEAD').stdout.strip()

    def sync(self):
        mod.git('merge', '--squash', self.released)
        return self.commit(mod.BASELINE_MARKER, self.released)

    def test_uncopied_content_with_matching_marker_is_rejected(self):
        invalid = self.commit(mod.BASELINE_MARKER, self.released)
        self.assertIsNone(mod.verified_checkpoint(self.released, invalid))

    def test_squashed_release_and_later_changes_are_accepted(self):
        synced = self.sync()
        self.assertFalse(mod.is_ancestor(self.released, synced))
        self.assertEqual(synced, mod.verified_checkpoint(self.released, synced))
        self.assertTrue(Path('emulator').exists())
        follow_up = self.commit('reader-fix', 'follow-up fix')
        self.assertEqual(synced, mod.verified_checkpoint(self.released, follow_up))

    def test_synthetic_pull_request_merge_keeps_the_squash_checkpoint(self):
        mod.git('checkout', '-b', 'sync')
        proposed = self.sync()
        mod.git('checkout', 'develop')
        mod.git('merge', '--no-ff', proposed)
        merge = mod.git('rev-parse', 'HEAD').stdout.strip()
        self.assertIsNotNone(mod.verified_checkpoint(self.released, merge))

    def test_new_release_invalidates_old_checkpoint(self):
        synced = self.sync()
        mod.git('checkout', 'main')
        next_release = self.commit('changes', 'subsequent publication')
        self.assertIsNone(mod.verified_checkpoint(next_release, synced))


if __name__ == '__main__':
    unittest.main()
