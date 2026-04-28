"""OpenZeppelin-compatible Merkle tree builder for IoT attestation roots.

OZ MerkleProof.verify uses the convention: each pair of siblings is hashed
as keccak256(min || max) — sorted to make proofs commutative. We replicate
that here. The contract uses keccak256 (Ethereum's native hash). For leaves
we use SHA-256 (matches Ed25519 signing primitive on-device); the tree
internal nodes use keccak256 (matches the Solidity verifier).

CauaCore §8: every function ≤ 20 lines.
"""
from typing import List, Tuple
import hashlib
from eth_utils import keccak


def _sorted_pair_hash(a: bytes, b: bytes) -> bytes:
    """OZ MerkleProof convention: hash min || max so the root is order-agnostic."""
    lo, hi = (a, b) if a <= b else (b, a)
    return keccak(lo + hi)


def merkle_root(leaves: List[bytes]) -> bytes:
    """Compute root from sorted-pair hashed tree. Returns 32-byte root."""
    if not leaves:
        return b"\x00" * 32
    layer = list(leaves)
    while len(layer) > 1:
        if len(layer) % 2 == 1:
            layer.append(layer[-1])
        layer = [_sorted_pair_hash(layer[i], layer[i + 1]) for i in range(0, len(layer), 2)]
    return layer[0]


def merkle_proof(leaves: List[bytes], target_index: int) -> List[bytes]:
    """Return proof for `target_index`. List of sibling hashes from leaf to root."""
    proof: List[bytes] = []
    layer = list(leaves)
    idx = target_index
    while len(layer) > 1:
        if len(layer) % 2 == 1:
            layer.append(layer[-1])
        sibling = idx ^ 1
        proof.append(layer[sibling])
        layer = [_sorted_pair_hash(layer[i], layer[i + 1]) for i in range(0, len(layer), 2)]
        idx //= 2
    return proof


def sha256_leaf(payload_bytes: bytes) -> bytes:
    """SHA-256 of canonical_json bytes (used in iot_verify.py too)."""
    return hashlib.sha256(payload_bytes).digest()


def build_root_for_week(payload_hashes: List[bytes]) -> Tuple[bytes, int]:
    """Compute (root, leaf_count) from a list of payload SHA-256 hashes."""
    return merkle_root(payload_hashes), len(payload_hashes)
