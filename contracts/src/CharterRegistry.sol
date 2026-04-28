// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  CharterRegistry
 * @notice Append-only on-chain landmark for the CauaCorp Charter (docs/CHARTER.md).
 *         Founders, Guardianes, and any holder can sign a charter version by
 *         calling `sign(charterHash, version)`. The `charterHash` is the
 *         SHA-256 of the file's UTF-8 bytes; `version` is the version string
 *         declared in the file's frontmatter.
 *
 *         Per Charter section IV (Mecanismo de enmienda), changes that touch
 *         principles I.1, I.3, or I.4 require quorum signing post-Phase 7.
 *         This contract makes that quorum verifiable.
 *
 *         No upgradeability. No admin. No removal of signatures. Append-only
 *         is the entire contract.
 */
contract CharterRegistry {
    /// @dev signedAt[charterHash][signer] = block.timestamp of signing (0 = not signed)
    mapping(bytes32 => mapping(address => uint64)) public signedAt;

    /// @dev signaturesPerHash[charterHash] = total distinct signers for that hash
    mapping(bytes32 => uint64) public signaturesPerHash;

    error AlreadySigned(bytes32 charterHash, address signer);
    error EmptyVersion();
    error EmptyHash();

    event CharterSigned(
        address indexed signer,
        bytes32 indexed charterHash,
        uint64  timestamp,
        string  version
    );

    /**
     * @notice Sign the given charter hash. Idempotent per (signer, hash).
     * @param charterHash SHA-256 of the canonical Charter UTF-8 bytes.
     * @param version     Version string from the Charter frontmatter (e.g. "1.0").
     */
    function sign(bytes32 charterHash, string calldata version) external {
        if (charterHash == bytes32(0)) revert EmptyHash();
        if (bytes(version).length == 0) revert EmptyVersion();
        if (signedAt[charterHash][msg.sender] != 0) {
            revert AlreadySigned(charterHash, msg.sender);
        }
        uint64 ts = uint64(block.timestamp);
        signedAt[charterHash][msg.sender] = ts;
        unchecked { signaturesPerHash[charterHash] += 1; }
        emit CharterSigned(msg.sender, charterHash, ts, version);
    }

    /// @notice Convenience view — returns the timestamp at which `signer` signed `charterHash`.
    function getSignature(bytes32 charterHash, address signer)
        external
        view
        returns (uint64)
    {
        return signedAt[charterHash][signer];
    }
}
