// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CacaoToken} from "../src/CacaoToken.sol";
import {MazorcaRedemption} from "../src/MazorcaRedemption.sol";

contract MazorcaRedemptionTest is Test {
    CacaoToken internal token;
    MazorcaRedemption internal redemption;

    address internal admin   = address(0xA11CE);
    uint256 internal oraclePk;
    address internal oracle;
    uint256 internal userPk;
    address internal user;

    uint256 constant RATE = 1000; // 1000 mazorcas → 1 $CACAO

    bytes32 constant BURN_TYPEHASH = keccak256(
        "MazorcaBurn(address user,uint256 mazorcaCount,bytes32 nonce,uint256 deadline)"
    );

    function setUp() public {
        oraclePk = 0xA11CEABCDEF;
        oracle   = vm.addr(oraclePk);
        userPk   = 0xB0BB0BB0B;
        user     = vm.addr(userPk);

        vm.startPrank(admin);
        token      = new CacaoToken(admin);
        redemption = new MazorcaRedemption(admin, address(token), RATE);
        token.grantRole(token.MINTER_ROLE(), address(redemption));
        redemption.grantRole(redemption.ORACLE_ROLE(), oracle);
        vm.stopPrank();
    }

    // ─── Helpers ────────────────────────────────────────────────────────

    function _signBurn(MazorcaRedemption.MazorcaBurn memory data, uint256 signerPk)
        internal
        view
        returns (bytes memory sig)
    {
        bytes32 structHash = keccak256(
            abi.encode(BURN_TYPEHASH, data.user, data.mazorcaCount, data.nonce, data.deadline)
        );
        bytes32 digest = redemption.hashBurn(data);
        // sanity — our local computation must match contract's
        assertEq(digest, _expectedDigest(structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _expectedDigest(bytes32 structHash) internal view returns (bytes32) {
        bytes32 sep = redemption.domainSeparator();
        return keccak256(abi.encodePacked(hex"1901", sep, structHash));
    }

    function _validBurn() internal view returns (MazorcaRedemption.MazorcaBurn memory) {
        return MazorcaRedemption.MazorcaBurn({
            user: user,
            mazorcaCount: 5000,
            nonce: keccak256("nonce-1"),
            deadline: block.timestamp + 1 hours
        });
    }

    // ─── Happy path ─────────────────────────────────────────────────────

    function test_Claim_HappyPath() public {
        MazorcaRedemption.MazorcaBurn memory data = _validBurn();
        bytes memory sig = _signBurn(data, oraclePk);

        vm.prank(user);
        uint256 minted = redemption.claim(data, sig);

        assertEq(minted, 5e18); // 5000 / 1000 = 5 CACAO
        assertEq(token.balanceOf(user), 5e18);
        assertTrue(redemption.consumedNonces(data.nonce));
        assertEq(redemption.lastClaimAt(user), block.timestamp);
    }

    // ─── Failure modes ──────────────────────────────────────────────────

    function test_Claim_RevertWhenCallerNotUser() public {
        MazorcaRedemption.MazorcaBurn memory data = _validBurn();
        bytes memory sig = _signBurn(data, oraclePk);

        vm.prank(address(0xDEAD));
        vm.expectRevert(
            abi.encodeWithSelector(
                MazorcaRedemption.CallerNotUser.selector,
                data.user,
                address(0xDEAD)
            )
        );
        redemption.claim(data, sig);
    }

    function test_Claim_RevertOnExpiredDeadline() public {
        MazorcaRedemption.MazorcaBurn memory data = _validBurn();
        data.deadline = block.timestamp - 1;
        bytes memory sig = _signBurn(data, oraclePk);

        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(MazorcaRedemption.DeadlineExpired.selector, data.deadline)
        );
        redemption.claim(data, sig);
    }

    function test_Claim_RevertOnReplayNonce() public {
        MazorcaRedemption.MazorcaBurn memory data = _validBurn();
        bytes memory sig = _signBurn(data, oraclePk);

        vm.prank(user);
        redemption.claim(data, sig);

        // Advance past cooldown so cooldown isn't the reason it reverts
        vm.warp(block.timestamp + 31 days);

        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(MazorcaRedemption.NonceAlreadyUsed.selector, data.nonce)
        );
        redemption.claim(data, sig);
    }

    function test_Claim_RevertOnCooldown() public {
        MazorcaRedemption.MazorcaBurn memory data = _validBurn();
        bytes memory sig = _signBurn(data, oraclePk);

        vm.prank(user);
        redemption.claim(data, sig);

        // Try a fresh nonce within cooldown
        MazorcaRedemption.MazorcaBurn memory data2 = data;
        data2.nonce = keccak256("nonce-2");
        bytes memory sig2 = _signBurn(data2, oraclePk);

        vm.prank(user);
        vm.expectRevert(); // CooldownActive
        redemption.claim(data2, sig2);
    }

    function test_Claim_RevertOnRogueSigner() public {
        uint256 rougePk = 0xDEADBEEF;
        MazorcaRedemption.MazorcaBurn memory data = _validBurn();
        bytes memory sig = _signBurn(data, rougePk);

        vm.prank(user);
        vm.expectRevert(MazorcaRedemption.InvalidSignature.selector);
        redemption.claim(data, sig);
    }

    function test_Claim_RevertOnTooFewMazorcas() public {
        MazorcaRedemption.MazorcaBurn memory data = _validBurn();
        data.mazorcaCount = 999; // below 1000 = below RATE
        bytes memory sig = _signBurn(data, oraclePk);

        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(MazorcaRedemption.MazorcaCountTooLow.selector, uint256(999))
        );
        redemption.claim(data, sig);
    }

    function test_Pause_BlocksClaim() public {
        vm.prank(admin);
        redemption.pause();

        MazorcaRedemption.MazorcaBurn memory data = _validBurn();
        bytes memory sig = _signBurn(data, oraclePk);

        vm.prank(user);
        vm.expectRevert();
        redemption.claim(data, sig);
    }

    // ─── Admin ──────────────────────────────────────────────────────────

    function test_SetMazorcasPerToken() public {
        vm.prank(admin);
        redemption.setMazorcasPerToken(500);
        assertEq(redemption.mazorcasPerToken(), 500);
    }

    function test_SetMazorcasPerToken_RevertOnZero() public {
        vm.prank(admin);
        vm.expectRevert(MazorcaRedemption.RateMustBePositive.selector);
        redemption.setMazorcasPerToken(0);
    }

    function testFuzz_Claim_AmountMatchesRate(uint64 multiples) public {
        vm.assume(multiples > 0 && multiples < 1_000_000);
        MazorcaRedemption.MazorcaBurn memory data = _validBurn();
        data.mazorcaCount = uint256(multiples) * RATE;
        data.nonce = keccak256(abi.encode(multiples));
        bytes memory sig = _signBurn(data, oraclePk);

        vm.prank(user);
        uint256 minted = redemption.claim(data, sig);
        assertEq(minted, uint256(multiples) * 1e18);
    }
}
