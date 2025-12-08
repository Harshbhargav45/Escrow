use anchor_lang::prelude::*;

#[account]
pub struct Escrow {
    pub initializer: Pubkey,
    pub beneficiary: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,

    pub amount: u64,
    pub release_time: i64,

    pub vault_bump: u8,
    pub escrow_bump: u8,
}
