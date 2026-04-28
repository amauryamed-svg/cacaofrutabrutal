// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CacaoTreeNFT} from "../src/CacaoTreeNFT.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract CacaoTreeNFTTest is Test {
    CacaoTreeNFT internal nft;
    address internal admin   = address(0xA11CE);
    address internal user1   = address(0xB0B);
    address internal stranger = address(0xC0DE);

    bytes32 constant TREE_ID = keccak256("cacao-tree-uuid-001");
    bytes32 constant VARIETY_TRINITARIO = keccak256("Trinitario");
    bytes32 constant GPS_HASH = keccak256("2.5359,-75.5277,salt");

    event TreeMinted(
        address indexed to,
        uint256 indexed tokenId,
        bytes32 indexed treeId,
        uint8 guardianId,
        bytes32 varietyHash,
        bytes32 gpsHash
    );
    event MetadataUpdate(uint256 _tokenId);
    event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);

    function setUp() public {
        vm.prank(admin);
        nft = new CacaoTreeNFT(admin, "https://example.com/tree-metadata?tokenId=");
    }

    // ─── Mint ───────────────────────────────────────────────────────────

    function test_MintTree_HappyPath() public {
        vm.expectEmit(true, true, true, true);
        emit TreeMinted(user1, 1, TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);

        vm.prank(admin);
        uint256 tokenId = nft.mintTree(user1, TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.treeIdToToken(TREE_ID), 1);

        (bytes32 storedTreeId, uint8 guardianId,,, uint64 mintBlock) = nft.records(1);
        assertEq(storedTreeId, TREE_ID);
        assertEq(guardianId, 0);
        assertGt(mintBlock, 0);
    }

    function test_MintTree_RevertWhenNotMinter() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                stranger,
                nft.MINTER_ROLE()
            )
        );
        nft.mintTree(user1, TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);
    }

    function test_MintTree_RevertOnDoubleMint() public {
        vm.prank(admin);
        nft.mintTree(user1, TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);

        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(CacaoTreeNFT.TreeAlreadyMinted.selector, TREE_ID));
        nft.mintTree(user1, TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);
    }

    function test_MintTree_RevertOnZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(CacaoTreeNFT.ZeroAddressMint.selector);
        nft.mintTree(address(0), TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);
    }

    function test_MintTree_RevertOnInvalidGuardian() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(CacaoTreeNFT.InvalidGuardian.selector, uint8(5)));
        nft.mintTree(user1, TREE_ID, 5, VARIETY_TRINITARIO, GPS_HASH);
    }

    function testFuzz_MintTree_GuardianBounds(uint8 guardianId) public {
        vm.assume(guardianId <= 4);
        vm.prank(admin);
        nft.mintTree(user1, keccak256(abi.encode(guardianId)), guardianId, VARIETY_TRINITARIO, GPS_HASH);
    }

    // ─── Touch (ERC-4906) ───────────────────────────────────────────────

    function test_Touch_EmitsMetadataUpdate() public {
        vm.prank(admin);
        nft.mintTree(user1, TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);

        vm.expectEmit(false, false, false, true);
        emit MetadataUpdate(1);
        vm.prank(admin);
        nft.touch(1);
    }

    function test_Touch_RevertOnUnknownToken() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(CacaoTreeNFT.UnknownToken.selector, uint256(999)));
        nft.touch(999);
    }

    // ─── Pause ──────────────────────────────────────────────────────────

    function test_Pause_BlocksMint() public {
        vm.prank(admin);
        nft.pause();

        vm.prank(admin);
        vm.expectRevert(); // Pausable: paused
        nft.mintTree(user1, TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);
    }

    function test_Pause_BlocksTransfer() public {
        vm.prank(admin);
        nft.mintTree(user1, TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);

        vm.prank(admin);
        nft.pause();

        vm.prank(user1);
        vm.expectRevert();
        nft.transferFrom(user1, stranger, 1);
    }

    function test_Unpause_RestoresMint() public {
        vm.startPrank(admin);
        nft.pause();
        nft.unpause();
        nft.mintTree(user1, TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);
        vm.stopPrank();

        assertEq(nft.ownerOf(1), user1);
    }

    // ─── BaseURI ─────────────────────────────────────────────────────────

    function test_TokenURI_AppendsTokenId() public {
        vm.prank(admin);
        nft.mintTree(user1, TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);
        assertEq(nft.tokenURI(1), "https://example.com/tree-metadata?tokenId=1");
    }

    function test_SetBaseURI_EmitsBatchUpdate() public {
        vm.prank(admin);
        nft.mintTree(user1, TREE_ID, 0, VARIETY_TRINITARIO, GPS_HASH);

        vm.expectEmit(false, false, false, true);
        emit BatchMetadataUpdate(1, 1);
        vm.prank(admin);
        nft.setBaseURI("https://new.example/?tokenId=");
    }

    // ─── Interfaces ─────────────────────────────────────────────────────

    function test_SupportsInterface_ERC4906() public view {
        // ERC-4906 interface id = 0x49064906
        assertTrue(nft.supportsInterface(0x49064906));
    }

    function test_SupportsInterface_ERC721() public view {
        // ERC-721 interface id = 0x80ac58cd
        assertTrue(nft.supportsInterface(0x80ac58cd));
    }
}
