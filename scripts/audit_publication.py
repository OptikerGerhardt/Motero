#!/usr/bin/env python3
"""Offline, value-redacting publication check over reachable history and ZIP/APK contents.

Checks high-confidence credential formats and sensitive filenames. This is a guard,
not a general secret detector or an independent security audit. Dependencies in
separate Git repositories are not traversed by rev-list; source ZIPs cover their files.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    'github_token': rb'(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})',
    'private_key': rb'-----BEGIN (?:RSA |DSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----',
    'aws_access_key': rb'AKIA[A-Z0-9]{16}',
    'slack_token': rb'xox[baprs]-[0-9A-Za-z-]{20,}',
    'google_service_account': rb'"type"\s*:\s*"service_account"',
    'motero_signing_payload': rb'"keystore_base64"\s*:\s*"[A-Za-z0-9+/=]{100,}"',
}
SENSITIVE = re.compile(r'(?:^|/)(?:\.env(?:\..*)?|id_rsa|id_ed25519|pspdfkit-key\.txt|keystore-secrets\.txt|MOTERO_RELEASE_SIGNING[^/]*\.json|[^/]*Private_Signing_Backup[^/]*\.zip|[^/]*\.(?:realm|p12|pfx|jks|keystore))$')
PERSONAL = re.compile(r'(?:^|/)(?:Plessner_Seminarlektuere_B5\.pdf|Eingefügter Text\.txt)$')


def inspect(path, data, exceptions):
    kinds = [name for name, pattern in PATTERNS.items() if re.search(pattern, data)]
    if SENSITIVE.search(path):
        kinds.append('sensitive_filename')
    if PERSONAL.search(path):
        kinds.append('personal_document')
    if not kinds:
        return None
    digest = hashlib.sha256(data).hexdigest()
    return {'path': path, 'kinds': kinds, 'sha256': digest, 'allowed_public_fixture': digest in exceptions}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repository', type=Path, default=ROOT)
    parser.add_argument('--ref', action='append')
    parser.add_argument('--archive', action='append', type=Path, default=[])
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    exceptions = json.loads((ROOT / 'scripts/publication-exceptions.json').read_text())
    refs = args.ref or ['HEAD']
    objects = subprocess.check_output(['git', '-C', str(args.repository), 'rev-list', '--objects', *refs], text=True).splitlines()
    findings, blobs, size, entries = [], 0, 0, 0
    process = subprocess.Popen(['git', '-C', str(args.repository), 'cat-file', '--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    try:
        for line in objects:
            oid, _, path = line.partition(' ')
            process.stdin.write((oid + '\n').encode()); process.stdin.flush()
            header = process.stdout.readline().decode().split()
            if len(header) != 3:
                raise RuntimeError('Git object is missing')
            length = int(header[2])
            data = process.stdout.read(length)
            assert len(data) == length and process.stdout.read(1) == b'\n'
            if header[1] != 'blob':
                continue
            blobs += 1; size += length
            finding = inspect(path, data, exceptions)
            if finding:
                findings.append(dict(finding, object=oid))
    finally:
        process.stdin.close(); process.stdout.close()
        process.wait()
    assert process.returncode == 0

    archive_size = 0
    def scan_zip(source, label, depth=0):
        nonlocal entries, archive_size
        assert depth <= 8, 'Nested archive depth exceeded; review manually'
        with zipfile.ZipFile(source) as archive:
            for info in archive.infolist():
                if info.is_dir():
                    continue
                archive_size += info.file_size
                assert archive_size <= 2 * 1024**3, 'Archive scan limit exceeded; review manually'
                data = archive.read(info)  # Also validates the entry CRC.
                entries += 1
                path = label + '!' + info.filename
                finding = inspect(info.filename, data, exceptions)
                if finding:
                    findings.append(dict(finding, path=path))
                if info.filename.lower().endswith(('.zip', '.apk')):
                    scan_zip(io.BytesIO(data), path, depth + 1)
    for archive in args.archive:
        scan_zip(archive, archive.name)
    blocked = sum(not finding['allowed_public_fixture'] for finding in findings)
    report = {'passed': not blocked, 'refs': refs, 'git_objects': len(objects), 'git_blobs': blobs,
        'git_bytes': size, 'archive_entries': entries, 'archive_bytes': archive_size,
        'unreviewed_findings': blocked, 'findings': findings,
        'scope': 'High-confidence formats, sensitive filenames and known personal document names; not a guarantee that no other secrets exist.'}
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))
    return bool(blocked)


if __name__ == '__main__':
    raise SystemExit(main())
