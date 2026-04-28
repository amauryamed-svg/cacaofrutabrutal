// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IoTAttestation} from "../src/IoTAttestation.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract IoTAttestationTest is Test {
    IoTAttestation internal att;
    address internal admin    = address(0xA11CE);
    address internal oracle   = address(0x0AC1E0);
    address internal stranger = address(0xC0DE);

    bytes32 internal LEAF_A = keccak256(abi.encodePacked("reading-A"));
    bytes32 internal LEAF_B = keccak256(abi.encodePacked("reading-B"));

    function setUp() public {
        vm.startPrank(admin);
        att = new IoTAttestation(admin);
        att.grantRole(att.ORACLE_ROLE(), oracle);
        vm.stopPrank();
    }

    function _twoLeafRoot(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b
            ? keccak256(abi.encodePacked(a, b))
            : keccak256(abi.encodePacked(b, a));
    }

    function _proofForA() internal view returns (bytes32[] memory proof) {
        proof = new bytes32[](1);
        proof[0] = LEAF_B;
    }

    // ─── postRoot ──────────────────────────────────────────────────

    function test_PostRoot_HappyPath() public {
        bytes32 root = _twoLeafRoot(LEAF_A, LEAF_B);
        vm.prank(oracle);
        att.postRoot(1, root, 2);

        (bytes32 stored, uint64 postedAt, uint32 leafCount) = att.getRoot(1);
        assertEq(stored, root);
        assertGt(postedAt, 0);
        assertEq(leafCount, 2);
        assertEq(att.latestWeek(), 1);
    }

    function test_PostRoot_RevertOnEmpty() public {
        vm.prank(oracle);
        vm.expectRevert(IoTAttestation.EmptyRoot.selector);
        att.postRoot(1, bytes32(0), 0);
    }

    function test_PostRoot_RevertOnDoubleWrite() public {
        bytes32 root = _twoLeafRoot(LEAF_A, LEAF_B);
        vm.startPrank(oracle);
        att.postRoot(1, root, 2);
        vm.expectRevert(abi.encodeWithSelector(IoTAttestation.WeekAlreadyPosted.selector, uint64(1)));
        att.postRoot(1, root, 2);
        vm.stopPrank();
    }

    function test_PostRoot_RevertWhenNotOracle() public {
        bytes32 root = _twoLeafRoot(LEAF_A, LEAF_B);
        bytes32 oracleRole = att.ORACLE_ROLE();
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                stranger,
                oracleRole
            )
        );
        att.postRoot(1, root, 2);
    }

    function test_PostRoot_DoesNotRegressLatestWeek() public {
        bytes32 root = _twoLeafRoot(LEAF_A, LEAF_B);
        vm.startPrank(oracle);
        att.postRoot(5, root, 2);
        att.postRoot(3, root, 2);   // older week posted out of order
        assertEq(att.latestWeek(), 5);
        vm.stopPrank();
    }

    // ─── verifyLeaf ─────────────────────────────────────────────────

    function test_VerifyLeaf_HappyPath() public {
        bytes32 root = _twoLeafRoot(LEAF_A, LEAF_B);
        vm.prank(oracle);
        att.postRoot(1, root, 2);

        bool ok = att.verifyLeaf(1, LEAF_A, _proofForA());
        assertTrue(ok);
    }

    function test_VerifyLeaf_FalseOnTamperedLeaf() public {
        bytes32 root = _twoLeafRoot(LEAF_A, LEAF_B);
        vm.prank(oracle);
        att.postRoot(1, root, 2);

        bool ok = att.verifyLeaf(1, keccak256("tampered"), _proofForA());
        assertFalse(ok);
    }

    function test_VerifyLeaf_RevertOnUnknownWeek() public {
        vm.expectRevert(abi.encodeWithSelector(IoTAttestation.NoRootForWeek.selector, uint64(99)));
        att.verifyLeaf(99, LEAF_A, _proofForA());
    }

    // ─── pause ──────────────────────────────────────────────────────

    function test_Pause_BlocksPost() public {
        vm.prank(admin);
        att.pause();

        bytes32 root = _twoLeafRoot(LEAF_A, LEAF_B);
        vm.prank(oracle);
        vm.expectRevert();
        att.postRoot(1, root, 2);
    }
}
