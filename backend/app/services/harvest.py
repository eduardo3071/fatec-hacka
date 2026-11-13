"""Lista de colheita e rota do dia. Só regras, sem IA."""

from __future__ import annotations

from collections import defaultdict
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..models import Order, Producer
from ..schemas import HarvestBuyerShare, HarvestItem, HarvestOut, RouteStop


def build_harvest(db: Session, producer: Producer, day: date) -> HarvestOut:
    orders = db.scalars(
        select(Order)
        .where(
            Order.producer_id == producer.id,
            Order.delivery_date == day,
            Order.status.in_(("aceito", "pendente")),
        )
        .options(selectinload(Order.items), selectinload(Order.buyer))
        .order_by(Order.delivery_time, Order.created_at)
    ).all()

    accepted = [o for o in orders if o.status == "aceito"]
    pending = [o for o in orders if o.status == "pendente"]

    # (nome, unidade) -> comprador -> quantidade
    totals: dict[tuple[str, str], dict[str, Decimal]] = defaultdict(lambda: defaultdict(Decimal))
    for order in accepted:
        for item in order.items:
            totals[(item.product_name, item.unit)][order.buyer.name] += item.quantity

    items = [
        HarvestItem(
            product_name=name,
            unit=unit,
            total_quantity=float(sum(by_buyer.values(), Decimal("0"))),
            buyers=[
                HarvestBuyerShare(buyer_name=buyer, quantity=float(qty))
                for buyer, qty in sorted(by_buyer.items())
            ],
        )
        for (name, unit), by_buyer in sorted(totals.items())
    ]

    route = [
        RouteStop(
            delivery_time=o.delivery_time,
            order_id=o.id,
            buyer_name=o.buyer.name,
            buyer_phone=o.buyer.phone,
            items_count=len(o.items),
            total=float(o.total),
            payment_status=o.payment_status,
            notes=o.notes,
        )
        for o in accepted
    ]
    return HarvestOut(
        date=day,
        items=items,
        route=route,
        orders_accepted=len(accepted),
        orders_pending=len(pending),
    )
