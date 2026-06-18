// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {FondoCaua}        from "../src/FondoCaua.sol";

/**
 * Deploy FondoCaua to Base Sepolia (testnet) or Base mainnet.
 *
 * Usage — Base Sepolia:
 *   forge script script/DeployFondoCaua.s.sol \
 *     --rpc-url base_sepolia \
 *     --broadcast \
 *     --verify
 *
 * Required env vars (.env.local, never committed):
 *   DEPLOYER_PRIVATE_KEY=0x...
 *   TREASURY_ADDRESS=0x...   (multisig or dev wallet for testnet)
 *   BASESCAN_API_KEY=...
 *
 * After deploy: copy the printed contract address into
 *   src/utils/constants.ts → WEB3_CONTRACTS.fondoCaua
 */
contract DeployFondoCaua is Script {
    // Base Sepolia USDC (Circle official)
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    // Base mainnet USDC
    address constant USDC_BASE_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external {
        address treasury    = vm.envAddress("TREASURY_ADDRESS");
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        bool    isMainnet   = block.chainid == 8453;

        address usdc = isMainnet ? USDC_BASE_MAINNET : USDC_BASE_SEPOLIA;

        vm.startBroadcast(deployerKey);

        address[] memory tokens = new address[](1);
        tokens[0] = usdc;

        FondoCaua fondo = new FondoCaua(treasury, tokens);

        vm.stopBroadcast();

        console2.log("=== FondoCaua deployed ===");
        console2.log("Address  :", address(fondo));
        console2.log("Chain    :", block.chainid);
        console2.log("Treasury :", treasury);
        console2.log("USDC     :", usdc);
        console2.log("TECH_BPS :", fondo.TECH_BPS());
        console2.log("LOTS_BPS :", fondo.LOTS_BPS());
        console2.log("RD_BPS   :", fondo.RD_BPS());
        console2.log("");
        console2.log("Next step: update src/utils/constants.ts");
        console2.log("  fondoCaua: '", address(fondo), "'");
    }
}
