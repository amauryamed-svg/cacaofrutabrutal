// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CacaoToken} from "../src/CacaoToken.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract CacaoTokenTest is Test {
    CacaoToken internal token;
    address internal admin    = address(0xA11CE);
    address internal redeemer = address(0xBABE);
    address internal user     = address(0xB0B);

    function setUp() public {
        vm.startPrank(admin);
        token = new CacaoToken(admin);
        // Cache the role first — calling `token.MINTER_ROLE()` inline as an arg would
        // consume the prank before the grantRole call lands.
        bytes32 minterRole = token.MINTER_ROLE();
        token.grantRole(minterRole, redeemer);
        vm.stopPrank();
    }

    function test_Cap_Is21M() public view {
        assertEq(token.cap(), 21_000_000 * 1e18);
    }

    function test_Constructor_DoesNotGrantMinterToAdmin() public view {
        assertFalse(token.hasRole(token.MINTER_ROLE(), admin));
    }

    function test_Mint_OnlyMinter() public {
        vm.prank(redeemer);
        token.mint(user, 1e18);
        assertEq(token.balanceOf(user), 1e18);

        bytes32 minterRole = token.MINTER_ROLE();
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                admin,
                minterRole
            )
        );
        token.mint(user, 1e18);
    }

    function test_Mint_RevertsAtCap() public {
        uint256 cap = token.CAP();
        vm.prank(redeemer);
        token.mint(user, cap);

        vm.prank(redeemer);
        vm.expectRevert(); // CapExceeded from ERC20Capped
        token.mint(user, 1);
    }

    function testFuzz_Mint_StaysWithinCap(uint128 amount) public {
        uint256 cap = token.CAP();
        vm.assume(amount > 0 && uint256(amount) <= cap);
        vm.prank(redeemer);
        token.mint(user, amount);
        assertLe(token.totalSupply(), cap);
    }

    function test_Pause_BlocksMint() public {
        vm.prank(admin);
        token.pause();
        vm.prank(redeemer);
        vm.expectRevert();
        token.mint(user, 1e18);
    }

    function test_Pause_BlocksTransfer() public {
        vm.prank(redeemer);
        token.mint(user, 100e18);

        vm.prank(admin);
        token.pause();

        vm.prank(user);
        vm.expectRevert();
        token.transfer(redeemer, 1e18);
    }

    function test_Burnable() public {
        vm.prank(redeemer);
        token.mint(user, 100e18);

        vm.prank(user);
        token.burn(40e18);

        assertEq(token.balanceOf(user), 60e18);
        assertEq(token.totalSupply(), 60e18);
    }
}
