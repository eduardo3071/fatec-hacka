"""Rotas do comprador. Sem login: o produtor é identificado pelo slug do link dele."""

from __future__ import annotations

import logging
import re

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..ai import pipelines
from ..config import get_settings
from ..db import get_db
from ..deps import get_llm, get_transcriber
from ..errors import DomainError
from ..models import Buyer, Order, Producer, Product
from ..notifications.push import notify_producer
from ..schemas import (
    LastOrder,
    LastOrderItem,
    OrderIn,
    ProductOut,
    PublicCatalog,
    PublicOrderOut,
    VoiceOrderDraft,
)
from ..services import orders as order_service

log = logging.getLogger(__name__)
router = APIRouter(prefix="/public", tags=["comprador (sem login)"])


def _producer_by_slug(db: Session, slug: str) -> Producer:
    producer = db.scalar(select(Producer).where(Producer.slug == slug, Producer.active.is_(True)))
    if producer is None:
        raise DomainError(404, "Produtor não encontrado")
    return producer


def _active_products(db: Session, producer: Producer) -> list[Product]:
    return list(
        db.scalars(
            select(Product)
            .where(Product.producer_id == producer.id, Product.active.is_(True))
            .order_by(Product.name)
        ).all()
    )


# A rota de acompanhamento vem antes das de {slug} para "orders" nunca ser lido como slug.
@router.get("/orders/{tracking_token}", response_model=PublicOrderOut)
def track_order(tracking_token: str, db: Session = Depends(get_db)):
    order = db.scalar(
        select(Order).where(Order.tracking_token == tracking_token).options(selectinload(Order.items))
    )
    if order is None:
        raise DomainError(404, "Pedido não encontrado")
    producer = db.get(Producer, order.producer_id)
    return order_service.public_order_out(order, producer)


@router.get("/{slug}/catalog", response_model=PublicCatalog)
def catalog(slug: str, db: Session = Depends(get_db)):
    producer = _producer_by_slug(db, slug)
    return PublicCatalog(
        producer_name=producer.name,
        municipality=producer.municipality,
        pix_key=producer.pix_key,
        products=[ProductOut.model_validate(p) for p in _active_products(db, producer)],
    )


@router.post("/{slug}/orders", response_model=PublicOrderOut, status_code=201)
def create_order(slug: str, data: OrderIn, db: Session = Depends(get_db)):
    producer = _producer_by_slug(db, slug)
    order = order_service.create_order(db, producer, data)
    try:
        notify_producer(
            db, producer.id, "Novo pedido",
            f"{order.buyer.name} pediu para {order.delivery_date:%d/%m} às {order.delivery_time:%H:%M}",
            url="/pedidos",
        )
    except Exception:  # o aviso é um extra: nunca pode derrubar o pedido
        log.exception("falha ao avisar o produtor")
    return order_service.public_order_out(order, producer)


@router.get("/{slug}/last-order", response_model=LastOrder)
def last_order(
    slug: str,
    phone: str = Query(min_length=8, max_length=30),
    device_id: str = Query(min_length=8, max_length=100),
    db: Session = Depends(get_db),
):
    """Repetir o último pedido: só responde se telefone E aparelho batem com o comprador."""
    producer = _producer_by_slug(db, slug)
    digits = re.sub(r"\D", "", phone)
    buyer = db.scalar(
        select(Buyer).where(
            Buyer.producer_id == producer.id, Buyer.phone == digits, Buyer.device_id == device_id
        )
    )
    if buyer is None:
        return LastOrder(items=[])
    order = db.scalar(
        select(Order)
        .where(Order.buyer_id == buyer.id, Order.status.in_(("aceito", "entregue", "pendente")))
        .order_by(Order.created_at.desc())
        .options(selectinload(Order.items))
    )
    if order is None:
        return LastOrder(items=[])
    active = {p.id for p in _active_products(db, producer)}
    return LastOrder(
        items=[
            LastOrderItem(
                product_id=i.product_id,
                product_name=i.product_name,
                unit=i.unit,
                quantity=float(i.quantity),
                still_available=i.product_id in active,
            )
            for i in order.items
            if i.product_id is not None
        ]
    )


@router.post("/{slug}/voice-order", response_model=VoiceOrderDraft)
def voice_order(
    slug: str,
    device_id: str = Form(min_length=8, max_length=100),
    duration_seconds: float | None = Form(default=None, ge=0, le=300),
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    llm=Depends(get_llm),
    stt=Depends(get_transcriber),
):
    """Áudio vira um RASCUNHO de carrinho. Nada é gravado até o comprador confirmar em POST /orders."""
    settings = get_settings()
    producer = _producer_by_slug(db, slug)
    content = audio.file.read(settings.max_audio_bytes + 1)
    return pipelines.draft_voice_order(
        db, settings, producer, _active_products(db, producer),
        audio=content, filename=audio.filename or "audio.webm",
        content_type=audio.content_type or "audio/webm", duration_hint=duration_seconds,
        device_id=device_id, llm=llm, stt=stt,
    )
