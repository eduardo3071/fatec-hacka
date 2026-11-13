"""Interfaces de IA. O resto do código só conhece estes contratos, então trocar
Claude por outro modelo (ou por um modelo local) é trocar uma classe."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class LLMResult:
    data: dict
    tokens_in: int
    tokens_out: int
    model: str


@dataclass
class Transcript:
    text: str
    seconds: float
    model: str


class LLMProvider(Protocol):
    def structured(
        self,
        *,
        system: str,
        user: str,
        tool: dict,
        model: str,
        images: list[tuple[str, bytes]] | None = None,
        max_tokens: int = 1024,
    ) -> LLMResult:
        """Chama o modelo forçando a resposta no formato (JSON Schema) da ferramenta."""
        ...


class Transcriber(Protocol):
    def transcribe(self, audio: bytes, filename: str, content_type: str) -> Transcript: ...
