#!/bin/sh
# Single-container start for free hosting (Render): API + embedded Celery worker.
set -e

python -m app.seed

# Flags trim idle Redis traffic to stay inside Upstash's free command quota.
celery -A app.workers.celery_app.celery_app worker \
  -Q analysis --pool=solo --concurrency=1 --loglevel=INFO \
  --without-heartbeat --without-gossip --without-mingle &

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
