// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CharterRegistry} from "../src/CharterRegistry.sol";

contract CharterRegistryTest is Test {
    CharterRegistry internal registry;
    address internal cto = address(0xC10);
    address internal ceo = address(0xCE0);
    bytes32 internal H1 = keccak256("charter-v1-bytes");
    bytes32 internal H2 = keccak256("charter-v1.1-bytes");

    function setUp() public {
        registry = new CharterRegistry();
    }

    event CharterSigned(address indexed signer, bytes32 indexed charterHash, uint64 timestamp, string version);

    function test_Sign_HappyPath() public {
        vm.expectEmit(true, true, false, true);
        emit CharterSigned(cto, H1, uint64(block.timestamp), "1.0");
        vm.prank(cto);
        registry.sign(H1, "1.0");

        assertEq(registry.getSignature(H1, cto), uint64(block.timestamp));
        assertEq(registry.signaturesPerHash(H1), 1);
    }

    function test_Sign_DistinctSignersAggregate() public {
        vm.prank(cto);
        registry.sign(H1, "1.0");
        vm.prank(ceo);
        registry.sign(H1, "1.0");
        assertEq(registry.signaturesPerHash(H1), 2);
    }

    function test_Sign_RevertOnDoubleSign() public {
        vm.startPrank(cto);
        registry.sign(H1, "1.0");
        vm.expectRevert(abi.encodeWithSelector(CharterRegistry.AlreadySigned.selector, H1, cto));
        registry.sign(H1, "1.0");
        vm.stopPrank();
    }

    function test_Sign_NewHashAfterAmendment() public {
        vm.startPrank(cto);
        registry.sign(H1, "1.0");
        registry.sign(H2, "1.1");        // amended Charter — different hash, OK
        vm.stopPrank();
        assertEq(registry.signaturesPerHash(H1), 1);
        assertEq(registry.signaturesPerHash(H2), 1);
    }

    function test_Sign_RevertOnEmptyHash() public {
        vm.prank(cto);
        vm.expectRevert(CharterRegistry.EmptyHash.selector);
        registry.sign(bytes32(0), "1.0");
    }

    function test_Sign_RevertOnEmptyVersion() public {
        vm.prank(cto);
        vm.expectRevert(CharterRegistry.EmptyVersion.selector);
        registry.sign(H1, "");
    }
}
