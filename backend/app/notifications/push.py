"""Web Push para o produtor. Sem VAPID configurado, não faz nada (e não quebra o pedido)."""

from __future__ import annotations

import json
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import PushSubscription

log = logging.getLogger(__name__)


def notify_producer(db: Session, producer_id: uuid.UUID, title: str, body: str, url: str = "/") -> int:
    settings = get_settings()
    if not (settings.vapid_private_key and settings.vapid_public_key):
        return 0
    from pywebpush import WebPushException, webpush

    sent = 0
    subs = db.scalars(select(PushSubscription).where(PushSubscription.producer_id == producer_id)).all()
    for sub in subs:
        try:
            webpush(
                subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}},
                data=json.dumps({"title": title, "body": body, "url": url}),
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_subject},
                timeout=5,
            )
            sent += 1
        except WebPushException as exc:
            status = getattr(getattr(exc, "response", None), "status_code", None)
            if status in (404, 410):  # assinatura expirada: remove
                db.delete(sub)
                db.commit()
            else:
                log.warning("falha no push para %s: %s", sub.id, exc)
        except Exception as exc:  # rede, timeout etc.: nunca derruba o fluxo do pedido
            log.warning("falha no push para %s: %s", sub.id, exc)
    return sent
