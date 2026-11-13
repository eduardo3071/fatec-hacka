import uuid
from datetime import timedelta

from app.services.common import today_local


def new_user() -> tuple[uuid.UUID, dict]:
    uid = uuid.uuid4()
    return uid, {"X-Test-User": str(uid)}


def create_producer(client, slug="marcos-biritiba", name="Marcos"):
    _, headers = new_user()
    r = client.post(
        "/producer", json={"slug": slug, "name": name, "pix_key": "marcos@pix.exemplo"}, headers=headers
    )
    assert r.status_code == 201, r.text
    return headers, r.json()


def create_product(client, headers, name, unit="maco", price="3.50", interm=None):
    body = {"name": name, "unit": unit, "price": price}
    if interm is not None:
        body["intermediary_price"] = interm
    r = client.post("/products", json=body, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def tomorrow():
    return today_local() + timedelta(days=1)


def order_body(
    items, *, day=None, time="07:00", device="device-aaaa-1111", phone="11911110000",
    name="Restaurante A", source="toque",
):
    return {
        "buyer_name": name,
        "buyer_phone": phone,
        "device_id": device,
        "delivery_date": (day or tomorrow()).isoformat(),
        "delivery_time": time,
        "items": [{"product_id": pid, "quantity": qty} for pid, qty in items],
        "source": source,
    }


def place_order(client, slug, items, **kwargs):
    r = client.post(f"/public/{slug}/orders", json=order_body(items, **kwargs))
    assert r.status_code == 201, r.text
    return r.json()


def find_order_id(client, headers, token):
    """O comprador só conhece o token; o produtor acha o pedido na lista dele."""
    orders = client.get("/orders", headers=headers).json()
    track = client.get(f"/public/orders/{token}").json()
    matches = [
        o for o in orders
        if o["delivery_date"] == track["delivery_date"] and o["total"] == track["total"]
        and o["status"] == track["status"]
    ]
    assert matches, "pedido não encontrado na lista do produtor"
    return matches[-1]["id"]
