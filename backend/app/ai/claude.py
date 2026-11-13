from __future__ import annotations

import base64

from ..errors import DomainError
from .provider import LLMResult

UNAVAILABLE = "A IA está indisponível agora. Monte o pedido pelo catálogo."


class ClaudeProvider:
    def __init__(self, api_key: str | None):
        self._api_key = api_key
        self._client = None

    def _get_client(self):
        if not self._api_key:
            raise DomainError(503, "IA não configurada (ANTHROPIC_API_KEY)")
        if self._client is None:
            from anthropic import Anthropic

            self._client = Anthropic(api_key=self._api_key, timeout=30.0, max_retries=1)
        return self._client

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
        client = self._get_client()
        content: list[dict] = [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media_type,
                    "data": base64.b64encode(data).decode(),
                },
            }
            for media_type, data in (images or [])
        ]
        content.append({"type": "text", "text": user})
        try:
            response = client.messages.create(
                model=model,
                max_tokens=max_tokens,
                system=system,
                tools=[tool],
                tool_choice={"type": "tool", "name": tool["name"]},
                messages=[{"role": "user", "content": content}],
            )
        except DomainError:
            raise
        except Exception as exc:
            raise DomainError(502, UNAVAILABLE) from exc
        for block in response.content:
            if block.type == "tool_use":
                return LLMResult(
                    data=dict(block.input),
                    tokens_in=response.usage.input_tokens,
                    tokens_out=response.usage.output_tokens,
                    model=model,
                )
        raise DomainError(502, UNAVAILABLE)
