import base64
import time
import uuid

import jwt
import pytest

from app.ai.cost import llm_cost_brl, stt_cost_brl
from app.auth import verify_token
from app.config import Settings
from app.errors import DomainError
from tests.helpers import create_producer

SECRET = "segredo-de-teste-com-mais-de-32-caracteres!!"


def token(secret=SECRET, aud="authenticated", exp_delta=3600, alg="HS256"):
    claims = {"sub": str(uuid.uuid4()), "aud": aud, "exp": int(time.time()) + exp_delta}
    return jwt.encode(claims, secret, algorithm=alg)


def settings():
    return Settings(supabase_jwt_secret=SECRET)


def test_verify_token_accepts_valid_hs256():
    assert verify_token(token(), settings())["aud"] == "authenticated"


@pytest.mark.parametrize(
    "bad",
    [
        lambda: token(exp_delta=-10),
        lambda: token(secret="outro-segredo-com-mais-de-32-caracteres!!!"),
        lambda: token(aud="anon"),
        lambda: "lixo.sem.sentido",
        lambda: jwt.encode({"sub": "x"}, None, algorithm="none"),
    ],
)
def test_verify_token_rejects_bad_tokens(bad):
    with pytest.raises(DomainError) as exc:
        verify_token(bad(), settings())
    assert exc.value.status_code == 401


def test_verify_token_without_configuration_is_server_error():
    with pytest.raises(DomainError) as exc:
        verify_token(token(), Settings(supabase_jwt_secret=None))
    assert exc.value.status_code == 500


def test_cost_matches_published_prices():
    s = Settings()
    # Haiku 5.5: 1.000 entrada + 200 saída = US$ 0,0002 = R$ 0,0011 a R$ 5,50
    assert float(llm_cost_brl("claude-haiku-5-5", 1000, 200, s)) == pytest.approx(0.0011, abs=1e-4)
    # Sonnet 5.5 custa 20x mais na entrada
    assert float(llm_cost_brl("claude-sonnet-5-5", 1000, 200, s)) == pytest.approx(0.022, abs=1e-3)
    # modelo desconhecido cobra como o mais caro
    assert llm_cost_brl("modelo-novo", 1000, 200, s) == llm_cost_brl("claude-sonnet-5-5", 1000, 200, s)
    # 60 s de áudio a US$ 0,003 por minuto
    assert float(stt_cost_brl(60, s)) == pytest.approx(0.0165, abs=1e-4)


def test_push_subscribe_is_idempotent_and_public_key_endpoint(env):
    c = env.client
    headers, _ = create_producer(c)
    body = {"endpoint": "https://push.exemplo/abc123456789", "keys": {"p256dh": "k1", "auth": "a1"}}
    assert c.post("/push/subscribe", json=body, headers=headers).status_code == 204
    body["keys"] = {"p256dh": "k2", "auth": "a2"}
    assert c.post("/push/subscribe", json=body, headers=headers).status_code == 204
    from sqlalchemy import select

    from app.models import PushSubscription

    with env.factory() as db:
        subs = db.scalars(select(PushSubscription)).all()
    assert len(subs) == 1 and subs[0].p256dh == "k2"
    assert c.get("/push/public-key").json() == {"public_key": None}


def test_notify_is_noop_without_vapid(env):
    from app.notifications.push import notify_producer

    with env.factory() as db:
        assert notify_producer(db, uuid.uuid4(), "t", "b") == 0


def test_generated_vapid_keys_are_usable_by_pywebpush():
    from py_vapid import Vapid

    from app.notifications.generate_vapid import generate

    public, private = generate()
    assert len(base64.urlsafe_b64decode(public + "=" * (-len(public) % 4))) == 65
    Vapid.from_string(private)  # carrega sem erro
