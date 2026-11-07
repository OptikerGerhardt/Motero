#!/usr/bin/env python3
"""Choose an immutable release version; reject product changes that reuse a published build."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--repository', default=os.environ.get('GITHUB_REPOSITORY', 'OptikerGerhardt/Motero'))
parser.add_argument('--event', default=os.environ.get('GITHUB_EVENT_NAME', 'workflow_dispatch'))
parser.add_argument('--ref', default=os.environ.get('GITHUB_REF', 'refs/heads/main'))
parser.add_argument('--sha', default=os.environ.get('GITHUB_SHA'))
parser.add_argument('--before', default=os.environ.get('MOTERO_BEFORE', ''))
parser.add_argument('--github-output', type=Path)
args = parser.parse_args()
assert re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', args.repository)
metadata = json.loads(subprocess.check_output(['python3', str(root / 'scripts/prepare_release.py'), '--metadata-only'], text=True))
sha = args.sha or subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
assert re.fullmatch(r'[0-9a-f]{40}', sha)

def api(path):
    result = subprocess.run(['gh', 'api', path], capture_output=True, text=True)
    if result.returncode:
        if '(HTTP 404)' in result.stderr:
            return None
        raise SystemExit(result.stderr.strip())
    return json.loads(result.stdout)

publish = args.ref == 'refs/heads/main' and args.event in ['push', 'workflow_dispatch']
if publish:
    existing = api(f"repos/{args.repository}/releases/tags/{metadata['tag']}")
    product_changed = False
    if args.event == 'push' and re.fullmatch(r'[0-9a-f]{40}', args.before) and set(args.before) != {'0'}:
        names = subprocess.check_output(['git', '-C', str(root), 'diff', '--name-only', args.before, sha], text=True).splitlines()
        product_changed = any(name == 'reader' or name.startswith(('app/', 'buildSrc/')) for name in names)
    if existing is not None:
        if product_changed:
            raise SystemExit('Product changes reuse a published build. Increase BuildConfig.versionCode before pushing main.')
        publish = False
    else:
        page = 1
        codes = []
        while True:
            releases = api(f'repos/{args.repository}/releases?per_page=100&page={page}')
            if releases is None:
                raise SystemExit('Could not read repository releases')
            for release in releases:
                match = re.fullmatch(r'v\d+\.\d+\.\d+-(\d+)', release['tag_name'])
                if match:
                    codes.append(int(match.group(1)))
            if len(releases) < 100:
                break
            page += 1
        if codes and metadata['version_code'] <= max(codes):
            raise SystemExit('Build number must be higher than every existing versioned release.')
        reference = api(f"repos/{args.repository}/git/ref/tags/{metadata['tag']}")
        if reference is not None:
            obj = reference['object']
            while obj['type'] == 'tag':
                obj = api(f"repos/{args.repository}/git/tags/{obj['sha']}")['object']
            if obj['type'] != 'commit' or obj['sha'] != sha:
                raise SystemExit('The existing tag points to a different commit; it will not be replaced.')
metadata['publish'] = str(publish).lower()
if args.github_output:
    with args.github_output.open('a') as output:
        for name, value in metadata.items():
            output.write(f'{name}={value}\n')
print(json.dumps(metadata))
