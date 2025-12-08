use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod instructions;
pub mod contexts;

use instructions::*;

declare_id!("EsCRoW11111111111111111111111111111111111111");

#[program]
pub mod conditional_escrow {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        amount: u64,
        release_time: i64,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, amount, release_time)
    }

    pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
        instructions::release::handler(ctx)
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        instructions::cancel::handler(ctx)
    }
}
