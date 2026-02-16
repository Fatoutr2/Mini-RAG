import os
import time

from openai import OpenAI

from .metrics import inc_llm_calls, inc_llm_errors, inc_llm_retries

api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise ValueError("❌ La clé OPENROUTER_API_KEY n'est pas définie.")

client = OpenAI(
    api_key=api_key,
    base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
    default_headers={
        "HTTP-Referer": os.getenv("OPENROUTER_REFERER", "http://localhost:3000"),
        "X-Title": os.getenv("OPENROUTER_APP_TITLE", "Mini-RAG-Entreprise"),
    },
)

PRIMARY_MODEL = os.getenv("OPENROUTER_PRIMARY_MODEL", "openai/gpt-4o-mini")
FALLBACK_MODEL = os.getenv("OPENROUTER_FALLBACK_MODEL", "openai/gpt-4o-mini")
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
LLM_MAX_RETRIES = int(os.getenv("LLM_MAX_RETRIES", "2"))


def create_response(input_data, temperature=0.1):
    inc_llm_calls()
    last_error = None

    for attempt in range(LLM_MAX_RETRIES + 1):
        model = PRIMARY_MODEL if attempt < LLM_MAX_RETRIES else FALLBACK_MODEL
        try:
            if attempt > 0:
                inc_llm_retries()
            response = client.responses.create(
                model=model,
                input=input_data,
                temperature=temperature,
                timeout=LLM_TIMEOUT_SECONDS,
            )
            return response
        except Exception as exc:
            last_error = exc
            inc_llm_errors()
            time.sleep(min(0.6 * (attempt + 1), 2.0))

    raise RuntimeError(f"Erreur provider LLM: {last_error}")