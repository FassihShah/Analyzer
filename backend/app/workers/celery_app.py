from celery import Celery

from app.core.config import get_settings

settings = get_settings()
redis_url = settings.redis_url
if redis_url.startswith("rediss://") and "ssl_cert_reqs" not in redis_url:
    redis_url += ("&" if "?" in redis_url else "?") + "ssl_cert_reqs=CERT_REQUIRED"

celery_app = Celery("resume_filter", broker=redis_url, backend=redis_url, include=["app.workers.tasks"])
celery_app.conf.task_routes = {"app.workers.tasks.*": {"queue": "analysis"}}
celery_app.conf.worker_prefetch_multiplier = 1
celery_app.conf.task_acks_late = True
celery_app.conf.broker_connection_retry_on_startup = True
