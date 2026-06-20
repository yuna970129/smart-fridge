"""Azure OpenAI implementation of `LLMProvider`.

Uses the official `openai` SDK's `AzureOpenAI` client. Credentials are read from
settings; until they are provided the factory falls back to the mock provider,
so the app never hard-fails on missing auth.
"""

from __future__ import annotations

import base64
import json
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger
from app.providers.llm.base import LLMError, LLMProvider

logger = get_logger(__name__)


def _data_url(image: bytes) -> str:
    # Detect a few common signatures; default to jpeg.
    mime = "image/jpeg"
    if image[:8] == b"\x89PNG\r\n\x1a\n":
        mime = "image/png"
    elif image[:3] == b"GIF":
        mime = "image/gif"
    elif image[:4] == b"RIFF" and image[8:12] == b"WEBP":
        mime = "image/webp"
    b64 = base64.b64encode(image).decode("ascii")
    return f"data:{mime};base64,{b64}"


class AzureOpenAIProvider(LLMProvider):
    name = "azure_openai"

    def __init__(self) -> None:
        self._client = None

    def available(self) -> bool:
        return settings.azure_openai_configured

    def _get_client(self):
        if self._client is None:
            try:
                from openai import AzureOpenAI
            except ImportError as e:  # pragma: no cover
                raise LLMError("openai SDK not installed") from e
            self._client = AzureOpenAI(
                azure_endpoint=settings.azure_openai_endpoint,
                api_key=settings.azure_openai_api_key,
                api_version=settings.azure_openai_api_version,
            )
        return self._client

    def complete_json(
        self,
        *,
        system: str,
        user: str,
        images: list[bytes] | None = None,
        task: str = "generic",
        temperature: float = 0.2,
    ) -> Any:
        client = self._get_client()

        content: list[dict] = [{"type": "text", "text": user}]
        for img in images or []:
            content.append(
                {"type": "image_url", "image_url": {"url": _data_url(img)}}
            )

        try:
            resp = client.chat.completions.create(
                model=settings.azure_openai_deployment,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": content},
                ],
                temperature=temperature,
                response_format={"type": "json_object"},
            )
        except Exception as e:  # pragma: no cover - network/vendor errors
            logger.exception("Azure OpenAI call failed for task=%s", task)
            raise LLMError(str(e)) from e

        raw = resp.choices[0].message.content or "{}"
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            raise LLMError(f"Model did not return valid JSON: {raw[:200]}") from e
