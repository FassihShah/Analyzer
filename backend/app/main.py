import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.db.session import engine, init_db
from app.services.recovery_service import recover_interrupted_analysis
from sqlmodel import Session

settings = get_settings()
logger = logging.getLogger("app")


class UnhandledErrorMiddleware(BaseHTTPMiddleware):
    """Turn unexpected exceptions into JSON 500s.

    Added before CORSMiddleware so it sits inside it: the error response then still gets CORS headers,
    and the browser shows the real error instead of a blocked, "backend unreachable" request.
    """

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception:
            logger.exception("Unhandled error on %s %s", request.method, request.url.path)
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error. Please try again or check the server logs."},
            )


app = FastAPI(title=settings.app_name)
app.add_middleware(UnhandledErrorMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_prefix)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"detail": "This change conflicts with existing data (a related record exists or a value is duplicated)."},
    )


@app.on_event("startup")
def on_startup() -> None:
    if settings.environment == "development":
        init_db()
    try:
        with Session(engine) as session:
            result = recover_interrupted_analysis(session)
            if result["interrupted_requeued"] or result["queued_dispatched"]:
                print(f"Analysis recovery: {result}")
    except Exception as exc:
        print(f"Analysis recovery skipped: {exc}")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
