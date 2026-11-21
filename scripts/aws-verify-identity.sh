#!/usr/bin/env bash
set -euo pipefail

EXPECTED_REGION="ap-south-1"

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI is not installed or not available in PATH." >&2
  exit 1
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text 2>/dev/null || true)"
ARN="$(aws sts get-caller-identity --query Arn --output text 2>/dev/null || true)"
REGION="$(aws configure get region 2>/dev/null || true)"
REGION="${AWS_REGION:-${REGION:-}}"

if [[ -z "${ACCOUNT_ID}" || "${ACCOUNT_ID}" == "None" ]]; then
  echo "AWS account ID is missing. Configure AWS credentials first." >&2
  exit 1
fi

if [[ -z "${ARN}" || "${ARN}" == "None" ]]; then
  echo "AWS identity ARN is missing. Configure AWS credentials first." >&2
  exit 1
fi

if [[ "${ARN}" == *":root" ]]; then
  echo "Refusing to continue: the active AWS identity is the root user." >&2
  exit 1
fi

if [[ -z "${REGION}" ]]; then
  echo "AWS region is missing. Set it to ${EXPECTED_REGION}." >&2
  exit 1
fi

if [[ "${REGION}" != "${EXPECTED_REGION}" ]]; then
  echo "Refusing to continue: selected region is ${REGION}, expected ${EXPECTED_REGION}." >&2
  exit 1
fi

if [[ -n "${EXPECTED_AWS_ACCOUNT_ID:-}" && "${ACCOUNT_ID}" != "${EXPECTED_AWS_ACCOUNT_ID}" ]]; then
  echo "Refusing to continue: connected account ${ACCOUNT_ID} does not match EXPECTED_AWS_ACCOUNT_ID." >&2
  exit 1
fi

echo "AWS identity verified."
echo "Account ID: ${ACCOUNT_ID}"
echo "Identity ARN: ${ARN}"
echo "Region: ${REGION}"
