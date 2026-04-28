// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {LPTimelock, INonfungiblePositionManager} from "../src/LPTimelock.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * Mock NonfungiblePositionManager — only the methods LPTimelock calls.
 * Behaves like an ERC-721 plus a fake collect() that returns fixed amounts.
 */
contract MockNPM is ERC721 {
    uint256 public lastCollectTokenId;
    address public lastCollectRecipient;
    uint256 public collect0;
    uint256 public collect1;

    constructor() ERC721("Uni v3 LP", "UNI-V3-POS") {}

    function mintTo(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
    }

    function setNextCollect(uint256 a0, uint256 a1) external {
        collect0 = a0;
        collect1 = a1;
    }

    function collect(INonfungiblePositionManager.CollectParams calldata p)
        external
        returns (uint256, uint256)
    {
        lastCollectTokenId = p.tokenId;
        lastCollectRecipient = p.recipient;
        return (collect0, collect1);
    }
}

contract LPTimelockTest is Test {
    LPTimelock internal lock;
    MockNPM    internal npm;
    address    internal beneficiary = address(0xBABE);
    address    internal stranger    = address(0xDEAD);
    uint64     internal RELEASE_AT;
    uint256    constant TOKEN_ID = 42;

    function setUp() public {
        npm = new MockNPM();
        RELEASE_AT = uint64(block.timestamp + 365 days);
        lock = new LPTimelock(beneficiary, address(npm), RELEASE_AT);
        npm.mintTo(address(this), TOKEN_ID);
    }

    function _deposit() internal {
        npm.safeTransferFrom(address(this), address(lock), TOKEN_ID);
    }

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IERC721Receiver.onERC721Received.selector;
    }

    // ─── Deposit ──────────────────────────────────────────────────────

    function test_Deposit_HappyPath() public {
        _deposit();
        assertEq(lock.tokenId(), TOKEN_ID);
        assertEq(npm.ownerOf(TOKEN_ID), address(lock));
    }

    function test_Deposit_RevertOnSecondDeposit() public {
        _deposit();
        npm.mintTo(address(this), 99);
        vm.expectRevert(LPTimelock.AlreadyDeposited.selector);
        npm.safeTransferFrom(address(this), address(lock), 99);
    }

    function test_Deposit_RevertFromWrongContract() public {
        // A different ERC-721 tries to dump an NFT here.
        MockNPM rogueNpm = new MockNPM();
        rogueNpm.mintTo(address(this), 7);
        vm.expectRevert(LPTimelock.AlreadyDeposited.selector);
        rogueNpm.safeTransferFrom(address(this), address(lock), 7);
    }

    // ─── Collect fees ─────────────────────────────────────────────────

    function test_CollectFees_OnlyBeneficiary() public {
        _deposit();
        npm.setNextCollect(1_000_000, 2_000_000);

        vm.prank(stranger);
        vm.expectRevert(LPTimelock.NotBeneficiary.selector);
        lock.collectFees(type(uint128).max, type(uint128).max);

        vm.prank(beneficiary);
        (uint256 a, uint256 b) = lock.collectFees(type(uint128).max, type(uint128).max);
        assertEq(a, 1_000_000);
        assertEq(b, 2_000_000);
        assertEq(npm.lastCollectRecipient(), beneficiary);
    }

    function test_CollectFees_RevertWithoutPosition() public {
        vm.prank(beneficiary);
        vm.expectRevert(LPTimelock.NoPosition.selector);
        lock.collectFees(1, 1);
    }

    // ─── Release ──────────────────────────────────────────────────────

    function test_Release_RevertBeforeMaturity() public {
        _deposit();
        vm.prank(beneficiary);
        vm.expectRevert(abi.encodeWithSelector(LPTimelock.TooEarly.selector, RELEASE_AT));
        lock.release();
    }

    function test_Release_HappyPathAfterMaturity() public {
        _deposit();
        vm.warp(RELEASE_AT);

        vm.prank(beneficiary);
        lock.release();

        assertEq(npm.ownerOf(TOKEN_ID), beneficiary);
        assertTrue(lock.released());
    }

    function test_Release_RevertSecondTime() public {
        _deposit();
        vm.warp(RELEASE_AT + 1);
        vm.startPrank(beneficiary);
        lock.release();
        vm.expectRevert(LPTimelock.AlreadyReleased.selector);
        lock.release();
        vm.stopPrank();
    }

    function test_Release_RevertNotBeneficiary() public {
        _deposit();
        vm.warp(RELEASE_AT + 1);
        vm.prank(stranger);
        vm.expectRevert(LPTimelock.NotBeneficiary.selector);
        lock.release();
    }

    function test_TimeUntilRelease() public {
        assertEq(lock.timeUntilRelease(), RELEASE_AT - uint64(block.timestamp));
        vm.warp(RELEASE_AT);
        assertEq(lock.timeUntilRelease(), 0);
    }

    // ─── Constructor guards ──────────────────────────────────────────

    function test_Constructor_RevertOnZeroAddr() public {
        vm.expectRevert(bytes("zero-addr"));
        new LPTimelock(address(0), address(npm), RELEASE_AT);
    }

    function test_Constructor_RevertOnPastRelease() public {
        vm.expectRevert(bytes("release-in-past"));
        new LPTimelock(beneficiary, address(npm), uint64(block.timestamp));
    }
}
