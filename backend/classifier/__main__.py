import sys

# Windows console 預設 cp950 / cp437；強制 stdout/stderr 走 UTF-8。
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from classifier.cli import main

raise SystemExit(main())
