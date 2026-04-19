#!/bin/bash
# Install CAUA pre-commit hooks (skip in CI/Vercel environments)
[ -n "${VERCEL}" ] && exit 0
[ -n "${CI}" ] && exit 0
[ -d .git ] || exit 0
mkdir -p .git/hooks
cp scripts/pre-commit-hook .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "✓ Pre-commit hook instalado"
