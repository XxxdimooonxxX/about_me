#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose -f docker-compose.yml -f compose.production.yml config -q
docker compose -f docker-compose.yml -f compose.production.yml up -d --build --wait
