#!/usr/bin/env python3
"""Fail closed when a develop candidate loses released main code or Reader history.

This check verifies ancestry and version monotonicity, not behavioral equivalence.
Do not use it in place of release/regression tests or human approval.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BUILD_CONFIG = 'buildSrc/src/main/kotlin/BuildConfig.kt'
HEX_SHA = re.compile(r'^[0-9a-f]{40}$')
VERSION_CODE = re.compile(r'^\s*const\s+val\s+versionCode\s*=\s*(\d+)\b', re.MULTILINE)
READER_TREE = re.compile(r'^160000 commit ([0-9a-f]{40})\treader$')
VALID_READER_STATUSES = {'identical', 'ahead'}


def git(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(['git', *args], check=check, text=True, capture_output=True)


def parse_version_code(content: str) -> int:
    matches = VERSION_CODE.findall(content)
    if len(matches) != 1:
        raise ValueError('BuildConfig.kt must contain exactly one numeric versionCode')
    return int(matches[0])


def parse_reader_tree(content: str) -> str:
    match = READER_TREE.fullmatch(content.strip())
    if not match:
        raise ValueError('Missing/invalid reader submodule gitlink')
    return match.group(1)


def evaluate(main_version: int, candidate_version: int, main_pin: str,
             candidate_pin: str, main_is_ancestor: bool,
             reader_status: str | None) -> list[str]:
    problems = []
    if not main_is_ancestor:
        problems.append('Current main is NOT an ancestor of the candidate. Integrate current main into develop before accepting new changes.')
    if candidate_version < main_version:
        problems.append(f'Candidate versionCode {candidate_version} is below published main {main_version}.')
    if not HEX_SHA.fullmatch(main_pin) or not HEX_SHA.fullmatch(candidate_pin):
        problems.append('Invalid reader gitlink SHA.')
    elif main_pin != candidate_pin and reader_status not in VALID_READER_STATUSES:
        problems.append(f'Reader gitlink {candidate_pin[:12]} must be the published pin {main_pin[:12]} or a proven descendant (GitHub compare: {reader_status!r}).')
    return problems


def github_reader_compare(repo: str, old: str, new: str, token: str) -> str:
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repo):
        raise ValueError('Invalid repository identifier')
    if not (HEX_SHA.fullmatch(old) and HEX_SHA.fullmatch(new)):
        raise ValueError('Invalid Reader SHA')
    if not token:
        raise ValueError('GITHUB_TOKEN is required to verify Reader ancestry')
    url = f'https://api.github.com/repos/{repo}/compare/{old}...{new}'
    request = Request(url, headers={'Accept': 'application/vnd.github+json',
                                    'Authorization': f'Bearer {token}',
                                    'X-GitHub-Api-Version': '2022-11-28',
                                    'User-Agent': 'motero-baseline-guard'})
    with urlopen(request, timeout=15) as response:
        result = json.load(response)
    status = result.get('status')
    if not isinstance(status, str):
        raise ValueError('GitHub Reader compare returned no status')
    return status


def run(main_ref: str, candidate_ref: str, repo: str, token: str) -> int:
    main_code = parse_version_code(git('show', f'{main_ref}:{BUILD_CONFIG}').stdout)
    candidate_code = parse_version_code(git('show', f'{candidate_ref}:{BUILD_CONFIG}').stdout)
    main_pin = parse_reader_tree(git('ls-tree', main_ref, 'reader').stdout)
    candidate_pin = parse_reader_tree(git('ls-tree', candidate_ref, 'reader').stdout)
    ancestry = git('merge-base', '--is-ancestor', main_ref, candidate_ref, check=False)
    if ancestry.returncode not in (0, 1):
        raise RuntimeError(f'Could not check ancestry: {ancestry.stderr.strip()}')
    status = 'identical' if main_pin == candidate_pin else github_reader_compare(repo, main_pin, candidate_pin, token)
    failures = evaluate(main_code, candidate_code, main_pin, candidate_pin,
                        ancestry.returncode == 0, status)
    report = [
        '## Release baseline guard',
        f'- Published main: `{main_ref}`, versionCode `{main_code}`, Reader `{main_pin}`',
        f'- Candidate: `{candidate_ref}`, versionCode `{candidate_code}`, Reader `{candidate_pin}`',
        f'- Reader compare: `{status}`',
        '- Main ancestry: ' + ('included' if ancestry.returncode == 0 else 'MISSING'),
        '- Result: **FAIL**' if failures else '- Result: **PASS**',
    ]
    report += [f'- Blocker: {problem}' for problem in failures]
    report += ['- This check does **not** prove semantic behavior, live sync, BOOX, or regression parity.']
    summary = '
'.join(report) + '
'
    print(summary)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as f:
            f.write(summary)
    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--main', default='refs/remotes/origin/main')
    parser.add_argument('--candidate', default='HEAD')
    args = parser.parse_args()
    try:
        return run(args.main, args.candidate, os.environ.get('GITHUB_REPOSITORY', ''),
                   os.environ.get('GITHUB_TOKEN', ''))
    except (ValueError, RuntimeError, subprocess.CalledProcessError, HTTPError, URLError, TimeoutError) as exc:
        print(f'::error title=Release baseline guard::Unable to verify release parity: {exc}', file=sys.stderr)
        return 2  # An unavailable verification must never be treated as green.


if __name__ == '__main__':
    raise SystemExit(main())
