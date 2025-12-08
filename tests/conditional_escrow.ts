const anchor = require("@coral-xyz/anchor");
const {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} = require("@solana/spl-token");

const { SystemProgram, LAMPORTS_PER_SOL } = anchor.web3;

describe("conditional_escrow", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.ConditionalEscrow;

  let mint = null;
  let initializer = provider.wallet;
  let beneficiary = anchor.web3.Keypair.generate();

  let initializerTokenAccount = null;
  let beneficiaryTokenAccount = null;

  let escrowPda = null;
  let vaultAuthorityPda = null;
  let vaultTokenAccount = null;

  const amount = 100;

  it("Airdrop SOL to beneficiary", async () => {
    const sig = await provider.connection.requestAirdrop(
      beneficiary.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);
  });

  it("Create mint + token accounts", async () => {
    mint = await createMint(
      provider.connection,
      initializer.payer,
      initializer.publicKey,
      null,
      0 // decimals
    );

    initializerTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      initializer.payer,
      mint,
      initializer.publicKey
    );

    beneficiaryTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      initializer.payer,
      mint,
      beneficiary.publicKey
    );

    // Mint tokens to initializer
    await mintTo(
      provider.connection,
      initializer.payer,
      mint,
      initializerTokenAccount.address,
      initializer.publicKey,
      amount
    );

    const accInfo = await getAccount(provider.connection, initializerTokenAccount.address);
    console.log("Initializer token balance:", accInfo.amount);
  });

  it("Initialize escrow", async () => {
    const [vaultAuth] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_authority"),
        initializer.publicKey.toBuffer(),
        mint.toBuffer()
      ],
      program.programId
    );

    vaultAuthorityPda = vaultAuth;

    const [escrowAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        initializer.publicKey.toBuffer(),
        mint.toBuffer()
      ],
      program.programId
    );

    escrowPda = escrowAccount;

    // Derive vault token account PDA
    vaultTokenAccount = anchor.web3.Keypair.generate();

    const releaseTime = Math.floor(Date.now() / 1000) + 2; // release after 2 seconds

    await program.methods
      .initializeEscrow(new anchor.BN(amount), new anchor.BN(releaseTime))
      .accounts({
        initializer: initializer.publicKey,
        beneficiary: beneficiary.publicKey,
        initializerDepositTokenAccount: initializerTokenAccount.address,
        vaultAccount: vaultTokenAccount.publicKey,
        vaultAuthority: vaultAuthorityPda,
        escrow: escrowPda,
        mint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([vaultTokenAccount])
      .rpc();

    console.log("Escrow initialized:", escrowPda.toBase58());
  });

  it("Wait for release time", async () => {
    console.log("Waiting for 3 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  it("Release escrow", async () => {
    await program.methods
      .releaseEscrow()
      .accounts({
        beneficiary: beneficiary.publicKey,
        beneficiaryReceiveTokenAccount: beneficiaryTokenAccount.address,
        escrow: escrowPda,
        initializer: initializer.publicKey,
        vaultAccount: vaultTokenAccount.publicKey,
        vaultAuthority: vaultAuthorityPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([beneficiary])
      .rpc();

    console.log("Escrow released!");
  });

  it("Check token balance", async () => {
    const beneficiaryAcc = await getAccount(
      provider.connection,
      beneficiaryTokenAccount.address
    );

    console.log("Beneficiary final token balance:", beneficiaryAcc.amount);

    if (Number(beneficiaryAcc.amount) !== amount) {
      throw new Error("Tokens not transferred properly!");
    }
  });
});
