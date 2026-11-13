"""Modelos SQLAlchemy. Devem bater com backend/sql/001_schema.sql."""

from __future__ import annotations

import uuid
from datetime import date, datetime, time, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

UNITS = ("maco", "duzia", "engradado", "kg", "unidade", "caixa")


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Producer(Base):
    __tablename__ = "producers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    # No Postgres há FK para auth.users; aqui fica só o tipo, para rodar testes em SQLite.
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, unique=True)
    slug: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    municipality: Mapped[str | None] = mapped_column(String)
    pix_key: Mapped[str | None] = mapped_column(String)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (UniqueConstraint("producer_id", "name", "unit"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    producer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("producers.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String)
    unit: Mapped[str] = mapped_column(String)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    intermediary_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Buyer(Base):
    __tablename__ = "buyers"
    __table_args__ = (UniqueConstraint("producer_id", "phone"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    producer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("producers.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String)
    phone: Mapped[str] = mapped_column(String)
    device_id: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("orders_producer_date_idx", "producer_id", "delivery_date", "status"),
        Index("orders_device_idx", "device_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    producer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("producers.id", ondelete="CASCADE"))
    buyer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("buyers.id", ondelete="RESTRICT"))
    status: Mapped[str] = mapped_column(String, default="pendente")
    payment_status: Mapped[str] = mapped_column(String, default="a_receber")
    delivery_date: Mapped[date] = mapped_column(Date)
    delivery_time: Mapped[time] = mapped_column(Time)
    notes: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String, default="toque")
    tracking_token: Mapped[str] = mapped_column(String, unique=True)
    device_id: Mapped[str | None] = mapped_column(String)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    buyer: Mapped[Buyer] = relationship()
    items: Mapped[list[OrderItem]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderItem.product_name"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL")
    )
    product_name: Mapped[str] = mapped_column(String)
    unit: Mapped[str] = mapped_column(String)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    intermediary_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    order: Mapped[Order] = relationship(back_populates="items")


class UsageEvent(Base):
    __tablename__ = "usage_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    producer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("producers.id", ondelete="SET NULL")
    )
    device_id: Mapped[str | None] = mapped_column(String)
    kind: Mapped[str] = mapped_column(String)
    model: Mapped[str | None] = mapped_column(String)
    tokens_in: Mapped[int | None] = mapped_column(Integer)
    tokens_out: Mapped[int | None] = mapped_column(Integer)
    audio_seconds: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    cost_brl: Mapped[Decimal] = mapped_column(Numeric(10, 4), default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    producer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("producers.id", ondelete="CASCADE"))
    endpoint: Mapped[str] = mapped_column(String, unique=True)
    p256dh: Mapped[str] = mapped_column(String)
    auth: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
