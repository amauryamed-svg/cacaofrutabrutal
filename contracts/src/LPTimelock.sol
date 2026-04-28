// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title  LPTimelock
 * @notice Holds a Uniswap v3 LP position NFT for `releaseAt` seconds.
 *         Beneficiary can collect trading fees at any time, but cannot withdraw
 *         the principal NFT until the lock expires. This is the on-chain proof
 *         of CauaCorp's "no-rug" promise (Charter principle I.4).
 *
 *         Designed minimally — single position per timelock instance. Deploy
 *         one timelock per Uniswap v3 LP NFT we lock.
 *
 *         The contract supports the Uniswap v3 NonfungiblePositionManager
 *         (NPM) `decreaseLiquidity` + `collect` flow for fee collection. We
 *         deliberately DO NOT expose `decreaseLiquidity` — only `collect`,
 *         which pulls accumulated trading fees without burning principal.
 *
 *         For full lock semantics: do NOT grant any party the ability to call
 *         decreaseLiquidity on the underlying position. The NPM lets the
 *         current owner (this timelock) call it; we never expose that path.
 */
interface INonfungiblePositionManager {
    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }
    function collect(CollectParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);

    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function positions(uint256 tokenId)
        external
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );
}

contract LPTimelock is IERC721Receiver {
    address public immutable beneficiary;
    address public immutable npm;            // Uniswap v3 NonfungiblePositionManager
    uint64  public immutable releaseAt;

    uint256 public tokenId;
    bool    public released;

    error AlreadyDeposited();
    error NoPosition();
    error TooEarly(uint64 releaseAt);
    error AlreadyReleased();
    error NotBeneficiary();

    event Deposited(uint256 tokenId, address from);
    event FeesCollected(uint256 tokenId, uint256 amount0, uint256 amount1, address recipient);
    event Released(uint256 tokenId, address to, uint64 at);

    modifier onlyBeneficiary() {
        if (msg.sender != beneficiary) revert NotBeneficiary();
        _;
    }

    constructor(address beneficiary_, address npm_, uint64 releaseAt_) {
        require(beneficiary_ != address(0) && npm_ != address(0), "zero-addr");
        require(releaseAt_ > block.timestamp, "release-in-past");
        beneficiary = beneficiary_;
        npm = npm_;
        releaseAt = releaseAt_;
    }

    /**
     * @notice Receive the LP position NFT. Single-deposit per timelock.
     *         The caller (admin) transfers via `safeTransferFrom(... , timelock, tokenId)`.
     */
    function onERC721Received(address, address from, uint256 _tokenId, bytes calldata)
        external
        override
        returns (bytes4)
    {
        if (msg.sender != npm)        revert AlreadyDeposited(); // wrong contract
        if (tokenId != 0)             revert AlreadyDeposited();
        tokenId = _tokenId;
        emit Deposited(_tokenId, from);
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @notice Pull accumulated trading fees to the beneficiary. Allowed at
     *         any time during the lock — fees are not principal.
     */
    function collectFees(uint128 amount0Max, uint128 amount1Max)
        external
        onlyBeneficiary
        returns (uint256 amount0, uint256 amount1)
    {
        if (tokenId == 0) revert NoPosition();
        (amount0, amount1) = INonfungiblePositionManager(npm).collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: beneficiary,
                amount0Max: amount0Max,
                amount1Max: amount1Max
            })
        );
        emit FeesCollected(tokenId, amount0, amount1, beneficiary);
    }

    /**
     * @notice Transfer the LP NFT to the beneficiary AFTER `releaseAt`.
     *         One-shot — sets `released = true` so a redeposit is impossible.
     */
    function release() external onlyBeneficiary {
        if (released)                  revert AlreadyReleased();
        if (block.timestamp < releaseAt) revert TooEarly(releaseAt);
        if (tokenId == 0)              revert NoPosition();
        uint256 id = tokenId;
        released = true;
        INonfungiblePositionManager(npm).transferFrom(address(this), beneficiary, id);
        emit Released(id, beneficiary, uint64(block.timestamp));
    }

    /** @notice Convenience view for dashboards. */
    function timeUntilRelease() external view returns (uint64) {
        if (block.timestamp >= releaseAt) return 0;
        return releaseAt - uint64(block.timestamp);
    }
}
