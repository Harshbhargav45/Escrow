use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::state::Escrow;

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.initializer.as_ref(), escrow.mint.as_ref()],
        bump = escrow.escrow_bump,
        close = initializer
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        constraint = initializer_receive_token_account.owner == initializer.key(),
        constraint = initializer_receive_token_account.mint == escrow.mint,
    )]
    pub initializer_receive_token_account: Account<'info, TokenAccount>,

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
