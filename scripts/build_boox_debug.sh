#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
git submodule update --init --recursive
(cd reader && npm ci --no-audit --no-fund)
bash scripts/bundle_reader_local.sh
for bundle in translators translation pdf-worker citation_proc csl_locales styles; do
    python3 "scripts/bundle_${bundle}.py"
done
bash scripts/bundle_utilities.sh
bash scripts/bundle_document-worker.sh
./gradlew assembleDevDebug "$@"
