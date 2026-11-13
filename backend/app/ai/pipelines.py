"""Fluxos de IA: voz vira carrinho; voz ou foto vira proposta de catálogo.

A IA nunca grava nada. Ela devolve um rascunho que a pessoa confirma:
o comprador confirma o carrinho, o produtor confirma os produtos.
"""

from __future__ import annotations

import uuid
from datetime import date, time, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from ..config import Settings
from ..errors import DomainError
from ..models import UNITS, Producer, Product
from ..schemas import (
    CatalogProposal,
    CatalogProposalItem,
    DraftItem,
    VoiceOrderDraft,
)
from ..services.common import money, today_local
from . import cost
from .provider import LLMProvider, Transcriber

# ---------------------------------------------------------------- ferramentas
EXTRACT_ORDER_TOOL = {
    "name": "extrair_pedido",
    "description": "Registra os itens de um pedido de hortaliças falado em português do Brasil.",
    "input_schema": {
        "type": "object",
        "properties": {
            "itens": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "produto_id": {"type": "string", "description": "id do produto no catálogo"},
                        "quantidade": {"type": "number"},
                    },
                    "required": ["produto_id", "quantidade"],
                },
            },
            "nao_entendidos": {
                "type": "array",
                "items": {"type": "string"},
                "description": "trechos que não casam com o catálogo ou estão ambíguos",
            },
            "dia_entrega": {"type": "string", "enum": ["hoje", "amanha", "nao_informado"]},
            "hora_entrega": {"type": "string", "description": "HH:MM, ou vazio se não informada"},
        },
        "required": ["itens", "nao_entendidos", "dia_entrega", "hora_entrega"],
    },
}

PROPOSE_CATALOG_TOOL = {
    "name": "propor_catalogo",
    "description": "Propõe produtos de um catálogo de hortaliças a partir de fala ou foto.",
    "input_schema": {
        "type": "object",
        "properties": {
            "produtos": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "nome": {"type": "string"},
                        "unidade": {"type": "string", "description": "maço, dúzia, engradado, kg, unidade ou caixa"},
                        "preco_informado": {"type": "boolean"},
                        "preco": {"type": "number", "description": "0 se não informado"},
                    },
                    "required": ["nome", "unidade", "preco_informado", "preco"],
                },
            },
            "nao_entendidos": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["produtos", "nao_entendidos"],
    },
}

ORDER_SYSTEM = (
    "Você extrai pedidos de hortaliças a partir da transcrição de um áudio em português do Brasil. "
    "Use SOMENTE os produtos do catálogo informado, pelo id. Números por extenso viram dígitos. "
    "Se um item não existe no catálogo, se a unidade falada difere da do catálogo ou se a quantidade "
    "for ambígua, NÃO adivinhe: coloque o trecho em nao_entendidos. Nunca invente preços, produtos "
    "ou quantidades. Se o dia ou a hora de entrega não forem ditos, use nao_informado e hora vazia."
)

CATALOG_SYSTEM = (
    "Você ajuda um horticultor a cadastrar produtos. A entrada é uma fala transcrita ou a foto de uma "
    "lista de preços ou de produtos. Proponha cada produto com nome, unidade (maço, dúzia, engradado, "
    "kg, unidade ou caixa) e preço SOMENTE se estiver escrito ou dito. Sem preço, preco_informado=false "
    "e preco=0. Coloque em nao_entendidos tudo o que não conseguir ler ou interpretar."
)

_UNIT_SYNONYMS = {
    "maco": "maco", "maço": "maco", "macos": "maco", "maços": "maco",
    "duzia": "duzia", "dúzia": "duzia", "duzias": "duzia", "dúzias": "duzia",
    "engradado": "engradado", "engradados": "engradado",
    "kg": "kg", "quilo": "kg", "quilos": "kg", "kilo": "kg",
    "unidade": "unidade", "unidades": "unidade", "un": "unidade",
    "caixa": "caixa", "caixas": "caixa",
}
IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


# ------------------------------------------------------------------- helpers
def estimate_seconds(audio: bytes, hint: float | None) -> float:
    """A API de transcrição não informa a duração: usa a dica do cliente (limitada) ou estima pelo tamanho."""
    if hint is not None:
        return min(max(hint, 1.0), 120.0)
    return min(max(len(audio) / 16000, 1.0), 120.0)


def _check_upload(data: bytes, settings: Settings, what: str) -> None:
    if not data:
        raise DomainError(422, f"{what} vazio")
    if len(data) > settings.max_audio_bytes:
        raise DomainError(413, f"{what} grande demais (limite de {settings.max_audio_bytes // 1_000_000} MB)")


def _parse_time(text: str | None) -> time | None:
    if not text:
        return None
    try:
        hh, mm = text.strip().split(":")
        return time(int(hh), int(mm))
    except (ValueError, TypeError):
        return None


def _resolve_day(hint: str | None) -> date | None:
    if hint == "hoje":
        return today_local()
    if hint == "amanha":
        return today_local() + timedelta(days=1)
    return None


def _catalog_text(products: list[Product]) -> str:
    return "\n".join(f"{p.id} | {p.name} | {p.unit}" for p in products)


def _transcribe(
    db: Session, settings: Settings, stt: Transcriber, audio: bytes, filename: str,
    content_type: str, duration_hint: float | None, producer_id: uuid.UUID | None, device_id: str | None,
) -> str:
    result = stt.transcribe(audio, filename, content_type)
    cost.record_stt(
        db, settings, producer_id=producer_id, device_id=device_id, model=result.model,
        seconds=estimate_seconds(audio, duration_hint),
    )
    if not result.text:
        raise DomainError(422, "Não entendi o áudio. Tente falar de novo mais perto do microfone.")
    return result.text


