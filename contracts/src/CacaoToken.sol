// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title  CacaoToken — $CACAO
 * @notice Utility token earned exclusively via gameplay (mazorca burn).
 *         Cap 21,000,000 (Bitcoin homage, not equivalence).
 *         No presale, no ICO, no founder allocation outside gameplay.
 *
 *         The ONLY minter is `MazorcaRedemption.sol`. Even the deployer cannot
 *         mint after construction — `MINTER_ROLE` is granted exclusively to the
 *         redemption contract via `grantMinterRole(redemption)` and the deployer's
 *         `DEFAULT_ADMIN_ROLE` should be transferred to a multisig.
 *
 *         See docs/CHARTER.md (principle I.3) and docs/LEGAL.md.
 */
contract CacaoToken is ERC20Capped, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /** @notice 21M tokens with 18 decimals (Bitcoin homage). */
    uint256 public constant CAP = 21_000_000 * 1e18;

    error MintExceedsCap();
    error MintByNonMinter();

    constructor(address admin)
        ERC20("Cacao", "CACAO")
        ERC20Capped(CAP)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        // Note: MINTER_ROLE is intentionally NOT granted at construction.
        //       Admin must call grantRole(MINTER_ROLE, redemptionContract) post-deploy.
    }

    function mint(address to, uint256 amount) external whenNotPaused onlyRole(MINTER_ROLE) {
        if (totalSupply() + amount > CAP) revert MintExceedsCap();
        _mint(to, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ─── Multiple-inheritance plumbing (OZ v5) ──────────────────────────

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
        whenNotPaused
    {
        super._update(from, to, value);
    }
}
