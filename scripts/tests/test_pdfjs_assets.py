"""Refuse mixed engine versions or stale source pins before packaging the APK."""
import copy
import hashlib
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('pdfjs_assets', Path(__file__).resolve().parents[1] / 'pdfjs_assets.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)


class EngineIntegrity(unittest.TestCase):
    def setUp(self):
        self.commit = '123456789abcdef'
        self.compatibility = b'// compatibility\n'
        self.files = {name: self.compatibility + b'/* pdfjsVersion = 5.7.330\n * pdfjsBuild = 123456789\n */' for name in assets.BUNDLES}
        self.manifest = dict(commit=self.commit, version='5.7.330', build='123456789',
            files={name: hashlib.sha256(data).hexdigest() for name, data in self.files.items()})

    def check(self, manifest=None):
        assets.validate_engine(manifest or self.manifest, self.files, self.commit, self.compatibility)

    def test_matching_bundle(self):
        self.check()

    def test_hash_valid_worker_from_another_version_is_rejected(self):
        name = 'pdf/build/pdf.worker.mjs'
        self.files[name] = self.files[name].replace(b'5.7.330', b'5.7.328')
        self.manifest['files'][name] = hashlib.sha256(self.files[name]).hexdigest()
        with self.assertRaisesRegex(AssertionError, 'version mismatch'):
            self.check()

    def test_hash_valid_bundle_from_another_source_is_rejected(self):
        name = 'pdf/web/viewer.mjs'
        self.files[name] = self.files[name].replace(b'123456789', b'abcdef012')
        self.manifest['files'][name] = hashlib.sha256(self.files[name]).hexdigest()
        with self.assertRaisesRegex(AssertionError, 'build mismatch'):
            self.check()

    def test_manifest_cannot_hide_an_outdated_source_pin(self):
        manifest = copy.deepcopy(self.manifest)
        manifest['commit'] = 'old'
        with self.assertRaisesRegex(AssertionError, 'source pin differs'):
            self.check(manifest)

    def test_missing_compatibility_prelude_is_rejected_even_with_valid_hash(self):
        name = assets.BUNDLES[0]
        self.files[name] = self.files[name][len(self.compatibility):]
        self.manifest['files'][name] = hashlib.sha256(self.files[name]).hexdigest()
        with self.assertRaisesRegex(AssertionError, 'compatibility prelude'):
            self.check()
