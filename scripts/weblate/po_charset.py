#!/usr/bin/env python3
"""Ensure gettext PO headers explicitly declare UTF-8."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


CONTENT_TYPE = re.compile(r'Content-Type:\s*text/plain(?:;[^"\\\r\n]*)?(\\n)', re.IGNORECASE)
UTF8_CHARSET = re.compile(r"charset\s*=\s*utf-8", re.IGNORECASE)
REPLACEMENT = "Content-Type: text/plain; charset=UTF-8\\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path, help="Directory containing PO files")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Report files needing repair without modifying them",
    )
    args = parser.parse_args()

    files = sorted(args.directory.rglob("*.po"))
    if not files:
        print(f"No PO files found under {args.directory}", file=sys.stderr)
        return 1

    needs_repair: list[Path] = []
    invalid: list[Path] = []
    for path in files:
        content = path.read_text(encoding="utf-8")
        header, separator, body = content.partition("\n\n")
        match = CONTENT_TYPE.search(header) if separator else None
        if match is None:
            invalid.append(path)
            continue

        if UTF8_CHARSET.search(match.group(0)):
            continue
        needs_repair.append(path)
        if not args.check:
            updated_header = CONTENT_TYPE.sub(lambda _: REPLACEMENT, header, count=1)
            path.write_text(updated_header + separator + body, encoding="utf-8")

    if invalid:
        print("Could not find a valid Content-Type header in:", file=sys.stderr)
        print("\n".join(str(path) for path in invalid), file=sys.stderr)
        return 1

    if args.check and needs_repair:
        print(f"{len(needs_repair)} PO files are missing a UTF-8 charset declaration.")
        return 1

    verb = "need repair" if args.check else "repaired"
    print(f"Checked {len(files)} PO files; {len(needs_repair)} {verb}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
