from datetime import timedelta

import pytest

from app.services.common import today_local
from tests.helpers import (
    create_producer, create_product, find_order_id, order_body, place_order, tomorrow,
)


def setup_marcos(client):
    headers, producer = create_producer(client)
    alface = create_product(client, headers, "Alface crespa", price="3.50", interm="2.00")
    couve = create_product(client, headers, "Couve", price="3.00")
    brocolis = create_product(client, headers, "Brócolis", price="6.00", interm="4.00")
    return headers, producer, alface, couve, brocolis


def test_health(env):
    assert env.client.get("/health").json() == {"status": "ok"}


# ------------------------------------------------------------- perfil e produtos
def test_profile_rules(env):
    c = env.client
    headers, producer = create_producer(c)
    assert producer["slug"] == "marcos-biritiba"
    # segundo perfil do mesmo usuário
    r = c.post("/producer", json={"slug": "outro-slug", "name": "Outro"}, headers=headers)
    assert r.status_code == 409
    # mesmo slug, outro usuário
    r = c.post("/producer", json={"slug": "marcos-biritiba", "name": "X Y"}, headers={"X-Test-User": "11111111-1111-1111-1111-111111111111"})
    assert r.status_code == 409
    # slug reservado e slug inválido
    other = {"X-Test-User": "22222222-2222-2222-2222-222222222222"}
    assert c.post("/producer", json={"slug": "orders", "name": "Reservado"}, headers=other).status_code == 422
    assert c.post("/producer", json={"slug": "Com Espaço", "name": "Ruim"}, headers=other).status_code == 422


def test_public_catalog_shows_only_active_products(env):
    c = env.client
    headers, _, alface, couve, _ = setup_marcos(c)
    assert c.delete(f"/products/{couve['id']}", headers=headers).status_code == 204
    catalog = c.get("/public/marcos-biritiba/catalog").json()
    assert catalog["producer_name"] == "Marcos"
    assert catalog["pix_key"] == "marcos@pix.exemplo"
    names = [p["name"] for p in catalog["products"]]
    assert "Couve" not in names and "Alface crespa" in names
    assert c.get("/public/nao-existe/catalog").status_code == 404


def test_duplicate_product_is_conflict(env):
    c = env.client
    headers, *_ = setup_marcos(c)
    r = c.post("/products", json={"name": "Couve", "unit": "maco", "price": "3.00"}, headers=headers)
    assert r.status_code == 409


# ------------------------------------------------------------------- pedidos
def test_create_order_computes_totals_and_tracking(env):
    c = env.client
    headers, _, alface, couve, _ = setup_marcos(c)
    order = place_order(c, "marcos-biritiba", [(alface["id"], 20), (couve["id"], 10)])
    assert order["status"] == "pendente" and order["payment_status"] == "a_receber"
    assert order["total"] == 100.0
    assert {i["product_name"]: i["subtotal"] for i in order["items"]} == {"Alface crespa": 70.0, "Couve": 30.0}
    assert order["pix_key"] == "marcos@pix.exemplo"
    tracked = c.get(f"/public/orders/{order['tracking_token']}").json()
    assert tracked["total"] == 100.0
    assert c.get("/public/orders/token-inexistente").status_code == 404


def test_order_merges_duplicate_items_and_snapshots_price(env):
    c = env.client
    headers, _, alface, *_ = setup_marcos(c)
    order = place_order(c, "marcos-biritiba", [(alface["id"], 5), (alface["id"], 5)])
    assert len(order["items"]) == 1 and order["items"][0]["quantity"] == 10.0
    # mudar o preço depois não altera o pedido já feito
    c.patch(f"/products/{alface['id']}", json={"price": "9.99"}, headers=headers)
    tracked = c.get(f"/public/orders/{order['tracking_token']}").json()
    assert tracked["total"] == 35.0


def test_order_validations(env):
    c = env.client
    headers, _, alface, *_ = setup_marcos(c)
    other_headers, _ = create_producer(c, slug="outro-produtor", name="Outro Produtor")
    foreign = create_product(c, other_headers, "Alface do vizinho")
    url = "/public/marcos-biritiba/orders"
    # produto de outro produtor
    assert c.post(url, json=order_body([(foreign["id"], 1)])).status_code == 422
    # data no passado
    past = today_local() - timedelta(days=1)
    assert c.post(url, json=order_body([(alface["id"], 1)], day=past)).status_code == 422
    # quantidade zero e telefone curto
    assert c.post(url, json=order_body([(alface["id"], 0)])).status_code == 422
    assert c.post(url, json=order_body([(alface["id"], 1)], phone="123")).status_code == 422
    # produto desativado
    c.delete(f"/products/{alface['id']}", headers=headers)
    assert c.post(url, json=order_body([(alface["id"], 1)])).status_code == 422


