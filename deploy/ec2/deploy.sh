#!/usr/bin/env bash
# Ships the committed code (HEAD) to the server, builds it and switches to
# it, keeping the last two releases. Run from the repo root:
#   DEPLOY_HOST=<server address> bash deploy/ec2/deploy.sh
set -euo pipefail

HOST=${DEPLOY_HOST:?set DEPLOY_HOST to the server address}
KEY=${DEPLOY_KEY:-$HOME/.ssh/innerpause.pem}
SSH="ssh -i $KEY -o StrictHostKeyChecking=accept-new ubuntu@$HOST"

archive=$(mktemp)
git archive --format=tar.gz HEAD > "$archive"
scp -i "$KEY" -o StrictHostKeyChecking=accept-new "$archive" "ubuntu@$HOST:/tmp/innerpause.tar.gz"
rm -f "$archive"

$SSH 'sudo bash -s' <<'REMOTE'
set -euo pipefail
release=/opt/innerpause/releases/$(date +%Y%m%d%H%M%S)
as_app() { sudo -u innerpause -H "$@"; }

as_app mkdir -p "$release"
as_app tar -xzf /tmp/innerpause.tar.gz -C "$release"
rm -f /tmp/innerpause.tar.gz
as_app ln -sf /opt/innerpause/.env "$release/.env"
# Used only while S3_BUCKET is empty: sounds kept on disk outlive releases.
as_app ln -sfn /opt/innerpause/uploads "$release/backend/uploads"

cd "$release"
as_app npm ci
as_app npm run build

ln -sfn "$release" /opt/innerpause/current
systemctl restart innerpause-api innerpause-web

ls -1dt /opt/innerpause/releases/* | tail -n +3 | xargs -r rm -rf
echo "Deployed $release"
REMOTE
