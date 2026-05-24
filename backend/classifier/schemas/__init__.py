"""每個目的地的 pydantic schema。

Phase A 僅提供 base 與 stub；Phase B 補齊各目的地的完整欄位驗證。
"""

from classifier.schemas.base import DestinationPayload

__all__ = ["DestinationPayload"]
