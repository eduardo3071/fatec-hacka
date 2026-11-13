"""Validação do JWT do Supabase (login do produtor).

Dois modos, conforme o projeto:
- segredo compartilhado (legado, HS256): defina SUPABASE_JWT_SECRET;
- chaves assimétricas (RS256/ES256): defina SUPABASE_URL e o backend busca o JWKS.
"""

from functools import lru_cache

import jwt

from .config import Settings
from .errors import DomainError


@lru_cache
def _jwks_client(url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(f"{url.rstrip('/')}/auth/v1/.well-known/jwks.json")


def verify_token(token: str, settings: Settings) -> dict:
    try:
        alg = jwt.get_unverified_header(token).get("alg")
        if alg == "HS256":
            if not settings.supabase_jwt_secret:
                raise DomainError(500, "SUPABASE_JWT_SECRET não configurado")
            return jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience=settings.jwt_audience,
            )
        if alg in ("RS256", "ES256"):
            if not settings.supabase_url:
                raise DomainError(500, "SUPABASE_URL não configurado")
            key = _jwks_client(settings.supabase_url).get_signing_key_from_jwt(token).key
            return jwt.decode(token, key, algorithms=[alg], audience=settings.jwt_audience)
    except jwt.PyJWTError as exc:
        raise DomainError(401, "Sessão inválida ou expirada") from exc
    raise DomainError(401, "Algoritmo de assinatura não aceito")
