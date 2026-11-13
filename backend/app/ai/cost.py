from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import LLM_PRICES_USD_PER_MTOK, Settings
from ..errors import DomainError
from ..models import UsageEvent

# Se o modelo não está na tabela, cobra como o mais caro: melhor errar para cima.
_FALLBACK_PRICE = max(LLM_PRICES_USD_PER_MTOK.values())


def llm_cost_brl(model: str, tokens_in: int, tokens_out: int, settings: Settings) -> Decimal:
    price_in, price_out = LLM_PRICES_USD_PER_MTOK.get(model, _FALLBACK_PRICE)
    usd = (tokens_in * price_in + tokens_out * price_out) / 1_000_000
    return Decimal(str(round(usd * settings.fx_brl_per_usd, 4)))


def stt_cost_brl(seconds: float, settings: Settings) -> Decimal:
    usd = seconds / 60 * settings.stt_usd_per_min
    return Decimal(str(round(usd * settings.fx_brl_per_usd, 4)))


def record_llm(
    db: Session,
    settings: Settings,
    *,
    producer_id: uuid.UUID | None,
    device_id: str | None,
    model: str,
    tokens_in: int,
    tokens_out: int,
) -> None:
    db.add(
        UsageEvent(
            producer_id=producer_id,
            device_id=device_id,
            kind="llm",
            model=model,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_brl=llm_cost_brl(model, tokens_in, tokens_out, settings),
        )
    )
    db.commit()


def record_stt(
    db: Session,
    settings: Settings,
    *,
    producer_id: uuid.UUID | None,
    device_id: str | None,
    model: str,
    seconds: float,
) -> None:
    db.add(
        UsageEvent(
            producer_id=producer_id,
            device_id=device_id,
            kind="transcription",
            model=model,
            audio_seconds=Decimal(str(round(seconds, 2))),
            cost_brl=stt_cost_brl(seconds, settings),
        )
    )
    db.commit()


def _count_since(db: Session, hours: int, **filters) -> int:
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    query = select(func.count()).select_from(UsageEvent).where(UsageEvent.created_at >= since)
    for column, value in filters.items():
        query = query.where(getattr(UsageEvent, column) == value)
    return db.scalar(query) or 0


def check_device_limit(db: Session, settings: Settings, device_id: str) -> None:
    used = _count_since(db, 24, device_id=device_id, kind="transcription")
    if used >= settings.max_voice_calls_per_device_day:
        raise DomainError(429, "Limite diário de pedidos por voz atingido. Use o catálogo.")


def check_producer_limit(db: Session, settings: Settings, producer_id: uuid.UUID) -> None:
    used = _count_since(db, 24, producer_id=producer_id, kind="llm")
    if used >= settings.max_ai_calls_producer_day:
        raise DomainError(429, "Limite diário de usos da IA atingido")
