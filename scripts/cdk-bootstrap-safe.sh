#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"${REPO_ROOT}/scripts/aws-verify-identity.sh"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
TARGET="aws://${ACCOUNT_ID}/ap-south-1"

echo
echo "CDK bootstrap target: ${TARGET}"
echo "This creates only CDK support resources such as the CDK toolkit stack and asset bucket."
echo "It does not deploy The InnerPause application stack."
echo
read -r -p "Type BOOTSTRAP ${ACCOUNT_ID} to continue: " CONFIRMATION

if [[ "${CONFIRMATION}" != "BOOTSTRAP ${ACCOUNT_ID}" ]]; then
  echo "Bootstrap cancelled."
  exit 1
fi

cd "${REPO_ROOT}/infrastructure"
npx cdk bootstrap "${TARGET}"