# ---------------------------------------------------------------- voz -> pedido
def draft_voice_order(
    db: Session, settings: Settings, producer: Producer, products: list[Product], *,
    audio: bytes, filename: str, content_type: str, duration_hint: float | None,
    device_id: str, llm: LLMProvider, stt: Transcriber,
) -> VoiceOrderDraft:
    _check_upload(audio, settings, "Áudio")
    if not products:
        raise DomainError(422, "O produtor ainda não tem produtos no catálogo")
    cost.check_device_limit(db, settings, device_id)

    transcript = _transcribe(
        db, settings, stt, audio, filename, content_type, duration_hint, producer.id, device_id
    )
    result = llm.structured(
        system=ORDER_SYSTEM,
        user=f"Catálogo (id | nome | unidade):\n{_catalog_text(products)}\n\nTranscrição:\n{transcript}",
        tool=EXTRACT_ORDER_TOOL,
        model=settings.llm_model_text,
    )
    cost.record_llm(
        db, settings, producer_id=producer.id, device_id=device_id, model=result.model,
        tokens_in=result.tokens_in, tokens_out=result.tokens_out,
    )

    by_id = {str(p.id): p for p in products}
    unmatched = [str(t) for t in result.data.get("nao_entendidos", [])]
    merged: dict[str, Decimal] = {}
    for raw in result.data.get("itens", []):
        pid = str(raw.get("produto_id", ""))
        try:
            qty = Decimal(str(raw.get("quantidade", 0)))
        except Exception:
            qty = Decimal("0")
        if pid not in by_id or qty <= 0 or qty > 10000:
            unmatched.append(f"item não reconhecido: {pid or '?'} x {raw.get('quantidade')}")
            continue
        merged[pid] = merged.get(pid, Decimal("0")) + qty

    items = [
        DraftItem(
            product_id=by_id[pid].id,
            product_name=by_id[pid].name,
            unit=by_id[pid].unit,
            quantity=float(qty),
            unit_price=float(by_id[pid].price),
            subtotal=float(money(qty * by_id[pid].price)),
        )
        for pid, qty in merged.items()
    ]
    return VoiceOrderDraft(
        transcript=transcript,
        items=items,
        unmatched=unmatched,
        delivery_date=_resolve_day(result.data.get("dia_entrega")),
        delivery_time=_parse_time(result.data.get("hora_entrega")),
        total=float(sum((money(Decimal(str(i.subtotal))) for i in items), Decimal("0"))),
    )


# ------------------------------------------------------ voz/foto -> catálogo
def _proposal_from(result_data: dict, transcript: str | None) -> CatalogProposal:
    unmatched = [str(t) for t in result_data.get("nao_entendidos", [])]
    products: list[CatalogProposalItem] = []
    for raw in result_data.get("produtos", []):
        unit = _UNIT_SYNONYMS.get(str(raw.get("unidade", "")).strip().lower())
        name = str(raw.get("nome", "")).strip()
        if unit not in UNITS or len(name) < 2:
            unmatched.append(f"produto sem unidade ou nome válidos: {name or '?'}")
            continue
        informed = bool(raw.get("preco_informado")) and float(raw.get("preco", 0)) > 0
        products.append(
            CatalogProposalItem(
                name=name, unit=unit, price=float(raw["preco"]) if informed else None,
                price_missing=not informed,
            )
        )
    return CatalogProposal(transcript=transcript, products=products, unmatched=unmatched)


def propose_catalog_from_voice(
    db: Session, settings: Settings, producer: Producer, *, audio: bytes, filename: str,
    content_type: str, duration_hint: float | None, llm: LLMProvider, stt: Transcriber,
) -> CatalogProposal:
    _check_upload(audio, settings, "Áudio")
    cost.check_producer_limit(db, settings, producer.id)
    transcript = _transcribe(
        db, settings, stt, audio, filename, content_type, duration_hint, producer.id, None
    )
    result = llm.structured(
        system=CATALOG_SYSTEM, user=f"Fala transcrita:\n{transcript}",
        tool=PROPOSE_CATALOG_TOOL, model=settings.llm_model_text,
    )
    cost.record_llm(
        db, settings, producer_id=producer.id, device_id=None, model=result.model,
        tokens_in=result.tokens_in, tokens_out=result.tokens_out,
    )
    return _proposal_from(result.data, transcript)


def propose_catalog_from_photo(
    db: Session, settings: Settings, producer: Producer, *, image: bytes, content_type: str,
    llm: LLMProvider,
) -> CatalogProposal:
    _check_upload(image, settings, "Imagem")
    if content_type not in IMAGE_TYPES:
        raise DomainError(415, "Envie a foto em JPEG, PNG ou WebP")
    cost.check_producer_limit(db, settings, producer.id)
    result = llm.structured(
        system=CATALOG_SYSTEM,
        user="Proponha os produtos que aparecem nesta foto.",
        tool=PROPOSE_CATALOG_TOOL,
        model=settings.llm_model_vision,
        images=[(content_type, image)],
    )
    cost.record_llm(
        db, settings, producer_id=producer.id, device_id=None, model=result.model,
        tokens_in=result.tokens_in, tokens_out=result.tokens_out,
    )
    return _proposal_from(result.data, None)
