// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title  IoTAttestation
 * @notice Receives a Merkle root per ISO-week of Ed25519-verified IoT readings
 *         from CauaCorp Guardian sensors, and lets anyone prove a leaf is
 *         included in the attested set.
 *
 *         The oracle EOA (server-side, server-only key) calls `postRoot`.
 *         Anyone calls `verifyLeaf` to prove off-chain data matches the
 *         on-chain commitment.
 *
 *         No upgradeability. If we change leaf format or hashing scheme,
 *         deploy a new contract — old roots remain queryable forever.
 *
 *         See docs/WEB3.md (Phase 6) and CauaCore §8 (Python helpers ≤20 lines).
 */
contract IoTAttestation is AccessControl, Pausable {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct WeekRoot {
        bytes32 root;
        uint64  postedAt;        // block.timestamp
        uint32  leafCount;
    }

    mapping(uint64 => WeekRoot) public weekRoots;
    uint64 public latestWeek;

    error WeekAlreadyPosted(uint64 weekIndex);
    error NoRootForWeek(uint64 weekIndex);
    error EmptyRoot();

    event RootPosted(uint64 indexed weekIndex, bytes32 root, uint32 leafCount, address oracle);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        // ORACLE_ROLE intentionally NOT granted to admin — must be granted to oracle EOA post-deploy.
    }

    /**
     * @notice Post the Merkle root for a given ISO-week. Single-write per week.
     * @dev    Re-posting the same week reverts; misposts must wait until next week
     *         (off-chain re-signs are cheap; on-chain re-writes are not).
     */
    function postRoot(uint64 weekIndex, bytes32 root, uint32 leafCount)
        external
        whenNotPaused
        onlyRole(ORACLE_ROLE)
    {
        if (root == bytes32(0)) revert EmptyRoot();
        if (weekRoots[weekIndex].postedAt != 0) revert WeekAlreadyPosted(weekIndex);

        weekRoots[weekIndex] = WeekRoot({
            root: root,
            postedAt: uint64(block.timestamp),
            leafCount: leafCount
        });
        if (weekIndex > latestWeek) latestWeek = weekIndex;

        emit RootPosted(weekIndex, root, leafCount, msg.sender);
    }

    /**
     * @notice Verify that `leaf` was included in the attested set for `weekIndex`.
     *         Caller computes the leaf as SHA-256(canonical_json) — the same way
     *         the off-chain Merkle builder did.
     */
    function verifyLeaf(uint64 weekIndex, bytes32 leaf, bytes32[] calldata proof)
        external
        view
        returns (bool)
    {
        WeekRoot memory wr = weekRoots[weekIndex];
        if (wr.postedAt == 0) revert NoRootForWeek(weekIndex);
        return MerkleProof.verify(proof, wr.root, leaf);
    }

    function getRoot(uint64 weekIndex)
        external
        view
        returns (bytes32 root, uint64 postedAt, uint32 leafCount)
    {
        WeekRoot memory wr = weekRoots[weekIndex];
        return (wr.root, wr.postedAt, wr.leafCount);
    }

    // ─── Admin ──────────────────────────────────────────────────────────

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }
}
