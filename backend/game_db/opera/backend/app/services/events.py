from __future__ import annotations

import asyncio
from collections import defaultdict
from datetime import UTC, datetime


class EventBroker:
    def __init__(self) -> None:
        self._queues: dict[str, list[asyncio.Queue[dict]]] = defaultdict(list)

    def subscribe(self, campaign_id: str) -> asyncio.Queue[dict]:
        queue: asyncio.Queue[dict] = asyncio.Queue()
        self._queues[campaign_id].append(queue)
        return queue

    def unsubscribe(self, campaign_id: str, queue: asyncio.Queue[dict]) -> None:
        listeners = self._queues.get(campaign_id, [])
        if queue in listeners:
            listeners.remove(queue)
        if not listeners and campaign_id in self._queues:
            del self._queues[campaign_id]

    def publish(self, campaign_id: str, event_type: str, payload: dict) -> None:
        envelope = {
            "event": event_type,
            "timestamp": datetime.now(UTC).isoformat(),
            "payload": payload,
        }
        for queue in list(self._queues.get(campaign_id, [])):
            queue.put_nowait(envelope)


broker = EventBroker()
