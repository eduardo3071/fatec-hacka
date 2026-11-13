"""IA para o produtor: propor catálogo por voz ou foto. Nada é gravado; ele confirma depois em POST /products."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from ..ai import pipelines
from ..config import get_settings
from ..db import get_db
from ..deps import current_producer, get_llm, get_transcriber
from ..models import Producer
from ..schemas import CatalogProposal

router = APIRouter(prefix="/ai", tags=["IA (produtor)"])


@router.post("/catalog/voice", response_model=CatalogProposal)
def catalog_from_voice(
    duration_seconds: float | None = Form(default=None, ge=0, le=300),
    audio: UploadFile = File(...),
    producer: Producer = Depends(current_producer),
    db: Session = Depends(get_db),
    llm=Depends(get_llm),
    stt=Depends(get_transcriber),
):
    settings = get_settings()
    return pipelines.propose_catalog_from_voice(
        db, settings, producer, audio=audio.file.read(settings.max_audio_bytes + 1),
        filename=audio.filename or "audio.webm", content_type=audio.content_type or "audio/webm",
        duration_hint=duration_seconds, llm=llm, stt=stt,
    )


@router.post("/catalog/photo", response_model=CatalogProposal)
def catalog_from_photo(
    image: UploadFile = File(...),
    producer: Producer = Depends(current_producer),
    db: Session = Depends(get_db),
    llm=Depends(get_llm),
):
    settings = get_settings()
    return pipelines.propose_catalog_from_photo(
        db, settings, producer, image=image.file.read(settings.max_audio_bytes + 1),
        content_type=image.content_type or "", llm=llm,
    )
