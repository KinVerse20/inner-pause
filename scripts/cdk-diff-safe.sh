#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${REPO_ROOT}/.aws-review"
OUTPUT_FILE="${OUTPUT_DIR}/cdk-diff.txt"

"${REPO_ROOT}/scripts/aws-verify-identity.sh"

mkdir -p "${OUTPUT_DIR}"

cd "${REPO_ROOT}"
npm --prefix infrastructure run build
npm --prefix infrastructure run synth

cd "${REPO_ROOT}/infrastructure"
npx cdk diff 2>&1 | tee "${OUTPUT_FILE}"

echo
echo "CDK diff saved to ${OUTPUT_FILE}"
echo "No deployment was run."
