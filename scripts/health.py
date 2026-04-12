#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CAUA Health Checker — pre-commit hook to prevent code debt.
Detects: large files, console.log, unused imports.
Exits 1 only if console.log found (blocks commit).
Exits 0 for warnings (large files, unused imports).
"""

import re
import sys
import io
from pathlib import Path
from typing import List

# Fix Windows encoding issue
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

SRC_DIR = Path(__file__).parent.parent / "src"
MAX_FILE_SIZE = 200  # lines
EXCLUDE_PATTERNS = ["DevErrorMonitor.tsx", "node_modules", "dist"]


def check_large_files(max_lines: int = MAX_FILE_SIZE) -> List[str]:
    """Detect TypeScript/TSX files exceeding max_lines."""
    issues = []
    for file in SRC_DIR.rglob("*.ts*"):
        if any(exc in str(file) for exc in EXCLUDE_PATTERNS):
            continue
        line_count = len(file.read_text(encoding="utf-8", errors="ignore").splitlines())
        if line_count > max_lines:
            issues.append(f"  {file.relative_to(SRC_DIR)}: {line_count} líneas (máx {max_lines})")
    return issues


def check_console_logs() -> List[str]:
    """Detect console.log/console.error in production code (warn is ok for env checks)."""
    issues = []
    for file in SRC_DIR.rglob("*.ts*"):
        if any(exc in str(file) for exc in EXCLUDE_PATTERNS):
            continue
        content = file.read_text(encoding="utf-8", errors="ignore")
        lines = content.splitlines()
        for i, line in enumerate(lines, 1):
            # Only block console.log and console.error (not warn or info)
            if re.search(r"console\.(log|error)", line) and not line.strip().startswith("//"):
                issues.append(f"  {file.relative_to(SRC_DIR)}:{i}: {line.strip()[:60]}")
    return issues


def check_unused_imports() -> List[str]:
    """Detect unused imports (imported but used ≤1 time)."""
    issues = []
    for file in SRC_DIR.rglob("*.ts*"):
        if any(exc in str(file) for exc in EXCLUDE_PATTERNS):
            continue
        content = file.read_text(encoding="utf-8", errors="ignore")

        # Extract imports
        imports = re.findall(r"import\s+(?:\{([^}]+)\}|(\w+))\s+from", content)

        for match in imports:
            names_str = match[0] if match[0] else match[1]
            names = [n.strip().split(" as ")[0] for n in names_str.split(",")]

            for name in names:
                if not name:
                    continue
                # Count occurrences (≤1 means only in import)
                count = len(re.findall(rf"\b{name}\b", content))
                if count <= 1:
                    issues.append(f"  {file.relative_to(SRC_DIR)}: import '{name}' no utilizado")
    return issues


def main():
    """Run all checks and report."""
    print("\n✓ CAUA Health Checker\n")

    large = check_large_files()
    console = check_console_logs()
    unused = check_unused_imports()

    # Report large files (warning only)
    if large:
        print("⚠️  Archivos grandes (>200 líneas):")
        for issue in large[:5]:  # Show first 5
            print(issue)
        if len(large) > 5:
            print(f"  ... y {len(large) - 5} más")

    # Report console.log (CRITICAL — blocks commit)
    if console:
        print("\n🚫 BLOQUEADO: console.log/error encontrado:")
        for issue in console:
            print(issue)
        return 1  # EXIT 1 — block commit

    # Report unused imports (warning only)
    if unused:
        print("\n⚠️  Imports no utilizados:")
        for issue in unused[:5]:  # Show first 5
            print(issue)
        if len(unused) > 5:
            print(f"  ... y {len(unused) - 5} más")

    # Summary
    if not (large or console or unused):
        print("✅ Todo limpio — commit permitido\n")
    else:
        print("\n✅ Commit permitido (solo warnings, sin bloques)\n")

    return 0  # EXIT 0 — allow commit


if __name__ == "__main__":
    sys.exit(main())
