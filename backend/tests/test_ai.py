import uuid
from datetime import datetime, timezone

import pytest

from tests.helpers import create_producer, create_product, tomorrow

AUDIO = ("pedido.webm", b"audio-de-mentira", "audio/webm")


def setup(client):
    headers, _ = create_producer(client)
    alface = create_product(client, headers, "Alface crespa", price="3.50")
    couve = create_product(client, headers, "Couve", price="3.00")
    return headers, alface, couve


def voice(client, device="device-aaaa-1111", audio=AUDIO, **extra):
    return client.post(
        "/public/marcos-biritiba/voice-order",
        data={"device_id": device, **extra},
        files={"audio": audio},
    )


def test_voice_order_builds_draft_and_logs_cost(env):
    c = env.client
    headers, alface, couve = setup(c)
    env.llm.responses["extrair_pedido"] = {
        "itens": [
            {"produto_id": alface["id"], "quantidade": 20},
            {"produto_id": couve["id"], "quantidade": 10},
            {"produto_id": str(uuid.uuid4()), "quantidade": 3},  # id inventado pela IA
        ],
        "nao_entendidos": ["um negócio roxo"],
        "dia_entrega": "amanha",
        "hora_entrega": "07:00",
    }
    r = voice(c, duration_seconds="12")
    assert r.status_code == 200, r.text
    draft = r.json()
    assert draft["transcript"].startswith("vinte maços")
    assert [i["product_name"] for i in draft["items"]] == ["Alface crespa", "Couve"]
    assert draft["total"] == 100.0
    assert draft["delivery_date"] == tomorrow().isoformat() and draft["delivery_time"] == "07:00:00"
    assert len(draft["unmatched"]) == 2  # a fala não entendida e o id inventado
    assert draft["needs_confirmation"] is True and draft["source"] == "voz"
    assert env.llm.calls[0]["model"] == "claude-haiku-5-5"
    # o catálogo foi enviado ao modelo: ele só conhece produtos reais
    assert str(alface["id"]) in env.llm.calls[0]["user"]

    # nada foi gravado como pedido
    assert c.get("/orders", headers=headers).json() == []
    # custo registrado: 1 transcrição + 1 chamada ao modelo
    month = datetime.now(timezone.utc).strftime("%Y-%m")  # eventos são gravados em UTC
    usage = c.get("/usage", params={"month": month}, headers=headers).json()
    assert usage["events"] == 2
    assert usage["cost_brl_llm"] == pytest.approx(0.0011, abs=1e-4)
    assert usage["cost_brl_transcription"] > 0


def test_voice_without_products_or_audio(env):
    c = env.client
    create_producer(c)
    assert voice(c).status_code == 422  # catálogo vazio


def test_voice_rejects_empty_and_huge_audio(env):
    c = env.client
    setup(c)
    assert voice(c, audio=("a.webm", b"", "audio/webm")).status_code == 422
    assert voice(c, audio=("a.webm", b"x" * 3_000_001, "audio/webm")).status_code == 413


def test_voice_unreadable_transcript(env):
    c = env.client
    setup(c)
    env.stt.text = ""
    assert voice(c).status_code == 422


def test_voice_daily_limit_per_device(env):
    c = env.client
    _, alface, _ = setup(c)
    env.llm.responses["extrair_pedido"] = {
        "itens": [{"produto_id": alface["id"], "quantidade": 1}],
        "nao_entendidos": [], "dia_entrega": "nao_informado", "hora_entrega": "",
    }
    for _ in range(10):
        assert voice(c).status_code == 200
    assert voice(c).status_code == 429
    assert voice(c, device="device-bbbb-2222").status_code == 200  # outro aparelho segue livre


def test_catalog_from_photo_normalizes_units_and_flags_missing_prices(env):
    c = env.client
    headers, _ = create_producer(c)
    env.llm.responses["propor_catalogo"] = {
        "produtos": [
            {"nome": "Alface crespa", "unidade": "maços", "preco_informado": True, "preco": 3.5},
            {"nome": "Couve", "unidade": "maço", "preco_informado": False, "preco": 0},
            {"nome": "Coisa", "unidade": "saco", "preco_informado": False, "preco": 0},
        ],
        "nao_entendidos": ["rabisco no canto"],
    }
    r = c.post("/ai/catalog/photo", files={"image": ("lista.jpg", b"\xff\xd8\xff\xe0", "image/jpeg")}, headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["products"][0] == {"name": "Alface crespa", "unit": "maco", "price": 3.5, "price_missing": False}
    assert body["products"][1]["price"] is None and body["products"][1]["price_missing"] is True
    assert len(body["products"]) == 2 and len(body["unmatched"]) == 2
    call = env.llm.calls[-1]
    assert call["model"] == "claude-sonnet-5-5" and call["images"][0][0] == "image/jpeg"
    # a IA não gravou nada
    assert c.get("/products", headers=headers).json() == []


def test_catalog_photo_rejects_wrong_type_and_voice_works(env):
    c = env.client
    headers, _ = create_producer(c)
    r = c.post("/ai/catalog/photo", files={"image": ("x.txt", b"texto", "text/plain")}, headers=headers)
    assert r.status_code == 415
    env.llm.responses["propor_catalogo"] = {
        "produtos": [{"nome": "Rúcula", "unidade": "maço", "preco_informado": True, "preco": 3.5}],
        "nao_entendidos": [],
    }
    r = c.post("/ai/catalog/voice", files={"audio": AUDIO}, headers=headers)
    assert r.status_code == 200 and r.json()["products"][0]["name"] == "Rúcula"
    assert r.json()["transcript"]


def test_ai_routes_need_login(env):
    from app.deps import current_user_id
    from app.main import app

    app.dependency_overrides.pop(current_user_id)
    assert env.client.post("/ai/catalog/voice", files={"audio": AUDIO}).status_code == 401
