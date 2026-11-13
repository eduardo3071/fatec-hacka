from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..deps import current_producer
from ..models import Producer, PushSubscription
from ..schemas import PushSubscribeIn

router = APIRouter(prefix="/push", tags=["avisos (push)"])


@router.get("/public-key")
def public_key():
    """Chave pública VAPID, que o navegador precisa para se inscrever."""
    return {"public_key": get_settings().vapid_public_key}


@router.post("/subscribe", status_code=204)
def subscribe(
    data: PushSubscribeIn, producer: Producer = Depends(current_producer), db: Session = Depends(get_db)
):
    sub = db.scalar(select(PushSubscription).where(PushSubscription.endpoint == data.endpoint))
    if sub is None:
        db.add(
            PushSubscription(
                producer_id=producer.id, endpoint=data.endpoint,
                p256dh=data.keys.p256dh, auth=data.keys.auth,
            )
        )
    else:
        sub.producer_id, sub.p256dh, sub.auth = producer.id, data.keys.p256dh, data.keys.auth
    db.commit()
