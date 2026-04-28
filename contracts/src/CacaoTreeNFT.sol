// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title  CacaoTreeNFT
 * @notice ERC-721 representation of a physical cacao tree adopted on CauaCorp.
 *         Each tokenId binds an off-chain Supabase tree UUID to an on-chain owner,
 *         a Guardian (cultivator), a variety hash, and a GPS hash. The metadata
 *         lives off-chain (dynamic tokenURI served by Supabase Edge Function);
 *         birth-cert (immutable) is pinned to IPFS and referenced from the JSON.
 *
 *         Subordinated to docs/CHARTER.md and CauaCore §10. Mint is gated to the
 *         relayer (`MINTER_ROLE`) which the server controls — users never pay gas;
 *         the Edge Function caps mints/user/24h to prevent Paymaster drain.
 *
 *         Care actions emit ERC-4906 `MetadataUpdate` so OpenSea/Zora invalidate
 *         their metadata caches.
 */
contract CacaoTreeNFT is ERC721, Pausable, AccessControl, IERC4906 {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct TreeRecord {
        bytes32 treeId;        // Supabase cacao_trees.id (UUID hashed)
        uint8   guardianId;    // 0..4
        bytes32 varietyHash;   // keccak256("Criollo" | "Trinitario" | ...)
        bytes32 gpsHash;       // keccak256(lat || lng || guardian_salt)
        uint64  mintBlock;
    }

    string  private _baseTokenURI;
    uint256 private _nextTokenId = 1;

    mapping(bytes32 => uint256) public treeIdToToken;
    mapping(uint256 => TreeRecord) public records;

    error TreeAlreadyMinted(bytes32 treeId);
    error UnknownToken(uint256 tokenId);
    error InvalidGuardian(uint8 guardianId);
    error ZeroAddressMint();

    event TreeMinted(
        address indexed to,
        uint256 indexed tokenId,
        bytes32 indexed treeId,
        uint8 guardianId,
        bytes32 varietyHash,
        bytes32 gpsHash
    );
    event BaseURIUpdated(string newBase);

    constructor(address admin, string memory baseURI_) ERC721("Cacao Tree", "CTREE") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _baseTokenURI = baseURI_;
    }

    // ─── External / mint ────────────────────────────────────────────────

    /**
     * @notice Mint a tree NFT to `to`. Idempotent on `treeId` (revert if already minted).
     * @dev    Only callable by `MINTER_ROLE` (the Edge Function relayer).
     *         Reverts if `to` is zero, `guardianId` > 4, or `treeId` already minted.
     */
    function mintTree(
        address to,
        bytes32 treeId,
        uint8 guardianId,
        bytes32 varietyHash,
        bytes32 gpsHash
    ) external whenNotPaused onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        if (to == address(0)) revert ZeroAddressMint();
        if (guardianId > 4) revert InvalidGuardian(guardianId);
        if (treeIdToToken[treeId] != 0) revert TreeAlreadyMinted(treeId);

        tokenId = _nextTokenId++;
        treeIdToToken[treeId] = tokenId;
        records[tokenId] = TreeRecord({
            treeId: treeId,
            guardianId: guardianId,
            varietyHash: varietyHash,
            gpsHash: gpsHash,
            mintBlock: uint64(block.number)
        });

        _safeMint(to, tokenId);
        emit TreeMinted(to, tokenId, treeId, guardianId, varietyHash, gpsHash);
    }

    /**
     * @notice Emitted by the relayer whenever a care action mutates off-chain state.
     *         OpenSea/Zora listen to ERC-4906 `MetadataUpdate` to refresh metadata.
     * @dev    Only callable by `MINTER_ROLE` (server-side). No on-chain state mutates.
     */
    function touch(uint256 tokenId) external onlyRole(MINTER_ROLE) {
        if (records[tokenId].treeId == bytes32(0)) revert UnknownToken(tokenId);
        emit MetadataUpdate(tokenId);
    }

    // ─── Admin ─────────────────────────────────────────────────────────

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function setBaseURI(string calldata newBase) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBase;
        emit BaseURIUpdated(newBase);
        emit BatchMetadataUpdate(1, _nextTokenId - 1);
    }

    // ─── Views ─────────────────────────────────────────────────────────

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // ─── Hooks ─────────────────────────────────────────────────────────

    /**
     * @dev OZ v5 routes mint/transfer/burn through `_update`. Pausable applies here.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    // ─── Interface ─────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl, IERC165)
        returns (bool)
    {
        // ERC-4906 interface ID is defined by the spec as XOR of the two event sigs
        // (Solidity's `type(IERC4906).interfaceId` only XORs function selectors, so it
        // returns the wrong value here — marketplaces check 0x49064906 literally).
        return interfaceId == bytes4(0x49064906) || super.supportsInterface(interfaceId);
    }
}
