import uuid
from functools import lru_cache

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .ai.provider import LLMProvider, Transcriber
from .auth import verify_token
from .config import get_settings
from .db import get_db
from .errors import DomainError
from .models import Producer

_bearer = HTTPBearer(auto_error=False)


def current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> uuid.UUID:
    if credentials is None:
        raise DomainError(401, "Faça login para continuar")
    claims = verify_token(credentials.credentials, get_settings())
    try:
        return uuid.UUID(claims["sub"])
    except (KeyError, ValueError) as exc:
        raise DomainError(401, "Sessão sem identificação de usuário") from exc


def current_producer(
    user_id: uuid.UUID = Depends(current_user_id), db: Session = Depends(get_db)
) -> Producer:
    producer = db.scalar(select(Producer).where(Producer.user_id == user_id))
    if producer is None:
        raise DomainError(404, "Perfil de produtor ainda não criado")
    return producer


@lru_cache
def _llm() -> LLMProvider:
    from .ai.claude import ClaudeProvider

    return ClaudeProvider(get_settings().anthropic_api_key)


@lru_cache
def _stt() -> Transcriber:
    from .ai.transcribe import OpenAITranscriber

    return OpenAITranscriber(get_settings().openai_api_key, get_settings().stt_model)


def get_llm() -> LLMProvider:
    return _llm()


def get_transcriber() -> Transcriber:
    return _stt()
