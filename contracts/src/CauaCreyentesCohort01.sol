// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title  CauaCreyentesCohort01
 * @notice ERC-721 representing membership in the **Caua Creyentes Cohorte 01 ·
 *         Lote 2025** drop. Capped supply of 20 tokens — 10 mucílago variant
 *         and 10 bean variant (the "both" variant counts as a single token
 *         that carries dual SKU access). Mint is purchase-only and triggered
 *         from the `mint-cohort-nft` Edge Function after the Stripe / Coinbase
 *         webhook flips `drop_purchases.status` to `paid`.
 *
 *         Subordinated to docs/CHARTER.md and CauaCore §10:
 *         - Charter §I.3 (distribución 100% earned) — gameplay-only emission is
 *           the default. This contract is the *narrow purchase-only exception*
 *           justified because the NFT is a **certificate of purchase**, not a
 *           founder allocation: it tracks a real-world product purchase 1:1
 *           with `drop_purchases`. No founders, no presale, no allocation.
 *         - PAUSER_ROLE is intended to sit on the 2-of-2 multisig (CTO+CEO);
 *           the constructor grants it to `admin` and the admin re-grants then
 *           renounces post-deploy (operational doc in docs/MAINNET_PREP.md).
 *         - Per-buyer uniqueness enforced via `hasMintedCohort01(address)`
 *           view (used by the Edge Function to skip duplicate mints when the
 *           same wallet buys both SKUs across two purchase rows).
 *
 *         Deployment target: Base Sepolia (chain id 84532) — Charter §I
 *         requires audit before any Base mainnet (8453) deploy.
 */
contract CauaCreyentesCohort01 is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Pausable,
    AccessControl,
    IERC4906
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Hard cap on total supply for this cohort. Cannot be raised.
    uint256 public constant MAX_SUPPLY = 20;

    /// @notice Cohort identifier — mirrored in `drop_purchases.cohort_id`.
    uint8 public constant COHORT_ID = 1;

    /// @notice Variant codes packed into a single byte so storage stays cheap.
    uint8 public constant VARIANT_MUCILAGO = 1;
    uint8 public constant VARIANT_BEAN     = 2;
    uint8 public constant VARIANT_BOTH     = 3;

    struct BelieverRecord {
        uint8  variant;     // 1=mucilago, 2=bean, 3=both
        uint64 mintedAt;    // block.timestamp
        uint8  cohort;      // always COHORT_ID for this contract
    }

    /// @notice tokenId → believer metadata.
    mapping(uint256 => BelieverRecord) private _records;

    /// @notice wallet → has already minted in this cohort (prevents double mint
    ///         across separate purchases by the same wallet).
    mapping(address => bool) public hasMintedCohort01;

    uint256 private _nextTokenId = 1;

    // ─── Errors ────────────────────────────────────────────────────────

    error MaxSupplyReached();
    error ZeroAddressMint();
    error AlreadyMintedForWallet(address recipient);
    error InvalidVariant(string variant);
    error UnknownToken(uint256 tokenId);

    // ─── Events ────────────────────────────────────────────────────────

    event BelieverMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        uint8 variant,
        string tokenURI
    );
    event BelieverVariantUpdated(uint256 indexed tokenId, uint8 newVariant);

    // ─── Constructor ───────────────────────────────────────────────────

    constructor(address admin)
        ERC721("Caua Creyente Cohort 01", "CAUA01")
    {
        if (admin == address(0)) revert ZeroAddressMint();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    // ─── Mint ──────────────────────────────────────────────────────────

    /**
     * @notice Mint a Caua Creyente NFT to `recipient` after off-chain payment
     *         verification by the Edge Function relayer.
     * @param  recipient KYC-verified buyer wallet (gating enforced server-side).
     * @param  uri Full metadata URI (typically `ipfs://...`); ERC721URIStorage
     *         stores it per-token so each cohort member can carry a distinct
     *         IPFS CID.
     * @param  variant Must be one of: "mucilago", "bean", "both".
     * @return tokenId The newly minted token id (1-indexed, capped at 20).
     */
    function mintToBeliever(
        address recipient,
        string memory uri,
        string memory variant
    )
        external
        whenNotPaused
        onlyRole(MINTER_ROLE)
        returns (uint256 tokenId)
    {
        if (recipient == address(0)) revert ZeroAddressMint();
        if (hasMintedCohort01[recipient]) revert AlreadyMintedForWallet(recipient);
        if (_nextTokenId > MAX_SUPPLY) revert MaxSupplyReached();

        uint8 variantCode = _decodeVariant(variant);

        tokenId = _nextTokenId++;
        _records[tokenId] = BelieverRecord({
            variant:  variantCode,
            mintedAt: uint64(block.timestamp),
            cohort:   COHORT_ID
        });
        hasMintedCohort01[recipient] = true;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);

        emit BelieverMinted(recipient, tokenId, variantCode, uri);
        emit MetadataUpdate(tokenId);
    }

    /**
     * @notice Update the variant of a previously minted token (e.g. upgrade
     *         from mucilago-only to both after a second purchase). The
     *         Edge Function calls this from the second webhook event.
     * @dev    `MINTER_ROLE` only. Emits ERC-4906 MetadataUpdate.
     */
    function upgradeBelieverVariant(uint256 tokenId, string memory variant)
        external
        whenNotPaused
        onlyRole(MINTER_ROLE)
    {
        if (_records[tokenId].mintedAt == 0) revert UnknownToken(tokenId);
        uint8 variantCode = _decodeVariant(variant);
        _records[tokenId].variant = variantCode;
        emit BelieverVariantUpdated(tokenId, variantCode);
        emit MetadataUpdate(tokenId);
    }

    /**
     * @notice Allow `MINTER_ROLE` to refresh the IPFS pointer on the token
     *         (e.g. when the metadata generator re-pins after image update).
     */
    function setTokenURI(uint256 tokenId, string memory uri)
        external
        onlyRole(MINTER_ROLE)
    {
        if (_records[tokenId].mintedAt == 0) revert UnknownToken(tokenId);
        _setTokenURI(tokenId, uri);
        emit MetadataUpdate(tokenId);
    }

    // ─── Views ─────────────────────────────────────────────────────────

    /**
     * @notice Returns (variantCode, mintedAt, cohortId) for a believer token.
     */
    function getBelieverInfo(uint256 tokenId)
        external
        view
        returns (uint8 variant, uint64 mintedAt, uint8 cohort)
    {
        BelieverRecord storage r = _records[tokenId];
        if (r.mintedAt == 0) revert UnknownToken(tokenId);
        return (r.variant, r.mintedAt, r.cohort);
    }

    function totalSupplyMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - (_nextTokenId - 1);
    }

    // ─── Admin ─────────────────────────────────────────────────────────

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ─── Internal ──────────────────────────────────────────────────────

    function _decodeVariant(string memory variant) internal pure returns (uint8) {
        bytes32 h = keccak256(bytes(variant));
        if (h == keccak256(bytes("mucilago"))) return VARIANT_MUCILAGO;
        if (h == keccak256(bytes("bean")))     return VARIANT_BEAN;
        if (h == keccak256(bytes("both")))     return VARIANT_BOTH;
        revert InvalidVariant(variant);
    }

    // ─── Multi-inheritance overrides (OZ v5) ───────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl, IERC165)
        returns (bool)
    {
        // ERC-4906 interface ID is defined by the spec as XOR of the two event
        // signatures (0x49064906) — marketplaces check this literal. See note
        // in CacaoTreeNFT.sol.
        return interfaceId == bytes4(0x49064906) || super.supportsInterface(interfaceId);
    }
}
