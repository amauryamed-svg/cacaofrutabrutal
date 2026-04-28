// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface ICacaoTokenMintable {
    function mint(address to, uint256 amount) external;
}

/**
 * @title  MazorcaRedemption
 * @notice Verifies an EIP-712 signed off-chain "mazorca burn" intent and mints
 *         $CACAO at the configured rate. The signing oracle is a server-side EOA
 *         (`sign-mazorca-burn` Edge Function) whose private key is held in
 *         Supabase Edge Function env. The contract trusts only signatures from
 *         that oracle.
 *
 *         On-chain enforcement (defense in depth):
 *           - single-use nonce per signature
 *           - deadline check
 *           - per-user 30-day cooldown
 *           - paused = no claims
 *
 *         Off-chain enforcement (in `sign-mazorca-burn`):
 *           - decrement `user_profiles.mazorcas_balance` BEFORE signing
 *           - cap 1 redemption / user / 30 days
 *           - KYC tier ≥ 1 + wallet linked + not geo-blocked
 *
 *         See docs/WEB3.md (Phase 4) and docs/CHARTER.md (principle I.3).
 */
contract MazorcaRedemption is EIP712, AccessControl, Pausable {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");

    bytes32 public constant BURN_TYPEHASH = keccak256(
        "MazorcaBurn(address user,uint256 mazorcaCount,bytes32 nonce,uint256 deadline)"
    );

    uint256 public constant USER_COOLDOWN_SECONDS = 30 days;

    ICacaoTokenMintable public immutable token;
    uint256 public mazorcasPerToken;

    mapping(bytes32 => bool) public consumedNonces;
    mapping(address => uint256) public lastClaimAt;

    struct MazorcaBurn {
        address user;
        uint256 mazorcaCount;
        bytes32 nonce;
        uint256 deadline;
    }

    error InvalidSignature();
    error NonceAlreadyUsed(bytes32 nonce);
    error DeadlineExpired(uint256 deadline);
    error CooldownActive(uint256 nextAllowedAt);
    error CallerNotUser(address user, address sender);
    error MazorcaCountTooLow(uint256 count);
    error RateMustBePositive();

    event Claimed(
        address indexed user,
        uint256 mazorcaCount,
        uint256 cacaoMinted,
        bytes32 indexed nonce
    );
    event RateUpdated(uint256 newMazorcasPerToken);

    constructor(address admin, address tokenAddress, uint256 initialRate)
        EIP712("CauaMazorcaRedemption", "1")
    {
        if (initialRate == 0) revert RateMustBePositive();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        // ORACLE_ROLE is intentionally NOT granted here — admin must call
        // grantRole(ORACLE_ROLE, oracleEOA) after deploy.

        token = ICacaoTokenMintable(tokenAddress);
        mazorcasPerToken = initialRate;
    }

    /**
     * @notice Burn `data.mazorcaCount` off-chain mazorcas (already decremented
     *         by the server) and mint the equivalent amount of $CACAO to `data.user`.
     *
     * @dev    `signature` must be EIP-712 signed by an account with ORACLE_ROLE.
     */
    function claim(MazorcaBurn calldata data, bytes calldata signature)
        external
        whenNotPaused
        returns (uint256 cacaoMinted)
    {
        if (msg.sender != data.user) revert CallerNotUser(data.user, msg.sender);
        if (data.deadline < block.timestamp) revert DeadlineExpired(data.deadline);
        if (consumedNonces[data.nonce]) revert NonceAlreadyUsed(data.nonce);
        if (data.mazorcaCount < mazorcasPerToken) revert MazorcaCountTooLow(data.mazorcaCount);

        uint256 nextAllowed = lastClaimAt[data.user] + USER_COOLDOWN_SECONDS;
        if (lastClaimAt[data.user] != 0 && block.timestamp < nextAllowed) {
            revert CooldownActive(nextAllowed);
        }

        bytes32 structHash = keccak256(
            abi.encode(BURN_TYPEHASH, data.user, data.mazorcaCount, data.nonce, data.deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);
        if (!hasRole(ORACLE_ROLE, recovered)) revert InvalidSignature();

        consumedNonces[data.nonce] = true;
        lastClaimAt[data.user] = block.timestamp;

        // Integer math — fractional $CACAO is impossible by design.
        // Server enforces `mazorcaCount % mazorcasPerToken == 0` to avoid wasted dust.
        cacaoMinted = (data.mazorcaCount / mazorcasPerToken) * 1e18;
        token.mint(data.user, cacaoMinted);

        emit Claimed(data.user, data.mazorcaCount, cacaoMinted, data.nonce);
    }

    // ─── Admin ──────────────────────────────────────────────────────────

    function setMazorcasPerToken(uint256 newRate) external onlyRole(ADMIN_ROLE) {
        if (newRate == 0) revert RateMustBePositive();
        mazorcasPerToken = newRate;
        emit RateUpdated(newRate);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ─── Views ─────────────────────────────────────────────────────────

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function hashBurn(MazorcaBurn calldata data) external view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(BURN_TYPEHASH, data.user, data.mazorcaCount, data.nonce, data.deadline)
        );
        return _hashTypedDataV4(structHash);
    }
}
