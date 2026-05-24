"""Writer 層 — 把 ClassifierOutput 安全寫入 novel_db。

每個 destination 對應一個 writer；統一走 AtomicWriter 確保不會留下半寫狀態。
"""

from classifier.writers.base import AtomicWriter, WriterPreview, write_preview

__all__ = ["AtomicWriter", "WriterPreview", "write_preview"]
