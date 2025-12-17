use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::state::Escrow;

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut)]
    pub beneficiary: Signer<'info>,

    #[account(
        mut,
        constraint = beneficiary_receive_token_account.owner == beneficiary.key(),
        constraint = beneficiary_receive_token_account.mint == escrow.mint,
    )]
    pub beneficiary_receive_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.initializer.as_ref(), escrow.mint.as_ref()],
        bump = escrow.escrow_bump,
        close = initializer
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub initializer: SystemAccount<'info>,

    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,

    /// CHECK
    #[account(
        seeds = [b"vault_authority", escrow.initializer.as_ref(), escrow.mint.as_ref()],
        bump = escrow.vault_bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}
