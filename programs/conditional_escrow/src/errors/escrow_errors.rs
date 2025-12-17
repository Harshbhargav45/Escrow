use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Beneficiary is not allowed to release this escrow.")]
    InvalidBeneficiary,

    #[msg("Too early to release escrow.")]
    TooEarlyToRelease,

    #[msg("Only the initializer may cancel the escrow.")]
    OnlyInitializerCanCancel,
}
