#!/usr/bin/env python3
"""Package an already-built Android Reader without rebuilding unchanged PDF.js."""
from pathlib import Path
import hashlib
import zipfile

root = Path(__file__).resolve().parents[1]
source = root / 'reader/build/android'
assert (source / 'view.js').is_file(), 'Build the Android Reader first'
destination = root / 'app/src/main/assets/reader'
destination.mkdir(parents=True, exist_ok=True)
archive = destination / 'reader.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as output:
    for path in sorted(source.rglob('*')):
        if path.is_file():
            info = zipfile.ZipInfo(path.relative_to(source).as_posix(), (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            output.writestr(info, path.read_bytes(), compresslevel=6)
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(destination / 'reader_hash.txt').write_text(digest + '\n')
print('Reader SHA-256:', digest)
