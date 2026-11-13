from __future__ import annotations

from ..errors import DomainError
from .provider import Transcript


class OpenAITranscriber:
    def __init__(self, api_key: str | None, model: str):
        self._api_key = api_key
        self._model = model
        self._client = None

    def _get_client(self):
        if not self._api_key:
            raise DomainError(503, "Transcrição não configurada (OPENAI_API_KEY)")
        if self._client is None:
            from openai import OpenAI

            self._client = OpenAI(api_key=self._api_key, timeout=30.0, max_retries=1)
        return self._client

    def transcribe(self, audio: bytes, filename: str, content_type: str) -> Transcript:
        client = self._get_client()
        try:
            response = client.audio.transcriptions.create(
                model=self._model, file=(filename, audio, content_type), language="pt"
            )
        except DomainError:
            raise
        except Exception as exc:
            raise DomainError(502, "Não foi possível transcrever o áudio agora") from exc
        # A API não devolve a duração; o pipeline estima os segundos para o custo.
        return Transcript(text=(response.text or "").strip(), seconds=0.0, model=self._model)
