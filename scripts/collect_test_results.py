#!/usr/bin/env python3
"""Collect actual JUnit test cases and fail on errors or skipped native tests."""
import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument('--directory', type=Path, default=Path('app/build/test-results/testDevDebugUnitTest'))
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
suites = []
for path in sorted(args.directory.glob('TEST-*.xml')):
    suite = ET.parse(path).getroot()
    suites.append(dict(suite=suite.attrib['name'], **{key: int(suite.attrib.get(key, 0))
        for key in ['tests', 'failures', 'errors', 'skipped']}))
totals = {key: sum(s[key] for s in suites) for key in ['tests', 'failures', 'errors', 'skipped']}
assert totals['tests'] > 0 and all(totals[key] == 0 for key in ['failures', 'errors', 'skipped']), totals
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(dict(suite_count=len(suites), totals=totals, suites=suites), indent=2) + '\n')
print(f"PASS {totals['tests']} native tests in {len(suites)} suites")
