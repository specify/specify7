import json
import re
from pathlib import Path


def detect_node():
    pkg = Path("package.json")

    if not pkg.exists():
        return None

    try:
        data = json.loads(pkg.read_text())
        engines = data.get("engines", {})
        node = engines.get("node")

        if not node:
            return None

        m = re.search(r"(\d+)", node)
        return f"{m.group(1)}.0" if m else None
    except Exception:
        return None


def detect_python():
    if Path("pyproject.toml").exists() or Path("requirements.txt").exists():
        return "3.12"
    return None


def detect_django():
    req_file = Path("requirements.txt")

    if not req_file.exists():
        return None

    content = req_file.read_text()

    match = re.search(
        r"(?i)^django\s*([<>=!~]=?)\s*([\d\.]+)",
        content,
        re.MULTILINE
    )

    if not match:
        return None

    version = match.group(2)

    # Normalize to major.minor
    parts = version.split(".")
    if len(parts) >= 2:
        return f"{parts[0]}.{parts[1]}"

    return f"{parts[0]}.0"


def scan_repo():
    results = {}

    node = detect_node()
    if node:
        results["node"] = node

    python = detect_python()
    if python:
        results["python"] = python

    django = detect_django()
    if django:
        results["django"] = django

    return results