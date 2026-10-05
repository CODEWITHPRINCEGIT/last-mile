"""OpenRouter-backed chat service.

The API key stays exclusively on the backend.
The existing RAG pipeline is unchanged.
"""

import logging
from typing import Any

from openai import OpenAI

from app.core.config import settings
from app.rag.pipeline import prepare_chat_prompt
from app.schemas.session import StudyMode

logger = logging.getLogger(__name__)


class ChatServiceError(RuntimeError):
    """Raised when OpenRouter cannot produce an answer."""


class ChatService:
    def __init__(self) -> None:
        self._client: Any | None = None

    @property
    def client(self) -> OpenAI:
        """Create the OpenRouter client lazily."""

        if self._client is not None:
            return self._client

        if not settings.openrouter_api_key:
            raise ChatServiceError(
                "OPENROUTER_API_KEY is not configured"
            )

        self._client = OpenAI(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
        )

        return self._client

    def answer(
    self,
    *,
    user_id: str,
        question: str,
        mode: StudyMode,
        conversation: list[dict] | None = None,
        document_ids: list[str] | None = None,
):
        """Generate an answer using the existing RAG pipeline + OpenRouter."""

        try:
            # IMPORTANT:
            # Your existing RAG pipeline stays unchanged.
            system_instruction, prompt, chunks = prepare_chat_prompt(
                user_id,
                question,
                mode,
                conversation=conversation,
                document_ids=document_ids,
            )

            response = self.client.chat.completions.create(
                model=settings.openrouter_model,
                messages=[
                    {
                        "role": "system",
                        "content": system_instruction,
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.25,
            )

            answer = (
                response.choices[0].message.content or ""
            ).strip()

            if not answer:
                raise ChatServiceError(
                    "OpenRouter returned an empty answer"
                )

            return answer, chunks

        except ChatServiceError:
            raise

        except Exception as exc:
            logger.exception(
                "RAG or OpenRouter request failed"
            )

            raise ChatServiceError(
                "The AI service could not answer this request"
            ) from exc
