use anchor_lang::prelude::*;
use anchor_spl::token::{Transfer, Token};

use crate::{
    ix_contexts::InitializeEscrow,
    state::Escrow,
};

pub fn handler(
    ctx: Context<InitializeEscrow>,
    amount: u64,
    release_time: i64,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;

    escrow.initializer = ctx.accounts.initializer.key();
    escrow.beneficiary = ctx.accounts.beneficiary.key();
    escrow.mint = ctx.accounts.mint.key();
    escrow.vault = ctx.accounts.vault_account.key();
    escrow.amount = amount;
    escrow.release_time = release_time;
   escrow.vault_bump  = ctx.bumps.vault_authority;
    escrow.escrow_bump = ctx.bumps.escrow;


    let accounts = Transfer {
        from: ctx
            .accounts
            .initializer_deposit_token_account
            .to_account_info(),
        to: ctx.accounts.vault_account.to_account_info(),
        authority: ctx.accounts.initializer.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), accounts);
    anchor_spl::token::transfer(cpi_ctx, amount)?;

    Ok(())
}
