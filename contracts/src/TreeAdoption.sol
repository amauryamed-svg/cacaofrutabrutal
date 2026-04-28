// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title  TreeAdoption
 * @notice Atomic crypto adoption: user pays in ETH or a whitelisted ERC-20
 *         (cbBTC, USDC), the contract splits revenue 60/30/10 to
 *         Guardian / Treasury / Protocol, and emits a `TreeAdopted` event.
 *         The NFT mint is decoupled: `alchemy-nft-webhook` catches the event
 *         and triggers `mint-tree-nft` server-side. This keeps KYC + rate-limit
 *         enforcement in the existing Edge Function path.
 *
 *         Charter principle I.1 — Guardian split is paid IN THE SAME TX as the
 *         buyer's payment. No tesorería-first.
 */
contract TreeAdoption is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address payable;

    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /** @notice Splits in basis points (10000 = 100%). Hardcoded — Charter requirement. */
    uint16 public constant GUARDIAN_BPS = 6000;
    uint16 public constant TREASURY_BPS = 3000;
    uint16 public constant PROTOCOL_BPS = 1000;
    uint16 public constant TOTAL_BPS    = 10000;

    address public constant ETH_PSEUDO_ADDRESS = address(0);

    /** @notice Asset price in the asset's smallest unit. address(0) = ETH (wei). */
    mapping(address => uint256) public priceByAsset;
    /** @notice Whitelist of accepted ERC-20s + ETH. */
    mapping(address => bool) public assetEnabled;
    /** @notice Guardian payout addresses. id 0..4. */
    mapping(uint8 => address) public guardianWallets;

    address public treasuryWallet;
    address public protocolWallet;

    error AssetNotEnabled(address asset);
    error PriceNotSet(address asset);
    error InsufficientPayment(uint256 sent, uint256 required);
    error GuardianWalletMissing(uint8 guardianId);
    error InvalidGuardian(uint8 guardianId);
    error InvalidWallet();
    error EthTransferFailed(address to);

    event TreeAdopted(
        address indexed buyer,
        bytes32 indexed treeId,
        uint8 guardianId,
        address indexed asset,
        uint256 amount,
        bytes32 varietyHash,
        bytes32 gpsHash
    );
    event PriceSet(address indexed asset, uint256 amount);
    event AssetEnabled(address indexed asset, bool enabled);
    event GuardianWalletSet(uint8 indexed guardianId, address wallet);
    event TreasurySet(address wallet);
    event ProtocolWalletSet(address wallet);

    constructor(address admin, address treasury_, address protocol_) {
        if (treasury_ == address(0) || protocol_ == address(0)) revert InvalidWallet();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        treasuryWallet = treasury_;
        protocolWallet = protocol_;
        emit TreasurySet(treasury_);
        emit ProtocolWalletSet(protocol_);
    }

    // ─── Adopt entrypoints ──────────────────────────────────────────────

    /**
     * @notice Adopt with native ETH. msg.value must equal the configured ETH price.
     */
    function adoptWithEth(
        bytes32 treeId,
        uint8 guardianId,
        bytes32 varietyHash,
        bytes32 gpsHash
    ) external payable whenNotPaused nonReentrant {
        if (!assetEnabled[ETH_PSEUDO_ADDRESS]) revert AssetNotEnabled(ETH_PSEUDO_ADDRESS);
        uint256 price = priceByAsset[ETH_PSEUDO_ADDRESS];
        if (price == 0) revert PriceNotSet(ETH_PSEUDO_ADDRESS);
        if (msg.value < price) revert InsufficientPayment(msg.value, price);

        _splitNative(price, guardianId);

        // Refund overpayment (small UX nicety; cheap).
        uint256 refund = msg.value - price;
        if (refund > 0) payable(msg.sender).sendValue(refund);

        emit TreeAdopted(msg.sender, treeId, guardianId, ETH_PSEUDO_ADDRESS, price, varietyHash, gpsHash);
    }

    /**
     * @notice Adopt with a whitelisted ERC-20 (USDC, cbBTC). User must pre-approve.
     */
    function adoptWithToken(
        address asset,
        bytes32 treeId,
        uint8 guardianId,
        bytes32 varietyHash,
        bytes32 gpsHash
    ) external whenNotPaused nonReentrant {
        if (!assetEnabled[asset]) revert AssetNotEnabled(asset);
        if (asset == ETH_PSEUDO_ADDRESS) revert AssetNotEnabled(asset);
        uint256 price = priceByAsset[asset];
        if (price == 0) revert PriceNotSet(asset);

        IERC20 token = IERC20(asset);
        // Pull the full price from the user.
        token.safeTransferFrom(msg.sender, address(this), price);

        _splitToken(token, price, guardianId);

        emit TreeAdopted(msg.sender, treeId, guardianId, asset, price, varietyHash, gpsHash);
    }

    // ─── Internal split logic ───────────────────────────────────────────

    function _resolveGuardian(uint8 guardianId) internal view returns (address) {
        if (guardianId > 4) revert InvalidGuardian(guardianId);
        address gw = guardianWallets[guardianId];
        if (gw == address(0)) revert GuardianWalletMissing(guardianId);
        return gw;
    }

    function _splitNative(uint256 amount, uint8 guardianId) internal {
        address gw = _resolveGuardian(guardianId);
        uint256 guardianAmt = (amount * GUARDIAN_BPS) / TOTAL_BPS;
        uint256 treasuryAmt = (amount * TREASURY_BPS) / TOTAL_BPS;
        // Protocol gets the remainder so 60+30+10 always sums to amount despite rounding.
        uint256 protocolAmt = amount - guardianAmt - treasuryAmt;

        payable(gw).sendValue(guardianAmt);
        payable(treasuryWallet).sendValue(treasuryAmt);
        payable(protocolWallet).sendValue(protocolAmt);
    }

    function _splitToken(IERC20 token, uint256 amount, uint8 guardianId) internal {
        address gw = _resolveGuardian(guardianId);
        uint256 guardianAmt = (amount * GUARDIAN_BPS) / TOTAL_BPS;
        uint256 treasuryAmt = (amount * TREASURY_BPS) / TOTAL_BPS;
        uint256 protocolAmt = amount - guardianAmt - treasuryAmt;

        token.safeTransfer(gw, guardianAmt);
        token.safeTransfer(treasuryWallet, treasuryAmt);
        token.safeTransfer(protocolWallet, protocolAmt);
    }

    // ─── Admin ──────────────────────────────────────────────────────────

    function setPrice(address asset, uint256 amount) external onlyRole(ADMIN_ROLE) {
        priceByAsset[asset] = amount;
        emit PriceSet(asset, amount);
    }

    function setAssetEnabled(address asset, bool enabled) external onlyRole(ADMIN_ROLE) {
        assetEnabled[asset] = enabled;
        emit AssetEnabled(asset, enabled);
    }

    function setGuardianWallet(uint8 guardianId, address wallet) external onlyRole(ADMIN_ROLE) {
        if (guardianId > 4) revert InvalidGuardian(guardianId);
        if (wallet == address(0)) revert InvalidWallet();
        guardianWallets[guardianId] = wallet;
        emit GuardianWalletSet(guardianId, wallet);
    }

    function setTreasury(address wallet) external onlyRole(ADMIN_ROLE) {
        if (wallet == address(0)) revert InvalidWallet();
        treasuryWallet = wallet;
        emit TreasurySet(wallet);
    }

    function setProtocolWallet(address wallet) external onlyRole(ADMIN_ROLE) {
        if (wallet == address(0)) revert InvalidWallet();
        protocolWallet = wallet;
        emit ProtocolWalletSet(wallet);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    /**
     * @notice Sweep any stuck balance — only used if a token sent directly to the contract
     *         outside the adopt flow needs recovery. Cannot be called while not paused.
     */
    function rescue(address asset, address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(paused(), "rescue: must be paused");
        if (asset == ETH_PSEUDO_ADDRESS) {
            payable(to).sendValue(amount);
        } else {
            IERC20(asset).safeTransfer(to, amount);
        }
    }

    receive() external payable {
        // Accept ETH for adopt path; reject if no active flow (caller should use adoptWithEth).
        revert("Use adoptWithEth");
    }
}
