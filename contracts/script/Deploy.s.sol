// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CacaoTreeNFT} from "../src/CacaoTreeNFT.sol";
import {CacaoToken} from "../src/CacaoToken.sol";
import {MazorcaRedemption} from "../src/MazorcaRedemption.sol";
import {TreeAdoption} from "../src/TreeAdoption.sol";
import {IoTAttestation} from "../src/IoTAttestation.sol";
import {LPTimelock} from "../src/LPTimelock.sol";
import {CharterRegistry} from "../src/CharterRegistry.sol";

/**
 * Phased deploy script. Run once per phase to keep tx history clean and traceable.
 *
 * Required env (varies by phase):
 *   DEPLOYER_PRIVATE_KEY   — hex-prefixed key, NEVER committed
 *   METADATA_BASE_URI      — Phase 3 (NFT)
 *   MAZORCAS_PER_TOKEN     — Phase 4 (default 1000)
 *   ORACLE_ADDRESS         — Phase 4: oracle EOA used by sign-mazorca-burn
 *   RELAYER_ADDRESS        — Phase 3: relayer EOA used by mint-tree-nft
 *
 * Phased entrypoints:
 *   forge script script/Deploy.s.sol:Deploy --sig "deployNFT()" ...
 *   forge script script/Deploy.s.sol:Deploy --sig "deployTokenAndRedemption()" ...
 *
 * Post-deploy checklist (write to NOTES.md after each):
 *   1. Verify on BaseScan
 *   2. Grant MINTER_ROLE on token to redemption (deployTokenAndRedemption already does this)
 *   3. Grant ORACLE_ROLE on redemption to oracle EOA
 *   4. Grant MINTER_ROLE on NFT to relayer EOA
 *   5. Transfer DEFAULT_ADMIN_ROLE to multisig; renounce on deployer
 *   6. Update src/utils/constants.ts:WEB3_CONTRACTS
 */
contract Deploy is Script {
    /** @notice Phase 3 — deploy CacaoTreeNFT. */
    function deployNFT() external returns (CacaoTreeNFT nft) {
        uint256 pk    = vm.envUint("DEPLOYER_PRIVATE_KEY");
        string memory baseURI = vm.envString("METADATA_BASE_URI");
        address admin = vm.addr(pk);

        vm.startBroadcast(pk);
        nft = new CacaoTreeNFT(admin, baseURI);
        vm.stopBroadcast();

        console.log("CacaoTreeNFT:", address(nft));
        console.log("Admin:", admin);
        console.log("BaseURI:", baseURI);
        console.log("Next: grantRole(MINTER_ROLE, RELAYER_ADDRESS) from admin");
    }

    /** @notice Phase 4 — deploy CacaoToken + MazorcaRedemption + wire MINTER_ROLE. */
    function deployTokenAndRedemption()
        external
        returns (CacaoToken cacao, MazorcaRedemption redemption)
    {
        uint256 pk            = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 mazorcasRate  = vm.envOr("MAZORCAS_PER_TOKEN", uint256(1000));
        address admin         = vm.addr(pk);

        vm.startBroadcast(pk);
        cacao = new CacaoToken(admin);
        redemption = new MazorcaRedemption(admin, address(cacao), mazorcasRate);

        // Wire: MINTER_ROLE on token must be the redemption contract.
        cacao.grantRole(cacao.MINTER_ROLE(), address(redemption));
        vm.stopBroadcast();

        console.log("CacaoToken (CACAO):", address(cacao));
        console.log("MazorcaRedemption:", address(redemption));
        console.log("Cap:", cacao.CAP());
        console.log("MazorcasPerToken:", redemption.mazorcasPerToken());
        console.log("Next: grantRole(ORACLE_ROLE, ORACLE_ADDRESS) on redemption from admin");
    }

    /** @notice Phase 5 — deploy TreeAdoption with treasury + protocol wallets. */
    function deployTreeAdoption() external returns (TreeAdoption adoption) {
        uint256 pk           = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address treasury     = vm.envAddress("TREASURY_WALLET");
        address protocol     = vm.envAddress("PROTOCOL_WALLET");
        address admin        = vm.addr(pk);

        vm.startBroadcast(pk);
        adoption = new TreeAdoption(admin, treasury, protocol);
        vm.stopBroadcast();

        console.log("TreeAdoption:", address(adoption));
        console.log("Treasury:", treasury);
        console.log("Protocol:", protocol);
        console.log("Next: setGuardianWallet(0..4, ...) + setAssetEnabled(USDC, true) + setPrice(USDC, ...)");
    }

    /** @notice Phase 6 — deploy IoTAttestation. Grant ORACLE_ROLE post-deploy. */
    function deployIoTAttestation() external returns (IoTAttestation att) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address admin = vm.addr(pk);

        vm.startBroadcast(pk);
        att = new IoTAttestation(admin);
        vm.stopBroadcast();

        console.log("IoTAttestation:", address(att));
        console.log("Next: grantRole(ORACLE_ROLE, IOT_ORACLE_ADDRESS) from admin");
    }

    /**
     * @notice Phase 7 — deploy LPTimelock + CharterRegistry.
     *         LP NFT is transferred manually after Uniswap v3 mint (see scripts/seed_uniswap_v3.ts).
     *
     * Required env:
     *   DEPLOYER_PRIVATE_KEY
     *   LP_BENEFICIARY        — wallet that receives LP after timelock expires (treasury multisig)
     *   UNISWAP_V3_NPM        — NonfungiblePositionManager address on Base
     *   LP_RELEASE_AT         — unix ts (now + 12 months minimum per Charter I.4)
     */
    function deployLPTimelock() external returns (LPTimelock lock) {
        uint256 pk            = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address beneficiary   = vm.envAddress("LP_BENEFICIARY");
        address npm           = vm.envAddress("UNISWAP_V3_NPM");
        uint64  releaseAt     = uint64(vm.envUint("LP_RELEASE_AT"));

        require(releaseAt >= block.timestamp + 365 days, "release-must-be-12mo+");

        vm.startBroadcast(pk);
        lock = new LPTimelock(beneficiary, npm, releaseAt);
        vm.stopBroadcast();

        console.log("LPTimelock:", address(lock));
        console.log("Beneficiary:", beneficiary);
        console.log("Release at:", releaseAt);
    }

    /** @notice Phase 7 — deploy CharterRegistry (no constructor args). */
    function deployCharterRegistry() external returns (CharterRegistry reg) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);
        reg = new CharterRegistry();
        vm.stopBroadcast();
        console.log("CharterRegistry:", address(reg));
    }

    /** @notice Backwards-compatible default — Phase 3 deploy. */
    function run() external returns (CacaoTreeNFT nft) {
        return this.deployNFT();
    }
}
