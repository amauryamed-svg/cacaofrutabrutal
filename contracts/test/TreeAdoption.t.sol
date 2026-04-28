// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TreeAdoption} from "../src/TreeAdoption.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("Test", "TST") {
        _mint(msg.sender, 10_000_000e18);
    }
    function mintTo(address to, uint256 amt) external { _mint(to, amt); }
}

contract TreeAdoptionTest is Test {
    TreeAdoption internal adoption;
    TestERC20    internal usdc;

    address internal admin    = address(0xA11CE);
    address internal treasury = address(0xCABA);
    address internal protocol = address(0xCAFE);
    address internal guardian = address(0x691A);
    address internal buyer    = address(0xB0B);

    bytes32 constant TREE_ID = keccak256("tree-1");
    bytes32 constant VARIETY = keccak256("Trinitario");
    bytes32 constant GPS     = keccak256("hidden-gps-hash");

    uint256 constant ETH_PRICE  = 0.01 ether;
    uint256 constant USDC_PRICE = 50e18; // pretend 6 decimals if real USDC; this test uses 18

    function setUp() public {
        vm.startPrank(admin);
        adoption = new TreeAdoption(admin, treasury, protocol);
        usdc = new TestERC20();

        adoption.setGuardianWallet(0, guardian);

        adoption.setAssetEnabled(address(0), true);
        adoption.setPrice(address(0), ETH_PRICE);

        adoption.setAssetEnabled(address(usdc), true);
        adoption.setPrice(address(usdc), USDC_PRICE);
        vm.stopPrank();

        vm.deal(buyer, 1 ether);
        usdc.mintTo(buyer, 1_000e18);
    }

    // ─── ETH adopt ────────────────────────────────────────────────────

    function test_AdoptWithEth_HappyPath() public {
        vm.prank(buyer);
        adoption.adoptWithEth{value: ETH_PRICE}(TREE_ID, 0, VARIETY, GPS);

        assertEq(guardian.balance, (ETH_PRICE * 6000) / 10000);
        assertEq(treasury.balance, (ETH_PRICE * 3000) / 10000);
        assertEq(protocol.balance, ETH_PRICE - guardian.balance - treasury.balance);
    }

    function test_AdoptWithEth_RefundsOverpayment() public {
        uint256 sent = ETH_PRICE + 0.005 ether;
        uint256 buyerBefore = buyer.balance;

        vm.prank(buyer);
        adoption.adoptWithEth{value: sent}(TREE_ID, 0, VARIETY, GPS);

        // Buyer should be back to (before - ETH_PRICE).
        assertEq(buyer.balance, buyerBefore - ETH_PRICE);
    }

    function test_AdoptWithEth_RevertsOnUnderpayment() public {
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(TreeAdoption.InsufficientPayment.selector, ETH_PRICE - 1, ETH_PRICE)
        );
        adoption.adoptWithEth{value: ETH_PRICE - 1}(TREE_ID, 0, VARIETY, GPS);
    }

    function test_AdoptWithEth_RevertsOnDisabledAsset() public {
        vm.prank(admin);
        adoption.setAssetEnabled(address(0), false);

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(TreeAdoption.AssetNotEnabled.selector, address(0)));
        adoption.adoptWithEth{value: ETH_PRICE}(TREE_ID, 0, VARIETY, GPS);
    }

    function test_AdoptWithEth_RevertsOnMissingGuardian() public {
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(TreeAdoption.GuardianWalletMissing.selector, uint8(2)));
        adoption.adoptWithEth{value: ETH_PRICE}(TREE_ID, 2, VARIETY, GPS);
    }

    function test_AdoptWithEth_RevertsOnInvalidGuardian() public {
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(TreeAdoption.InvalidGuardian.selector, uint8(5)));
        adoption.adoptWithEth{value: ETH_PRICE}(TREE_ID, 5, VARIETY, GPS);
    }

    // ─── ERC-20 adopt ─────────────────────────────────────────────────

    function test_AdoptWithToken_HappyPath() public {
        vm.startPrank(buyer);
        usdc.approve(address(adoption), USDC_PRICE);
        adoption.adoptWithToken(address(usdc), TREE_ID, 0, VARIETY, GPS);
        vm.stopPrank();

        assertEq(usdc.balanceOf(guardian), (USDC_PRICE * 6000) / 10000);
        assertEq(usdc.balanceOf(treasury), (USDC_PRICE * 3000) / 10000);
        assertEq(usdc.balanceOf(protocol), USDC_PRICE - usdc.balanceOf(guardian) - usdc.balanceOf(treasury));
    }

    function test_AdoptWithToken_RevertsOnETHPseudoAddress() public {
        // Even if address(0) is enabled for ETH, adoptWithToken must reject it.
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(TreeAdoption.AssetNotEnabled.selector, address(0)));
        adoption.adoptWithToken(address(0), TREE_ID, 0, VARIETY, GPS);
    }

    function test_AdoptWithToken_RevertsOnDisabledToken() public {
        TestERC20 other = new TestERC20();
        other.mintTo(buyer, 1_000e18);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(TreeAdoption.AssetNotEnabled.selector, address(other)));
        adoption.adoptWithToken(address(other), TREE_ID, 0, VARIETY, GPS);
    }

    // ─── Pause ─────────────────────────────────────────────────────────

    function test_Pause_BlocksEthAdopt() public {
        vm.prank(admin);
        adoption.pause();

        vm.prank(buyer);
        vm.expectRevert();
        adoption.adoptWithEth{value: ETH_PRICE}(TREE_ID, 0, VARIETY, GPS);
    }

    function test_Pause_BlocksTokenAdopt() public {
        vm.prank(admin);
        adoption.pause();

        vm.startPrank(buyer);
        usdc.approve(address(adoption), USDC_PRICE);
        vm.expectRevert();
        adoption.adoptWithToken(address(usdc), TREE_ID, 0, VARIETY, GPS);
        vm.stopPrank();
    }

    // ─── Fuzz: split conservation ─────────────────────────────────────

    function testFuzz_SplitConservation(uint96 amount) public {
        vm.assume(amount > 1000);
        vm.prank(admin);
        adoption.setPrice(address(usdc), amount);

        usdc.mintTo(buyer, amount);
        vm.startPrank(buyer);
        usdc.approve(address(adoption), amount);
        adoption.adoptWithToken(address(usdc), TREE_ID, 0, VARIETY, GPS);
        vm.stopPrank();

        uint256 totalReceived = usdc.balanceOf(guardian) + usdc.balanceOf(treasury) + usdc.balanceOf(protocol);
        assertEq(totalReceived, amount);
    }

    // ─── Receive guard ────────────────────────────────────────────────

    function test_DirectETHTransfer_Reverts() public {
        vm.prank(buyer);
        (bool ok, ) = address(adoption).call{value: 1 ether}("");
        assertFalse(ok);
    }
}
