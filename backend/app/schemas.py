"""Contratos da API (entrada e saída). Valores em dinheiro saem como número, não texto."""

from __future__ import annotations

import re
import uuid
from datetime import date, datetime, time
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

Unit = Literal["maco", "duzia", "engradado", "kg", "unidade", "caixa"]
Money = Annotated[Decimal, Field(ge=0, max_digits=10, decimal_places=2)]
Quantity = Annotated[Decimal, Field(gt=0, le=10000, max_digits=10, decimal_places=2)]
OrderStatus = Literal["pendente", "aceito", "recusado", "entregue", "cancelado"]
PaymentStatus = Literal["a_receber", "pago"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Produtor e produtos ----------
class ProducerIn(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{2,40}$")
    name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    municipality: str | None = Field(default=None, max_length=80)
    pix_key: str | None = Field(default=None, max_length=140)


class ProducerPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    municipality: str | None = Field(default=None, max_length=80)
    pix_key: str | None = Field(default=None, max_length=140)


class ProducerOut(ORM):
    id: uuid.UUID
    slug: str
    name: str
    phone: str | None
    municipality: str | None
    pix_key: str | None
    active: bool


class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    unit: Unit
    price: Money
    intermediary_price: Money | None = None


class ProductPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    unit: Unit | None = None
    price: Money | None = None
    intermediary_price: Money | None = None
    active: bool | None = None


class ProductOut(ORM):
    id: uuid.UUID
    name: str
    unit: str
    price: float
    intermediary_price: float | None
    active: bool


# ---------- Pedidos ----------
def _digits(value: str) -> str:
    return re.sub(r"\D", "", value)


class OrderItemIn(BaseModel):
    product_id: uuid.UUID
    quantity: Quantity


class OrderIn(BaseModel):
    buyer_name: str = Field(min_length=2, max_length=80)
    buyer_phone: str
    device_id: str = Field(min_length=8, max_length=100)
    delivery_date: date
    delivery_time: time
    items: list[OrderItemIn] = Field(min_length=1, max_length=40)
    notes: str | None = Field(default=None, max_length=300)
    source: Literal["toque", "voz"] = "toque"

    @field_validator("buyer_phone")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        digits = _digits(value)
        if not 10 <= len(digits) <= 13:
            raise ValueError("telefone deve ter de 10 a 13 dígitos")
        return digits


class OrderItemOut(ORM):
    product_name: str
    unit: str
    quantity: float
    unit_price: float
    subtotal: float


class OrderOut(BaseModel):
    id: uuid.UUID
    status: str
    payment_status: str
    delivery_date: date
    delivery_time: time
    total: float
    notes: str | None
    source: str
    buyer_name: str
    buyer_phone: str
    items: list[OrderItemOut]
    created_at: datetime


class PublicOrderOut(BaseModel):
    tracking_token: str
    status: str
    payment_status: str
    delivery_date: date
    delivery_time: time
    total: float
    items: list[OrderItemOut]
    producer_name: str
    pix_key: str | None


class PublicCatalog(BaseModel):
    producer_name: str
    municipality: str | None
    pix_key: str | None
    products: list[ProductOut]


class LastOrderItem(BaseModel):
    product_id: uuid.UUID
    product_name: str
    unit: str
    quantity: float
    still_available: bool


class LastOrder(BaseModel):
    items: list[LastOrderItem]


# ---------- Colheita, ganho e uso ----------
class HarvestBuyerShare(BaseModel):
    buyer_name: str
    quantity: float


class HarvestItem(BaseModel):
    product_name: str
    unit: str
    total_quantity: float
    buyers: list[HarvestBuyerShare]


class RouteStop(BaseModel):
    delivery_time: time
    order_id: uuid.UUID
    buyer_name: str
    buyer_phone: str
    items_count: int
    total: float
    payment_status: str
    notes: str | None


class HarvestOut(BaseModel):
    date: date
    items: list[HarvestItem]
    route: list[RouteStop]
    orders_accepted: int
    orders_pending: int


class EarningsOut(BaseModel):
    month: str
    orders_delivered: int
    revenue: float
    revenue_with_reference: float
    estimated_intermediary_revenue: float
    extra_gain: float
    coverage_pct: float


class UsageOut(BaseModel):
    month: str
    events: int
    cost_brl_total: float
    cost_brl_llm: float
    cost_brl_transcription: float


# ---------- IA ----------
class DraftItem(BaseModel):
    product_id: uuid.UUID
    product_name: str
    unit: str
    quantity: float
    unit_price: float
    subtotal: float


class VoiceOrderDraft(BaseModel):
    transcript: str
    items: list[DraftItem]
    unmatched: list[str]
    delivery_date: date | None
    delivery_time: time | None
    total: float
    needs_confirmation: bool = True
    source: Literal["voz"] = "voz"


class CatalogProposalItem(BaseModel):
    name: str
    unit: Unit
    price: float | None
    price_missing: bool


class CatalogProposal(BaseModel):
    transcript: str | None = None
    products: list[CatalogProposalItem]
    unmatched: list[str]


# ---------- Push ----------
class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscribeIn(BaseModel):
    endpoint: str = Field(min_length=10, max_length=1000)
    keys: PushKeys
