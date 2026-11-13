import uuid
from types import SimpleNamespace

import pytest
from fastapi import Header
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.ai.provider import LLMResult, Transcript
from app.db import get_db
from app.deps import current_user_id, get_llm, get_transcriber
from app.main import app
from app.models import Base


class FakeLLM:
    """Responde com o que o teste definir em .responses[nome_da_ferramenta]. Não chama API."""

    def __init__(self):
        self.responses: dict[str, dict] = {}
        self.calls: list[dict] = []

    def structured(self, *, system, user, tool, model, images=None, max_tokens=1024):
        self.calls.append({"tool": tool["name"], "model": model, "user": user, "images": images})
        return LLMResult(data=self.responses[tool["name"]], tokens_in=1000, tokens_out=200, model=model)


class FakeSTT:
    def __init__(self):
        self.text = "vinte maços de alface e dez de couve para amanhã às sete"

    def transcribe(self, audio, filename, content_type):
        return Transcript(text=self.text, seconds=0.0, model="gpt-4o-mini-transcribe")


@pytest.fixture()
def env():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    llm, stt = FakeLLM(), FakeSTT()

    def override_db():
        with factory() as session:
            yield session

    def override_user(x_test_user: str = Header(...)):
        return uuid.UUID(x_test_user)

    app.dependency_overrides.update(
        {get_db: override_db, current_user_id: override_user, get_llm: lambda: llm, get_transcriber: lambda: stt}
    )
    yield SimpleNamespace(client=TestClient(app), llm=llm, stt=stt, factory=factory)
    app.dependency_overrides.clear()
