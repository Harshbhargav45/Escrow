use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state::Escrow;

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,

    /// CHECK
    pub beneficiary: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = initializer_deposit_token_account.owner == initializer.key(),
        constraint = initializer_deposit_token_account.mint == mint.key(),
    )]
    pub initializer_deposit_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = initializer,
        token::mint = mint,
        token::authority = vault_authority,
    )]
    pub vault_account: Account<'info, TokenAccount>,

    /// CHECK
    #[account(
        seeds = [b"vault_authority", initializer.key().as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = initializer,
        space = 8 + std::mem::size_of::<Escrow>(),
        seeds = [b"escrow", initializer.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
