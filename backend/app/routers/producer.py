"""Rotas do produtor (exigem login)."""

from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import current_producer, current_user_id
from ..errors import DomainError
from ..models import Producer, Product
from ..schemas import (
    EarningsOut,
    HarvestOut,
    OrderOut,
    ProducerIn,
    ProducerOut,
    ProducerPatch,
    ProductIn,
    ProductOut,
    ProductPatch,
    UsageOut,
)
from ..services import earnings as earnings_service
from ..services import harvest as harvest_service
from ..services import orders as order_service

router = APIRouter(tags=["produtor (com login)"])

# Slugs que colidiriam com rotas públicas.
RESERVED_SLUGS = {"orders", "catalog", "public", "admin", "api"}


# ---------------------------------------------------------------- perfil
@router.post("/producer", response_model=ProducerOut, status_code=201)
def create_profile(
    data: ProducerIn, user_id: uuid.UUID = Depends(current_user_id), db: Session = Depends(get_db)
):
    if data.slug in RESERVED_SLUGS:
        raise DomainError(422, "Esse endereço é reservado. Escolha outro.")
    if db.scalar(select(Producer).where(Producer.user_id == user_id)):
        raise DomainError(409, "Este usuário já tem perfil de produtor")
    producer = Producer(user_id=user_id, **data.model_dump())
    db.add(producer)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DomainError(409, "Esse endereço já está em uso") from exc
    return producer


@router.get("/producer", response_model=ProducerOut)
def get_profile(producer: Producer = Depends(current_producer)):
    return producer


@router.patch("/producer", response_model=ProducerOut)
def update_profile(
    data: ProducerPatch, producer: Producer = Depends(current_producer), db: Session = Depends(get_db)
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(producer, field, value)
    db.commit()
    return producer


# -------------------------------------------------------------- produtos
@router.get("/products", response_model=list[ProductOut])
def list_products(
    include_inactive: bool = False,
    producer: Producer = Depends(current_producer),
    db: Session = Depends(get_db),
):
    query = select(Product).where(Product.producer_id == producer.id).order_by(Product.name)
    if not include_inactive:
        query = query.where(Product.active.is_(True))
    return list(db.scalars(query).all())


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(
    data: ProductIn, producer: Producer = Depends(current_producer), db: Session = Depends(get_db)
):
    product = Product(producer_id=producer.id, **data.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DomainError(409, "Já existe um produto com esse nome e unidade") from exc
    return product


def _own_product(db: Session, producer: Producer, product_id: uuid.UUID) -> Product:
    product = db.scalar(
        select(Product).where(Product.id == product_id, Product.producer_id == producer.id)
    )
    if product is None:
        raise DomainError(404, "Produto não encontrado")
    return product


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: uuid.UUID,
    data: ProductPatch,
    producer: Producer = Depends(current_producer),
    db: Session = Depends(get_db),
):
    product = _own_product(db, producer, product_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DomainError(409, "Já existe um produto com esse nome e unidade") from exc
    return product


@router.delete("/products/{product_id}", status_code=204)
def deactivate_product(
    product_id: uuid.UUID, producer: Producer = Depends(current_producer), db: Session = Depends(get_db)
):
    """Desativa em vez de apagar: pedidos antigos continuam apontando para o produto."""
    _own_product(db, producer, product_id).active = False
    db.commit()


# ---------------------------------------------------------------- pedidos
@router.get("/orders", response_model=list[OrderOut])
def list_orders(
    status: list[str] | None = Query(default=None),
    day: date | None = Query(default=None, alias="date"),
    producer: Producer = Depends(current_producer),
    db: Session = Depends(get_db),
):
    return [order_service.order_out(o) for o in order_service.list_orders(db, producer, status, day)]


def _action(name: str):
    def endpoint(
        order_id: uuid.UUID, producer: Producer = Depends(current_producer), db: Session = Depends(get_db)
    ):
        return order_service.order_out(order_service.transition(db, producer, order_id, name))

    return endpoint


for _name in ("accept", "reject", "deliver", "cancel"):
    router.add_api_route(
        f"/orders/{{order_id}}/{_name}", _action(_name), methods=["POST"], response_model=OrderOut,
        name=f"order_{_name}",
    )


@router.post("/orders/{order_id}/pay", response_model=OrderOut)
def pay_order(
    order_id: uuid.UUID, producer: Producer = Depends(current_producer), db: Session = Depends(get_db)
):
    return order_service.order_out(order_service.mark_paid(db, producer, order_id))


# ------------------------------------------------- colheita, ganho e uso
@router.get("/harvest", response_model=HarvestOut)
def harvest(
    day: date = Query(alias="date"),
    producer: Producer = Depends(current_producer),
    db: Session = Depends(get_db),
):
    return harvest_service.build_harvest(db, producer, day)


@router.get("/earnings", response_model=EarningsOut)
def earnings(
    month: str = Query(description="AAAA-MM"),
    producer: Producer = Depends(current_producer),
    db: Session = Depends(get_db),
):
    return earnings_service.build_earnings(db, producer, month)


@router.get("/usage", response_model=UsageOut)
def usage(
    month: str = Query(description="AAAA-MM"),
    producer: Producer = Depends(current_producer),
    db: Session = Depends(get_db),
):
    return earnings_service.build_usage(db, producer, month)
