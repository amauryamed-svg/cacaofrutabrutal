// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CauaCreyentesCohort01} from "../src/CauaCreyentesCohort01.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract CauaCreyentesCohort01Test is Test {
    CauaCreyentesCohort01 internal nft;

    address internal admin    = address(0xA11CE);
    address internal stranger = address(0xBADD);

    string  internal constant URI_MUCILAGO = "ipfs://QmDemoMucilago/1.json";
    string  internal constant URI_BEAN     = "ipfs://QmDemoBean/1.json";

    event BelieverMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        uint8 variant,
        string tokenURI
    );

    function setUp() public {
        vm.prank(admin);
        nft = new CauaCreyentesCohort01(admin);
    }

    // ─── Mint by MINTER_ROLE ────────────────────────────────────────────

    function test_MintByMinter() public {
        address buyer = address(0x1111);

        vm.expectEmit(true, true, false, true);
        emit BelieverMinted(buyer, 1, nft.VARIANT_MUCILAGO(), URI_MUCILAGO);

        vm.prank(admin);
        uint256 tokenId = nft.mintToBeliever(buyer, URI_MUCILAGO, "mucilago");

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), buyer);
        assertEq(nft.tokenURI(1), URI_MUCILAGO);
        assertTrue(nft.hasMintedCohort01(buyer));

        (uint8 variant, uint64 mintedAt, uint8 cohort) = nft.getBelieverInfo(1);
        assertEq(variant, nft.VARIANT_MUCILAGO());
        assertGt(mintedAt, 0);
        assertEq(cohort, 1);
    }

    function test_MintByMinter_BeanVariant() public {
        address buyer = address(0x2222);

        vm.prank(admin);
        nft.mintToBeliever(buyer, URI_BEAN, "bean");

        (uint8 variant,,) = nft.getBelieverInfo(1);
        assertEq(variant, nft.VARIANT_BEAN());
    }

    function test_MintByMinter_BothVariant() public {
        address buyer = address(0x3333);

        vm.prank(admin);
        nft.mintToBeliever(buyer, URI_BEAN, "both");

        (uint8 variant,,) = nft.getBelieverInfo(1);
        assertEq(variant, nft.VARIANT_BOTH());
    }

    // ─── Access control ─────────────────────────────────────────────────

    function test_CannotMintByRandom() public {
        bytes32 minterRole = nft.MINTER_ROLE();
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                stranger,
                minterRole
            )
        );
        nft.mintToBeliever(address(0x1111), URI_MUCILAGO, "mucilago");
    }

    function test_CannotMintInvalidVariant() public {
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                CauaCreyentesCohort01.InvalidVariant.selector,
                "chocolate"
            )
        );
        nft.mintToBeliever(address(0x1111), URI_MUCILAGO, "chocolate");
    }

    function test_CannotMintTwiceSameWallet() public {
        address buyer = address(0x4444);
        vm.startPrank(admin);
        nft.mintToBeliever(buyer, URI_MUCILAGO, "mucilago");
        vm.expectRevert(
            abi.encodeWithSelector(
                CauaCreyentesCohort01.AlreadyMintedForWallet.selector,
                buyer
            )
        );
        nft.mintToBeliever(buyer, URI_BEAN, "bean");
        vm.stopPrank();
    }

    function test_CannotMintToZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(CauaCreyentesCohort01.ZeroAddressMint.selector);
        nft.mintToBeliever(address(0), URI_MUCILAGO, "mucilago");
    }

    // ─── Supply cap ─────────────────────────────────────────────────────

    function test_CannotExceedSupply() public {
        vm.startPrank(admin);
        // Mint up to MAX_SUPPLY (20).
        for (uint256 i = 0; i < 20; i++) {
            address buyer = address(uint160(0x10000 + i));
            nft.mintToBeliever(buyer, URI_MUCILAGO, "mucilago");
        }
        assertEq(nft.totalSupplyMinted(), 20);
        assertEq(nft.remainingSupply(), 0);

        // 21st mint must revert.
        vm.expectRevert(CauaCreyentesCohort01.MaxSupplyReached.selector);
        nft.mintToBeliever(address(uint160(0x20000)), URI_MUCILAGO, "mucilago");
        vm.stopPrank();
    }

    // ─── Pause ──────────────────────────────────────────────────────────

    function test_Pause_BlocksMint() public {
        vm.prank(admin);
        nft.pause();

        vm.prank(admin);
        vm.expectRevert(); // Pausable: paused
        nft.mintToBeliever(address(0x1111), URI_MUCILAGO, "mucilago");
    }

    function test_Unpause_RestoresMint() public {
        vm.startPrank(admin);
        nft.pause();
        nft.unpause();
        nft.mintToBeliever(address(0x5555), URI_MUCILAGO, "mucilago");
        vm.stopPrank();
        assertEq(nft.ownerOf(1), address(0x5555));
    }

    // ─── tokenURI / variant upgrade ─────────────────────────────────────

    function test_TokenURI_ReturnsExpected() public {
        vm.prank(admin);
        nft.mintToBeliever(address(0x6666), URI_MUCILAGO, "mucilago");
        assertEq(nft.tokenURI(1), URI_MUCILAGO);
    }

    function test_UpgradeVariant_ChangesRecord() public {
        vm.startPrank(admin);
        nft.mintToBeliever(address(0x7777), URI_MUCILAGO, "mucilago");
        nft.upgradeBelieverVariant(1, "both");
        vm.stopPrank();

        (uint8 variant,,) = nft.getBelieverInfo(1);
        assertEq(variant, nft.VARIANT_BOTH());
    }

    // ─── Interface ──────────────────────────────────────────────────────

    function test_SupportsInterface_ERC4906() public view {
        assertTrue(nft.supportsInterface(0x49064906));
    }

    function test_SupportsInterface_ERC721() public view {
        assertTrue(nft.supportsInterface(0x80ac58cd));
    }
}