def test_order_rate_limit_per_device(env):
    c = env.client
    _, _, alface, *_ = setup_marcos(c)
    for _ in range(5):
        place_order(c, "marcos-biritiba", [(alface["id"], 1)])
    r = c.post("/public/marcos-biritiba/orders", json=order_body([(alface["id"], 1)]))
    assert r.status_code == 429
    # outro aparelho continua podendo pedir
    place_order(c, "marcos-biritiba", [(alface["id"], 1)], device="device-bbbb-2222", phone="11922220000")


def test_order_flow_and_invalid_transitions(env):
    c = env.client
    headers, _, alface, *_ = setup_marcos(c)
    token = place_order(c, "marcos-biritiba", [(alface["id"], 4)])["tracking_token"]
    oid = find_order_id(c, headers, token)

    assert c.post(f"/orders/{oid}/pay", headers=headers).status_code == 409  # pendente não paga
    assert c.post(f"/orders/{oid}/deliver", headers=headers).status_code == 409  # precisa aceitar antes
    assert c.post(f"/orders/{oid}/accept", headers=headers).json()["status"] == "aceito"
    assert c.post(f"/orders/{oid}/accept", headers=headers).status_code == 409
    assert c.post(f"/orders/{oid}/deliver", headers=headers).json()["status"] == "entregue"
    assert c.post(f"/orders/{oid}/reject", headers=headers).status_code == 409
    paid = c.post(f"/orders/{oid}/pay", headers=headers).json()
    assert paid["payment_status"] == "pago"
    assert c.post(f"/orders/{oid}/pay", headers=headers).status_code == 409
    assert c.get(f"/public/orders/{token}").json()["status"] == "entregue"


def test_reject_and_cancel(env):
    c = env.client
    headers, _, alface, *_ = setup_marcos(c)
    t1 = place_order(c, "marcos-biritiba", [(alface["id"], 1)])["tracking_token"]
    o1 = find_order_id(c, headers, t1)
    assert c.post(f"/orders/{o1}/reject", headers=headers).json()["status"] == "recusado"
    assert c.post(f"/orders/{o1}/cancel", headers=headers).status_code == 409
    t2 = place_order(c, "marcos-biritiba", [(alface["id"], 2)], day=tomorrow() + timedelta(days=1))["tracking_token"]
    o2 = find_order_id(c, headers, t2)
    c.post(f"/orders/{o2}/accept", headers=headers)
    assert c.post(f"/orders/{o2}/cancel", headers=headers).json()["status"] == "cancelado"


def test_producers_are_isolated(env):
    c = env.client
    headers_a, _, alface, *_ = setup_marcos(c)
    headers_b, _ = create_producer(c, slug="outro-produtor", name="Outro Produtor")
    token = place_order(c, "marcos-biritiba", [(alface["id"], 3)])["tracking_token"]
    oid = find_order_id(c, headers_a, token)
    assert c.post(f"/orders/{oid}/accept", headers=headers_b).status_code == 404
    assert c.get("/orders", headers=headers_b).json() == []
    assert c.get("/products", headers=headers_b).json() == []
    assert c.patch(f"/products/{alface['id']}", json={"price": "1.00"}, headers=headers_b).status_code == 404


def test_last_order_requires_phone_and_device(env):
    c = env.client
    headers, _, alface, couve, _ = setup_marcos(c)
    place_order(c, "marcos-biritiba", [(alface["id"], 20), (couve["id"], 10)])
    ok = c.get("/public/marcos-biritiba/last-order", params={"phone": "(11) 91111-0000", "device_id": "device-aaaa-1111"}).json()
    assert {i["product_name"]: i["quantity"] for i in ok["items"]} == {"Alface crespa": 20.0, "Couve": 10.0}
    assert all(i["still_available"] for i in ok["items"])
    wrong_device = c.get("/public/marcos-biritiba/last-order", params={"phone": "11911110000", "device_id": "outro-aparelho-9"}).json()
    assert wrong_device["items"] == []
    c.delete(f"/products/{couve['id']}", headers=headers)
    after = c.get("/public/marcos-biritiba/last-order", params={"phone": "11911110000", "device_id": "device-aaaa-1111"}).json()
    assert {i["product_name"]: i["still_available"] for i in after["items"]} == {"Alface crespa": True, "Couve": False}


