"""LLM provider abstraction — the single vendor seam.

Every feature that needs an LLM (receipt vision, consumption parsing, food-photo
recognition, recipe generation) goes through `LLMProvider.complete_json`. Swap
Azure OpenAI for any other vendor by adding one implementation; nothing else in
the codebase changes.

The `task` hint lets offline/mock providers return sensible canned data. Real
providers may ignore it (it is also handy for logging/metrics).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class LLMProvider(ABC):
    name: str = "base"

    @abstractmethod
    def available(self) -> bool:
        """Whether this provider is configured and ready."""

    @abstractmethod
    def complete_json(
        self,
        *,
        system: str,
        user: str,
        images: list[bytes] | None = None,
        task: str = "generic",
        temperature: float = 0.2,
    ) -> Any:
        """Return parsed JSON (dict or list) from the model.

        Prompts always request a JSON *object*; callers read the relevant key.
        `images` are raw bytes sent as multimodal content when supported.
        """


class LLMError(RuntimeError):
    pass
