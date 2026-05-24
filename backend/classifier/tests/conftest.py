"""pytest 共用 fixture。"""

from __future__ import annotations

import sys
from pathlib import Path

# 讓 `import classifier.*` 能解析（套件根 = backend/，classifier 套件位於其下）
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))