def test_new_order_notifies_producer_and_survives_push_failure(env, monkeypatch):
    c = env.client
    _, producer, alface, *_ = setup_marcos(c)
    calls = []
    monkeypatch.setattr("app.routers.public.notify_producer", lambda *a, **k: calls.append(a))
    place_order(c, "marcos-biritiba", [(alface["id"], 1)])
    assert len(calls) == 1 and str(calls[0][1]) == producer["id"]

    def boom(*a, **k):
        raise RuntimeError("push fora do ar")

    monkeypatch.setattr("app.routers.public.notify_producer", boom)
    place_order(c, "marcos-biritiba", [(alface["id"], 1)], device="device-bbbb-2222", phone="11922220000")


# --------------------------------------------------------- colheita e ganho
def test_harvest_consolidates_by_product_and_sorts_route(env):
    c = env.client
    headers, _, alface, couve, brocolis = setup_marcos(c)
    day = tomorrow()
    tokens = [
        place_order(c, "marcos-biritiba", [(alface["id"], 20), (couve["id"], 10)], time="07:00",
                    name="Restaurante A", phone="11911110000", device="device-aaaa-1111")["tracking_token"],
        place_order(c, "marcos-biritiba", [(alface["id"], 15), (brocolis["id"], 5)], time="06:40",
                    name="Mercadinho B", phone="11922220000", device="device-bbbb-2222")["tracking_token"],
    ]
    for token in tokens:
        c.post(f"/orders/{find_order_id(c, headers, token)}/accept", headers=headers)
    # pedido pendente não entra na lista, só é contado
    place_order(c, "marcos-biritiba", [(alface["id"], 99)], time="08:00", name="Feirante C",
                phone="11933330000", device="device-cccc-3333")

    harvest = c.get("/harvest", params={"date": day.isoformat()}, headers=headers).json()
    items = {i["product_name"]: i for i in harvest["items"]}
    assert items["Alface crespa"]["total_quantity"] == 35.0
    assert {b["buyer_name"]: b["quantity"] for b in items["Alface crespa"]["buyers"]} == {
        "Restaurante A": 20.0, "Mercadinho B": 15.0,
    }
    assert items["Couve"]["total_quantity"] == 10.0 and items["Brócolis"]["total_quantity"] == 5.0
    assert [s["buyer_name"] for s in harvest["route"]] == ["Mercadinho B", "Restaurante A"]
    assert [s["delivery_time"] for s in harvest["route"]] == ["06:40:00", "07:00:00"]
    assert harvest["orders_accepted"] == 2 and harvest["orders_pending"] == 1
    # outro dia está vazio
    empty = c.get("/harvest", params={"date": (day + timedelta(days=5)).isoformat()}, headers=headers).json()
    assert empty["items"] == [] and empty["route"] == []


def test_earnings_extra_gain_and_coverage(env):
    c = env.client
    headers, _, alface, couve, _ = setup_marcos(c)  # couve não tem preço do intermediário
    token = place_order(c, "marcos-biritiba", [(alface["id"], 20), (couve["id"], 10)], day=today_local())["tracking_token"]
    oid = find_order_id(c, headers, token)
    c.post(f"/orders/{oid}/accept", headers=headers)
    c.post(f"/orders/{oid}/deliver", headers=headers)
    month = today_local().strftime("%Y-%m")
    e = c.get("/earnings", params={"month": month}, headers=headers).json()
    assert e["orders_delivered"] == 1 and e["revenue"] == 100.0
    assert e["revenue_with_reference"] == 70.0 and e["estimated_intermediary_revenue"] == 40.0
    assert e["extra_gain"] == 30.0 and e["coverage_pct"] == 70.0
    assert c.get("/earnings", params={"month": "2026-13"}, headers=headers).status_code == 422
    other = c.get("/earnings", params={"month": "2020-01"}, headers=headers).json()
    assert other["orders_delivered"] == 0 and other["coverage_pct"] == 0.0


@pytest.mark.parametrize("path", ["/producer", "/products", "/orders", "/usage?month=2026-11"])
def test_producer_routes_require_login(env, path):
    from app.deps import current_user_id

    from app.main import app

    app.dependency_overrides.pop(current_user_id)  # usa a verificação real
    assert env.client.get(path).status_code == 401
    assert env.client.get(path, headers={"Authorization": "Bearer lixo"}).status_code == 401
