#!/usr/bin/env python3
"""Reuse a successful main build only when every later change is release infrastructure."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
INFRASTRUCTURE = {'.github/workflows/motero.yml', 'scripts/check_android_update.py',
    'scripts/reuse_tested_build.py', 'scripts/tests/test_build_reuse.py'}


def validate_changes(repository, tested_commit, current_commit):
    names = subprocess.check_output(['git', '-C', str(repository), 'diff', '--name-only',
        tested_commit, current_commit], text=True).splitlines()
    unexpected = set(names) - INFRASTRUCTURE
    assert not unexpected, 'Application/build inputs changed; a fresh build is required: ' + ', '.join(sorted(unexpected))
    return names


def validate_provenance(run, jobs, metadata, snapshot, expected):
    assert run['head_branch'] == 'main' and run['event'] in ['push', 'workflow_dispatch']
    assert run['path'] == '.github/workflows/motero.yml', 'Wrong workflow'
    assert any(j['name'] == 'build' and j['conclusion'] == 'success' for j in jobs), 'Build/tests did not pass'
    assert snapshot['android_commit'] == run['head_sha'], 'Archive does not belong to the tested run'
    for name in ['version', 'version_code', 'tag', 'apk', 'source']:
        assert metadata[name] == expected[name] and snapshot[name] == expected[name], 'Version mismatch: ' + name
    assert metadata.get('unsigned') is True, 'Expected the original unsigned build artifact'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--repository', required=True)
    parser.add_argument('--directory', type=Path, required=True)
    args = parser.parse_args()
    assert args.run_id.isdigit() and re.fullmatch(r'[\w.-]+/[\w.-]+', args.repository)
    def api(path):
        return json.loads(subprocess.check_output(['gh', 'api', path], text=True))
    run = api(f'repos/{args.repository}/actions/runs/{args.run_id}')
    jobs = api(f'repos/{args.repository}/actions/runs/{args.run_id}/jobs?per_page=100')['jobs']
    expected = json.loads(subprocess.check_output(['python3', str(ROOT / 'scripts/prepare_release.py'), '--metadata-only'], text=True))
    metadata = json.loads((args.directory / 'release-metadata.json').read_text())
    with zipfile.ZipFile(args.directory / expected['source']) as source:
        snapshot = json.loads(source.read('SOURCE_SNAPSHOT.json'))
    validate_provenance(run, jobs, metadata, snapshot, expected)
    current = subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip()
    changes = validate_changes(ROOT, run['head_sha'], current)
    unsigned = args.directory / ('Motero_Build' + str(expected['version_code']) + '-unsigned.apk')
    digest = hashlib.sha256(unsigned.read_bytes()).hexdigest()
    checksums = (args.directory / 'SHA256SUMS.txt').read_text().splitlines()
    assert digest + '  ' + unsigned.name in checksums, 'Unsigned APK checksum mismatch'
    subprocess.run(['python3', str(ROOT / 'scripts/prepare_release.py'), '--unsigned-ci',
        '--apk', str(unsigned), '--output', str(args.directory)], check=True)
    report = {'tested_run': int(args.run_id), 'tested_commit': run['head_sha'],
        'release_source_commit': current, 'infrastructure_only_changes': changes,
        'application_inputs_unchanged': True, 'unsigned_apk_sha256': digest}
    (args.directory / 'Motero_BuildProvenance.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
