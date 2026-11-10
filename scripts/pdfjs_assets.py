"""Shared integrity checks for the pinned, Android-compatible PDF.js bundle."""
import hashlib
import re

BUNDLES = ('pdf/build/pdf.mjs', 'pdf/build/pdf.worker.mjs', 'pdf/web/viewer.mjs')


def validate_engine(manifest, files, source_commit, compatibility):
    assert manifest['commit'] == source_commit, 'PDF.js source pin differs from the packaged engine'
    assert set(files) == set(manifest['files']), 'PDF.js archive file list mismatch'
    for name, data in files.items():
        assert hashlib.sha256(data).hexdigest() == manifest['files'][name], name
    for name in BUNDLES:
        data = files[name]
        assert data.startswith(compatibility), f'Missing Android compatibility prelude: {name}'
        header = data[len(compatibility):len(compatibility) + 2500].decode()
        version = re.search(r'pdfjsVersion = (\S+)', header)
        build = re.search(r'pdfjsBuild = (\S+)', header)
        assert version and version[1] == manifest['version'], f'PDF.js version mismatch: {name}'
        assert build and build[1] == manifest['build'], f'PDF.js build mismatch: {name}'
        assert source_commit.startswith(build[1]), f'PDF.js compiled source mismatch: {name}'
