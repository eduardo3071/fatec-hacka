from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .errors import DomainError
from .routers import ai_routes, producer, public, push

app = FastAPI(
    title="Colheita Certa API",
    version="0.1.0",
    description="Backend da Fase 1: catálogo, pedidos, colheita e rota, ganho a mais, IA de voz e foto.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=get_settings().cors_origin_regex,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/health", tags=["infra"])
def health():
    return {"status": "ok"}


app.include_router(public.router)
app.include_router(producer.router)
app.include_router(ai_routes.router)
app.include_router(push.router)
