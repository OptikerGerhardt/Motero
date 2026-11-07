#!/usr/bin/env python3
"""Check the release's manifest and AndroidX receiver-permission lookup together."""
import argparse
import json
from pathlib import Path
import re
import struct
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def dex_strings(data):
    assert data.startswith(b'dex\n'), 'Unexpected DEX format'
    count, offset = struct.unpack_from('<II', data, 56)
    for i in range(count):
        position = struct.unpack_from('<I', data, offset + i * 4)[0]
        while data[position] & 0x80:
            position += 1
        position += 1
        end = data.index(b'\0', position)
        yield data[position:end].decode('utf-8', errors='replace')


def verify_receiver_permission(apk, tools, policy):
    permission = policy['receiver_permission']
    legacy = policy['legacy_receiver_permission']
    manifest = subprocess.check_output([str(tools / 'aapt2'), 'dump', 'xmltree', str(apk),
        '--file', 'AndroidManifest.xml'], text=True)
    declarations = {}
    for block in re.findall(r'E: permission \([^\n]*\)\n((?:\s+A:[^\n]*\n)+)', manifest):
        name = re.search(r':name\([^\n]*?\)="([^"]+)"', block).group(1)
        level = re.search(r':protectionLevel[^\n]*?=(0x[0-9a-fA-F]+)', block)
        declarations[name] = int(level.group(1), 16) if level else 0
    assert legacy not in declarations, 'Legacy signature permission would block certificate rotation'
    assert declarations.get(permission) == 2, 'The new receiver permission must be signature-protected'
    permissions = subprocess.check_output([str(tools / 'aapt2'), 'dump', 'permissions', str(apk)], text=True)
    assert "uses-permission: name='" + permission + "'" in permissions
    assert "uses-permission: name='" + legacy + "'" not in permissions
    strings = set()
    with zipfile.ZipFile(apk) as archive:
        for name in archive.namelist():
            if re.fullmatch(r'classes\d*\.dex', name):
                strings.update(dex_strings(archive.read(name)))
    assert '.' + permission.rsplit('.', 1)[1] in strings, 'AndroidX does not use the new permission'
    assert '.' + legacy.rsplit('.', 1)[1] not in strings, 'AndroidX still uses the old permission'
    assert legacy not in strings, 'DEX still references the old receiver permission'
    return {'receiver_permission': permission, 'receiver_permission_verified': True}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apk', type=Path, required=True)
    parser.add_argument('--build-tools', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(verify_receiver_permission(args.apk, args.build_tools,
        json.loads((ROOT / 'signing/release-policy.json').read_text()))))
