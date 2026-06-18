// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20}          from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20}       from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable}        from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  FondoCaua
 * @notice On-chain treasury for the Caúa Fund — technologies, lots, and R&D.
 *         Contributors send ETH or whitelisted ERC-20s; funds route atomically
 *         to the treasury multisig. Allocation (TECH/LOTS/RD BPS) is an
 *         immutable on-chain commitment to transparency; actual disbursement
 *         is controlled by the 2-of-2 multisig per Charter §III.
 *
 *         CauaCore §10: Pausable, Ownable2Step (no single-step ownership
 *         transfer), ReentrancyGuard. No private keys in client bundle.
 *         Subordinated to docs/CHARTER.md.
 */
contract FondoCaua is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Allocation — display commitment (basis points, 10 000 = 100 %) ───────
    uint16 public constant TECH_BPS = 4000; // 40 % Tecnologías (liofilización, NIBS process)
    uint16 public constant LOTS_BPS = 4000; // 40 % Lotes (fincas guardianas, cosechas)
    uint16 public constant RD_BPS   = 2000; // 20 % R&D (Novel Food EU, bioactivos, NIBS)

    // ─── Sentinel for ETH in asset mappings ───────────────────────────────────
    address public constant ETH_ASSET = address(0);

    // ─── Treasury multisig ────────────────────────────────────────────────────
    address public treasury;

    // ─── Accounting ───────────────────────────────────────────────────────────
    /// @notice Lifetime total contributed per asset. ETH = address(0).
    mapping(address => uint256) public totalRaised;

    /// @notice ETH contributed per address (wei).
    mapping(address => uint256) public ethContributed;

    /// @notice ERC-20 contributed per address per token.
    mapping(address => mapping(address => uint256)) public tokenContributed;

    /// @notice Whitelisted ERC-20 assets accepted as contributions.
    mapping(address => bool) public tokenEnabled;

    // ─── Events ───────────────────────────────────────────────────────────────
    event Contributed(
        address indexed contributor,
        address indexed asset,
        uint256 amount,
        uint256 timestamp
    );
    event TokenEnabled(address indexed token, bool enabled);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error ZeroAmount();
    error ZeroAddress();
    error TokenNotEnabled(address token);
    error ETHTransferFailed();

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address treasury_, address[] memory initialTokens)
        Ownable(msg.sender)
    {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        for (uint256 i; i < initialTokens.length; ++i) {
            tokenEnabled[initialTokens[i]] = true;
            emit TokenEnabled(initialTokens[i], true);
        }
    }

    // ─── ETH contribution ─────────────────────────────────────────────────────
    /**
     * @notice Contribute ETH. Routed atomically to treasury in same tx.
     */
    function contributeETH() external payable whenNotPaused nonReentrant {
        if (msg.value == 0) revert ZeroAmount();

        totalRaised[ETH_ASSET]         += msg.value;
        ethContributed[msg.sender]     += msg.value;

        (bool ok,) = treasury.call{value: msg.value}("");
        if (!ok) revert ETHTransferFailed();

        emit Contributed(msg.sender, ETH_ASSET, msg.value, block.timestamp);
    }

    // ─── ERC-20 contribution ──────────────────────────────────────────────────
    /**
     * @notice Contribute a whitelisted ERC-20 (e.g. USDC). Caller must have
     *         approved this contract for `amount` beforehand.
     */
    function contributeToken(address token, uint256 amount)
        external
        whenNotPaused
        nonReentrant
    {
        if (!tokenEnabled[token]) revert TokenNotEnabled(token);
        if (amount == 0) revert ZeroAmount();

        totalRaised[token]                              += amount;
        tokenContributed[msg.sender][token]             += amount;

        IERC20(token).safeTransferFrom(msg.sender, treasury, amount);

        emit Contributed(msg.sender, token, amount, block.timestamp);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────
    function setTokenEnabled(address token, bool enabled) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        tokenEnabled[token] = enabled;
        emit TokenEnabled(token, enabled);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Safety fallback ──────────────────────────────────────────────────────
    receive() external payable { revert("use contributeETH()"); }
}
