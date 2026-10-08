import json
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel, ValidationError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import get_settings

T = TypeVar("T", bound=BaseModel)


class LLMError(RuntimeError):
    pass


def _type_label(annotation: Any) -> str:
    return str(annotation).replace("typing.", "").replace("<class '", "").replace("'>", "")


def _schema_hint(schema: type[BaseModel]) -> str:
    """List the exact keys the response must use. Prompts that omit them get guessed key names, and pydantic then drops the data."""
    fields = {name: _type_label(field.annotation) for name, field in schema.model_fields.items()}
    return (
        "\n\nReturn one JSON object using exactly these keys and types. Do not rename, nest or omit keys; "
        "use \"\", [] or null when a value is unknown:\n" + json.dumps(fields, indent=2)
    )


class DeepSeekClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @retry(
        retry=retry_if_exception_type((httpx.HTTPError, LLMError)),
        wait=wait_exponential(multiplier=1, min=1, max=20),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def json_completion(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema: type[T],
        model: str | None = None,
        temperature: float = 0.1,
        max_tokens: int = 2000,
        schema_hint: bool = True,
    ) -> tuple[T, dict[str, Any]]:
        if not self.settings.deepseek_api_key:
            raise LLMError("DEEPSEEK_API_KEY is not configured")
        if schema_hint:
            user_prompt += _schema_hint(schema)

        payload = {
            "model": model or self.settings.default_deepseek_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient(base_url=self.settings.deepseek_base_url, timeout=60) as client:
            response = await client.post(
                "/chat/completions",
                headers={"Authorization": f"Bearer {self.settings.deepseek_api_key}"},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"]
        try:
            parsed = json.loads(content)
            return schema.model_validate(parsed), {"raw": data, "usage": data.get("usage", {})}
        except (json.JSONDecodeError, ValidationError) as exc:
            raise LLMError(f"DeepSeek returned malformed JSON for {schema.__name__}: {exc}") from exc

