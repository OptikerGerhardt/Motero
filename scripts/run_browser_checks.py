#!/usr/bin/env python3
"""Run portable reader browser regressions using the project's fixtures."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
checks = {'gestures': 'test-boox-browser.cjs', 'features': 'test-boox-features.cjs',
    'fitting': 'test-boox-fitting.cjs', 'stability': 'test-boox-stability.cjs',
    'controls': 'test-boox-reader-controls.cjs', 'annotation-tools': 'test-boox-annotation-tools.cjs',
    'fit-recovery': 'test-boox-fit-recovery.cjs', 'reader-update': 'test-boox-reader-update.cjs',
    'manual-crop': 'test-boox-manual-crop.cjs', 'edge-taps': 'test-boox-edge-taps.cjs', 'refinements': 'test-boox-refinements.cjs', 'ui-consistency': 'test-boox-ui-consistency.cjs',
    'page-navigation': 'test-boox-page-navigation.cjs', 'crop-performance': 'test-boox-crop-performance.cjs'}
parser = argparse.ArgumentParser()
parser.add_argument('checks', nargs='*', help='Optional check names: ' + ', '.join(checks))
parser.add_argument('--browser', default=os.environ.get('BOOX_TEST_BROWSER') or shutil.which('chromium') or shutil.which('google-chrome'))
parser.add_argument('--output', type=Path, default=root / 'qa-ci')
args = parser.parse_args()
if set(args.checks) - set(checks):
    parser.error('Unknown browser check: ' + ', '.join(set(args.checks) - set(checks)))
assert args.browser, 'Specify an installed Chromium/Chrome executable with --browser'
args.output.mkdir(parents=True, exist_ok=True)
fixture = args.output.resolve() / 'fixtures/navigation.epub'
subprocess.run([sys.executable, str(root / 'reader/scripts/make-navigation-epub.py'), str(fixture)], check=True, stdout=subprocess.DEVNULL)
env = os.environ.copy()
env.update(BOOX_TEST_BROWSER=args.browser, BOOX_NAVIGATION_EPUB=str(fixture),
    BOOX_NAVIGATION_RTL_EPUB=str(fixture.with_name('navigation-rtl.epub')))
failed = []
for name in args.checks or checks:
    log = args.output / f'browser-{name}.log'
    with log.open('w') as stream:
        result = subprocess.run(['node', str(root / 'reader/scripts' / checks[name])], cwd=root / 'reader', env=env,
            stdout=stream, stderr=subprocess.STDOUT)
    print(name + (': PASS' if result.returncode == 0 else ': FAIL'), flush=True)
    if result.returncode:
        failed.append(name)
        print(log.read_text()[-4000:], flush=True)
raise SystemExit(bool(failed))
