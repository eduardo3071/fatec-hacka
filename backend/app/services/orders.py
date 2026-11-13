from __future__ import annotations

import secrets
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..config import get_settings
from ..errors import DomainError
from ..models import Buyer, Order, OrderItem, Producer, Product
from ..schemas import OrderIn, OrderItemOut, OrderOut, PublicOrderOut
from .common import money, today_local

MAX_QTY = Decimal("10000")

# ação -> (status de origem aceitos, novo status, campo de data a preencher)
TRANSITIONS: dict[str, tuple[tuple[str, ...], str, str | None]] = {
    "accept": (("pendente",), "aceito", "accepted_at"),
    "reject": (("pendente",), "recusado", None),
    "deliver": (("aceito",), "entregue", "delivered_at"),
    "cancel": (("pendente", "aceito"), "cancelado", None),
}


def create_order(db: Session, producer: Producer, data: OrderIn) -> Order:
    settings = get_settings()
    if not producer.active:
        raise DomainError(404, "Produtor não encontrado")
    if data.delivery_date < today_local():
        raise DomainError(422, "A data de entrega não pode estar no passado")

    since = datetime.now(timezone.utc) - timedelta(hours=1)
    recent = db.scalar(
        select(func.count())
        .select_from(Order)
        .where(Order.device_id == data.device_id, Order.created_at >= since)
    )
    if (recent or 0) >= settings.max_orders_per_device_hour:
        raise DomainError(429, "Muitos pedidos em pouco tempo. Tente novamente mais tarde.")

    quantities: dict[uuid.UUID, Decimal] = defaultdict(Decimal)
    for item in data.items:
        quantities[item.product_id] += item.quantity
    if any(q > MAX_QTY for q in quantities.values()):
        raise DomainError(422, "Quantidade acima do limite por produto")

    products = db.scalars(
        select(Product).where(
            Product.id.in_(list(quantities)),
            Product.producer_id == producer.id,
            Product.active.is_(True),
        )
    ).all()
    found = {p.id: p for p in products}
    missing = [str(pid) for pid in quantities if pid not in found]
    if missing:
        raise DomainError(422, f"Produtos indisponíveis ou de outro produtor: {', '.join(missing)}")

    buyer = db.scalar(
        select(Buyer).where(Buyer.producer_id == producer.id, Buyer.phone == data.buyer_phone)
    )
    if buyer is None:
        buyer = Buyer(
            producer_id=producer.id,
            name=data.buyer_name,
            phone=data.buyer_phone,
            device_id=data.device_id,
        )
        db.add(buyer)
        db.flush()
    else:
        buyer.name = data.buyer_name
        buyer.device_id = data.device_id

    order = Order(
        producer_id=producer.id,
        buyer_id=buyer.id,
        delivery_date=data.delivery_date,
        delivery_time=data.delivery_time,
        notes=data.notes,
        source=data.source,
        tracking_token=secrets.token_urlsafe(24),
        device_id=data.device_id,
    )
    total = Decimal("0")
    for product_id, quantity in quantities.items():
        product = found[product_id]
        total += money(quantity * product.price)
        order.items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                unit=product.unit,
                quantity=quantity,
                unit_price=product.price,
                intermediary_price=product.intermediary_price,
            )
        )
    order.total = money(total)
    db.add(order)
    db.commit()
    return get_order(db, producer, order.id)


def get_order(db: Session, producer: Producer, order_id: uuid.UUID) -> Order:
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id, Order.producer_id == producer.id)
        .options(selectinload(Order.items), selectinload(Order.buyer))
    )
    if order is None:
        raise DomainError(404, "Pedido não encontrado")
    return order


def list_orders(
    db: Session, producer: Producer, statuses: list[str] | None, day: date | None
) -> list[Order]:
    query = (
        select(Order)
        .where(Order.producer_id == producer.id)
        .options(selectinload(Order.items), selectinload(Order.buyer))
        .order_by(Order.delivery_date, Order.delivery_time, Order.created_at)
    )
    if statuses:
        query = query.where(Order.status.in_(statuses))
    if day:
        query = query.where(Order.delivery_date == day)
    return list(db.scalars(query).all())


def transition(db: Session, producer: Producer, order_id: uuid.UUID, action: str) -> Order:
    allowed, new_status, stamp = TRANSITIONS[action]
    order = get_order(db, producer, order_id)
    if order.status not in allowed:
        raise DomainError(409, f"Não é possível mudar o pedido de '{order.status}' para '{new_status}'")
    order.status = new_status
    if stamp:
        setattr(order, stamp, datetime.now(timezone.utc))
    db.commit()
    return get_order(db, producer, order_id)


def mark_paid(db: Session, producer: Producer, order_id: uuid.UUID) -> Order:
    order = get_order(db, producer, order_id)
    if order.status not in ("aceito", "entregue"):
        raise DomainError(409, "Só pedidos aceitos ou entregues podem ser marcados como pagos")
    if order.payment_status == "pago":
        raise DomainError(409, "Pedido já está pago")
    order.payment_status = "pago"
    order.paid_at = datetime.now(timezone.utc)
    db.commit()
    return get_order(db, producer, order_id)


def _items_out(order: Order) -> list[OrderItemOut]:
    return [
        OrderItemOut(
            product_name=i.product_name,
            unit=i.unit,
            quantity=float(i.quantity),
            unit_price=float(i.unit_price),
            subtotal=float(money(i.quantity * i.unit_price)),
        )
        for i in order.items
    ]


def order_out(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        status=order.status,
        payment_status=order.payment_status,
        delivery_date=order.delivery_date,
        delivery_time=order.delivery_time,
        total=float(order.total),
        notes=order.notes,
        source=order.source,
        buyer_name=order.buyer.name,
        buyer_phone=order.buyer.phone,
        items=_items_out(order),
        created_at=order.created_at,
    )


def public_order_out(order: Order, producer: Producer) -> PublicOrderOut:
    return PublicOrderOut(
        tracking_token=order.tracking_token,
        status=order.status,
        payment_status=order.payment_status,
        delivery_date=order.delivery_date,
        delivery_time=order.delivery_time,
        total=float(order.total),
        items=_items_out(order),
        producer_name=producer.name,
        pix_key=producer.pix_key,
    )
