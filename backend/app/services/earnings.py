"""Ganho a mais da venda direta contra o preço que o intermediário pagaria.

O preço do intermediário vem do cadastro (uma pergunta por produto) e fica
gravado em cada item no momento do pedido. Itens sem referência não entram na
comparação, e o resultado informa a cobertura para ninguém ler mais do que há.
"""

from __future__ import annotations

import re
from datetime import date, datetime, time, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..errors import DomainError
from ..models import Order, Producer, UsageEvent
from ..schemas import EarningsOut, UsageOut
from .common import money


def month_bounds(month: str) -> tuple[date, date]:
    if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", month):
        raise DomainError(422, "Mês deve estar no formato AAAA-MM")
    year, mon = int(month[:4]), int(month[5:])
    start = date(year, mon, 1)
    end = date(year + 1, 1, 1) if mon == 12 else date(year, mon + 1, 1)
    return start, end


def build_earnings(db: Session, producer: Producer, month: str) -> EarningsOut:
    start, end = month_bounds(month)
    orders = db.scalars(
        select(Order)
        .where(
            Order.producer_id == producer.id,
            Order.status == "entregue",
            Order.delivery_date >= start,
            Order.delivery_date < end,
        )
        .options(selectinload(Order.items))
    ).all()

    revenue = Decimal("0")
    covered_direct = Decimal("0")
    covered_interm = Decimal("0")
    for order in orders:
        for item in order.items:
            line = item.quantity * item.unit_price
            revenue += line
            if item.intermediary_price is not None:
                covered_direct += line
                covered_interm += item.quantity * item.intermediary_price

    coverage = float(covered_direct / revenue * 100) if revenue else 0.0
    return EarningsOut(
        month=month,
        orders_delivered=len(orders),
        revenue=float(money(revenue)),
        revenue_with_reference=float(money(covered_direct)),
        estimated_intermediary_revenue=float(money(covered_interm)),
        extra_gain=float(money(covered_direct - covered_interm)),
        coverage_pct=round(coverage, 1),
    )


def build_usage(db: Session, producer: Producer, month: str) -> UsageOut:
    start, end = month_bounds(month)
    events = db.scalars(
        select(UsageEvent).where(
            UsageEvent.producer_id == producer.id,
            UsageEvent.created_at >= datetime.combine(start, time.min, tzinfo=timezone.utc),
            UsageEvent.created_at < datetime.combine(end, time.min, tzinfo=timezone.utc),
        )
    ).all()
    llm = sum((e.cost_brl for e in events if e.kind == "llm"), Decimal("0"))
    stt = sum((e.cost_brl for e in events if e.kind == "transcription"), Decimal("0"))
    return UsageOut(
        month=month,
        events=len(events),
        cost_brl_total=float(llm + stt),
        cost_brl_llm=float(llm),
        cost_brl_transcription=float(stt),
    )
