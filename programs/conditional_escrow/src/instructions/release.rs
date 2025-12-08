use anchor_lang::prelude::*;
use anchor_spl::token::{Transfer, CloseAccount, Token};

use crate::{
    contexts::ReleaseEscrow,
    errors::EscrowError,
    state::Escrow,
};

pub fn handler(ctx: Context<ReleaseEscrow>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;

    if ctx.accounts.beneficiary.key() != escrow.beneficiary {
        return Err(EscrowError::InvalidBeneficiary.into());
    }

    if escrow.release_time > 0 {
        let now = Clock::get()?.unix_timestamp;
        if now < escrow.release_time {
            return Err(EscrowError::TooEarlyToRelease.into());
        }
    }

    let seeds: &[&[u8]] = &[
        b"vault_authority",
        escrow.initializer.as_ref(),
        escrow.mint.as_ref(),
        &[escrow.vault_bump],
    ];
    let signer = &[&seeds[..]];

    let transfer = Transfer {
        from: ctx.accounts.vault_account.to_account_info(),
        to: ctx
            .accounts
            .beneficiary_receive_token_account
            .to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };

    let transfer_ctx =
        CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), transfer, signer);

    anchor_spl::token::transfer(transfer_ctx, escrow.amount)?;

    let close = CloseAccount {
        account: ctx.accounts.vault_account.to_account_info(),
        destination: ctx.accounts.initializer.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };

    let close_ctx =
        CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), close, signer);

    anchor_spl::token::close_account(close_ctx)?;
    Ok(())
}
