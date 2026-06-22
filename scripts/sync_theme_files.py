#!/usr/bin/env python3
"""
sync_theme_files.py — Copia archivos faltantes de Cauaculture.co a CauaColombia.co
sin sobrescribir nada que ya exista en el destino.

Después corre migrate_domain.py para reemplazar referencias en los archivos copiados.

Uso:
    python3 scripts/sync_theme_files.py --dry-run
    python3 scripts/sync_theme_files.py --execute
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

SRC = Path("/Users/amauryamed/Documents/Cauaculture.co")
DST = Path("/Users/amauryamed/Documents/CauaColombia.co")

EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", ".cache"}
EXCLUDE_FILES = {".DS_Store"}


def should_skip(path: Path, base: Path) -> bool:
    rel_parts = path.relative_to(base).parts
    if any(p in EXCLUDE_DIRS for p in rel_parts):
        return True
    if path.name in EXCLUDE_FILES:
        return True
    return False


def main() -> int:
    ap = argparse.ArgumentParser()
    grp = ap.add_mutually_exclusive_group(required=True)
    grp.add_argument("--dry-run", action="store_true")
    grp.add_argument("--execute", action="store_true")
    args = ap.parse_args()

    execute = args.execute
    mode = "EXECUTE" if execute else "DRY-RUN"
    print(f"\n=== {mode} :: sync missing files ===\n")
    print(f"  src: {SRC}")
    print(f"  dst: {DST}\n")

    copied = 0
    skipped_existing = 0

    for src_path in SRC.rglob("*"):
        if should_skip(src_path, SRC):
            continue
        rel = src_path.relative_to(SRC)
        dst_path = DST / rel

        # Handle symlinks — copy as symlink if execute, else just log
        if src_path.is_symlink():
            if dst_path.exists() or dst_path.is_symlink():
                skipped_existing += 1
                continue
            if execute:
                dst_path.parent.mkdir(parents=True, exist_ok=True)
                target = src_path.readlink()
                dst_path.symlink_to(target)
            copied += 1
            print(f"  [SYM] {rel} -> {src_path.readlink()}")
            continue

        if src_path.is_dir():
            if not dst_path.exists():
                if execute:
                    dst_path.mkdir(parents=True, exist_ok=True)
                print(f"  [DIR] {rel}/")
            continue

        if not src_path.is_file():
            # Broken symlink or special file — skip
            print(f"  [SKIP] {rel} (not regular file)")
            continue

        # File
        if dst_path.exists():
            skipped_existing += 1
            continue

        if execute:
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src_path, dst_path, follow_symlinks=False)
        copied += 1
        print(f"  [NEW] {rel}")

    print(f"\n=== {mode} done: {copied} new files, {skipped_existing} existing skipped ===\n")
    if not execute:
        print("Ready: python3 scripts/sync_theme_files.py --execute\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
