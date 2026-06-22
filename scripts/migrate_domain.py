#!/usr/bin/env python3
"""
migrate_domain.py — Migra TODAS las referencias `cauaculture` → `cauacolombia`
preservando capitalización en los proyectos:

  • /Users/amauryamed/Documents/CacaoFrutaBrutal     (React/Vite app)
  • /Users/amauryamed/Documents/CauaColombia.co      (Shopify Liquid theme)

Uso:
    python3 scripts/migrate_domain.py --dry-run     # preview, sin cambios
    python3 scripts/migrate_domain.py --execute     # aplica cambios

Reemplazos (case-preserving):
    cauaculture     → cauacolombia
    Cauaculture     → Cauacolombia
    CAUACULTURE     → CAUACOLOMBIA
    CauaCulture     → CauaColombia

Aplica a: cauaculture.co, cauaculture.myshopify.com, amaury@cauaculture.co,
hello@cauaculture.co, emily.cauaculture.co, etc.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────────────
TARGETS = [
    Path("/Users/amauryamed/Documents/CacaoFrutaBrutal"),
    Path("/Users/amauryamed/Documents/CauaColombia.co"),
]

EXCLUDE_DIRS = {
    "node_modules", ".git", "dist", "build", ".vite", ".next",
    ".cache", ".turbo", ".shopify", ".react-router", ".octogent/.cache",
}

# Files that contain the strings as data/code and must NOT be rewritten.
EXCLUDE_FILES = {
    "scripts/migrate_domain.py",
    "scripts/sync_theme_files.py",
    "scripts/.migrate_report.json",
}

INCLUDE_EXTS = {
    ".md", ".mdx", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".html", ".liquid", ".json", ".css", ".scss", ".toml", ".yml", ".yaml",
    ".env.example", ".sh", ".py", ".txt", ".sql",
}
INCLUDE_FILENAMES = {
    ".env.example", "README.md", "CLAUDE.md", "Dockerfile", ".shopifyignore",
    ".gitignore",
}

# Replacements ordered: more specific first to avoid partial overwrites.
REPLACEMENTS = [
    ("CAUACULTURE", "CAUACOLOMBIA"),
    ("CauaCulture", "CauaColombia"),
    ("Cauaculture", "Cauacolombia"),
    ("cauaculture", "cauacolombia"),
]

# ── Helpers ─────────────────────────────────────────────────────────────────
def is_text_file(path: Path) -> bool:
    if path.name in INCLUDE_FILENAMES:
        return True
    return path.suffix.lower() in INCLUDE_EXTS


def should_skip_dir(path: Path) -> bool:
    return any(part in EXCLUDE_DIRS for part in path.parts)


def iter_files(root: Path):
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if should_skip_dir(p):
            continue
        if not is_text_file(p):
            continue
        rel = str(p.relative_to(root))
        if rel in EXCLUDE_FILES:
            continue
        yield p


def replace_in_text(text: str) -> tuple[str, int]:
    total = 0
    for old, new in REPLACEMENTS:
        count = text.count(old)
        if count:
            text = text.replace(old, new)
            total += count
    return text, total


def process_file(path: Path, execute: bool) -> tuple[int, list[str]]:
    """Returns (count, sample_lines_changed)."""
    try:
        original = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, PermissionError):
        return 0, []
    new_text, count = replace_in_text(original)
    if count == 0:
        return 0, []

    samples = []
    old_lines = original.splitlines()
    new_lines = new_text.splitlines()
    for i, (a, b) in enumerate(zip(old_lines, new_lines), 1):
        if a != b:
            samples.append(f"  L{i}: {a.strip()[:120]}")
            if len(samples) >= 3:
                break

    if execute:
        path.write_text(new_text, encoding="utf-8")
    return count, samples


# ── Main ────────────────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser()
    grp = ap.add_mutually_exclusive_group(required=True)
    grp.add_argument("--dry-run", action="store_true",
                     help="Preview sin tocar archivos")
    grp.add_argument("--execute", action="store_true",
                     help="Aplica los cambios")
    ap.add_argument("--report", default="scripts/.migrate_report.json",
                    help="Path JSON con log de cambios")
    args = ap.parse_args()

    execute = args.execute
    mode = "EXECUTE" if execute else "DRY-RUN"
    print(f"\n=== {mode} :: cauaculture → cauacolombia ===\n")

    total_files = 0
    total_changes = 0
    report = {
        "mode": mode, "started_at": datetime.now().isoformat(),
        "targets": [str(t) for t in TARGETS], "files": [],
    }

    for root in TARGETS:
        if not root.exists():
            print(f"[SKIP] {root} (no existe)")
            continue
        print(f"\n→ {root}")
        for path in iter_files(root):
            count, samples = process_file(path, execute)
            if count == 0:
                continue
            total_files += 1
            total_changes += count
            rel = path.relative_to(root)
            print(f"  [{count:>3}] {root.name}/{rel}")
            for s in samples:
                print(s)
            report["files"].append({
                "project": root.name, "path": str(rel),
                "count": count, "samples": samples,
            })

    print(f"\n=== {mode} done: {total_files} files, {total_changes} replacements ===")

    report["totals"] = {"files": total_files, "changes": total_changes}
    report_path = Path(__file__).parent / ".migrate_report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"Report: {report_path}")

    if not execute:
        print("\nReady to run:  python3 scripts/migrate_domain.py --execute\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
