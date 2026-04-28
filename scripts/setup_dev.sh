#!/usr/bin/env bash
# setup_dev.sh — Track A automation: install deps, verify build/test
# Usage: ./scripts/setup_dev.sh [--skip-frontend] [--skip-contracts]
# Run from repo root.

set -euo pipefail

SKIP_FRONTEND=0
SKIP_CONTRACTS=0
for arg in "$@"; do
  case "$arg" in
    --skip-frontend)  SKIP_FRONTEND=1 ;;
    --skip-contracts) SKIP_CONTRACTS=1 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \?//'
      exit 0 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

# Repo root sanity check
if [[ ! -f package.json || ! -d contracts ]]; then
  echo "✗ run from repo root (package.json + contracts/ must exist)" >&2
  exit 1
fi

step()  { printf "\n\033[1;36m▸ %s\033[0m\n" "$*"; }
ok()    { printf "  \033[1;32m✓\033[0m %s\n" "$*"; }
warn()  { printf "  \033[1;33m!\033[0m %s\n" "$*"; }
fail()  { printf "  \033[1;31m✗\033[0m %s\n" "$*"; exit 1; }

# ─── Prereqs ────────────────────────────────────────────────────────────────
step "Checking prerequisites"
command -v node >/dev/null || fail "node not found — install Node 20+"
command -v npm  >/dev/null || fail "npm not found"
NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
[[ "$NODE_MAJOR" -ge 20 ]] || fail "node $(node -v) too old — need ≥20"
ok "node $(node -v), npm $(npm -v)"

if [[ $SKIP_CONTRACTS -eq 0 ]]; then
  if ! command -v forge >/dev/null; then
    warn "foundry (forge) not installed"
    echo "    install with: curl -L https://foundry.paradigm.xyz | bash && foundryup"
    fail "install foundry then re-run, or pass --skip-contracts"
  fi
  ok "$(forge --version | head -1)"
fi

# ─── Frontend ───────────────────────────────────────────────────────────────
if [[ $SKIP_FRONTEND -eq 0 ]]; then
  step "Frontend: npm install"
  npm install
  ok "deps installed"

  step "Frontend: build (tsc + vite)"
  npm run build
  ok "build green"
else
  warn "skipping frontend (--skip-frontend)"
fi

# ─── Contracts ──────────────────────────────────────────────────────────────
if [[ $SKIP_CONTRACTS -eq 0 ]]; then
  step "Contracts: forge dependencies"
  pushd contracts >/dev/null

  if [[ ! -d lib/openzeppelin-contracts ]]; then
    forge install OpenZeppelin/openzeppelin-contracts@v5.0.2
    ok "openzeppelin-contracts@v5.0.2"
  else
    ok "openzeppelin-contracts already present"
  fi

  if [[ ! -d lib/forge-std ]]; then
    forge install foundry-rs/forge-std
    ok "forge-std"
  else
    ok "forge-std already present"
  fi

  step "Contracts: forge build"
  forge build
  ok "compiled"

  step "Contracts: forge test"
  forge test -vv
  ok "tests pass"

  popd >/dev/null
else
  warn "skipping contracts (--skip-contracts)"
fi

# ─── Done ───────────────────────────────────────────────────────────────────
printf "\n\033[1;32m✓ Track A complete.\033[0m Next: Track B (WalletConnect, Coinbase CDP, Persona, Pinata, Alchemy).\n"
