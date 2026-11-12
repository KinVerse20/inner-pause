#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 EC2 server for Inner Pause.
# Run from this folder on the server: sudo bash setup-server.sh
set -euo pipefail
cd "$(dirname "$0")"

apt-get update
apt-get install -y curl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https

# Node.js 24 (LTS)
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs

# Caddy, for HTTPS
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt -o /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

# Swap, so `next build` fits on a 1 GB server.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

# The app runs as its own user. Releases go in /opt/innerpause/releases,
# /opt/innerpause/current points at the live one, and the settings live in
# /opt/innerpause/.env (kept across deploys).
id innerpause >/dev/null 2>&1 || useradd --system --create-home --home-dir /opt/innerpause --shell /usr/sbin/nologin innerpause
install -d -o innerpause -g innerpause /opt/innerpause/releases /opt/innerpause/uploads
if [ ! -f /opt/innerpause/.env ]; then
  install -o innerpause -g innerpause -m 600 env.production.example /opt/innerpause/.env
  echo "Fill in /opt/innerpause/.env before the first deploy."
fi

cp innerpause-api.service innerpause-web.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable innerpause-api innerpause-web
cp Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy

echo "Server ready."
