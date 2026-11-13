from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Tarifas oficiais consultadas em 13/11/2026 (US$ por milhão de tokens: entrada, saída).
# Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
LLM_PRICES_USD_PER_MTOK: dict[str, tuple[float, float]] = {
    "claude-haiku-5-5": (0.10, 0.50),
    "claude-sonnet-5-5": (2.00, 10.00),
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./dev.db"

    # Login do produtor (JWT do Supabase)
    supabase_url: str | None = None
    supabase_jwt_secret: str | None = None
    jwt_audience: str = "authenticated"

    cors_origin_regex: str = (
        r"^(https://.*\.(lovable\.app|lovableproject\.com|lovable\.dev)|http://localhost:\d+)$"
    )
    timezone: str = "America/Sao_Paulo"
    fx_brl_per_usd: float = 5.5  # fixado pelo regulamento do hackathon

    # IA
    llm_provider: str = "claude"
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    llm_model_text: str = "claude-haiku-5-5"
    llm_model_vision: str = "claude-sonnet-5-5"
    stt_model: str = "gpt-4o-mini-transcribe"
    stt_usd_per_min: float = 0.003  # OpenAI, consultado em 13/11/2026

    # Limites contra abuso e custo
    max_audio_bytes: int = 3_000_000
    max_orders_per_device_hour: int = 5
    max_voice_calls_per_device_day: int = 10
    max_ai_calls_producer_day: int = 30

    # Web Push
    vapid_public_key: str | None = None
    vapid_private_key: str | None = None
    vapid_subject: str = "mailto:contato@example.com"


@lru_cache
def get_settings() -> Settings:
    return Settings()
