import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createApproveInstruction,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("conditional_escrow (classic)", () => {
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 120_000,
    }
  );

  const provider = new anchor.AnchorProvider(
    connection,
    anchor.Wallet.local(),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.ConditionalEscrow as Program<any>;
  const wallet = provider.wallet as anchor.Wallet;

  let mint: anchor.web3.PublicKey | undefined;
  let initializerTokenAccount: any;
  let beneficiaryTokenAccount: any;

  const beneficiary = anchor.web3.Keypair.generate();

  let escrowPda: anchor.web3.PublicKey | undefined;
  let vaultAuthorityPda: anchor.web3.PublicKey | undefined;
  let vaultTokenAccount = anchor.web3.Keypair.generate();

  const AMOUNT = 100;

  it("Create mint and token accounts", async function () {
    this.timeout(60_000);

    try {
      mint = await createMint(
        connection,
        wallet.payer,
        wallet.publicKey,
        null,
        0
      );

      initializerTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet.payer,
        mint,
        wallet.publicKey
      );

      beneficiaryTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet.payer,
        mint,
        beneficiary.publicKey
      );

      await mintTo(
        connection,
        wallet.payer,
        mint,
        initializerTokenAccount.address,
        wallet.publicKey,
        AMOUNT
      );

      const acc = await getAccount(connection, initializerTokenAccount.address);
      assert.equal(Number(acc.amount), AMOUNT);
    } catch (e) {
      console.error("Mint setup failed:", e);
      throw e;
    }

    
    if (!mint || !initializerTokenAccount || !beneficiaryTokenAccount) {
      throw new Error("Mint setup incomplete — aborting tests");
    }
  });

  it("Initialize escrow", async function () {
    this.timeout(60_000);

    e
    if (!mint) throw new Error("Mint not initialized");
    if (!initializerTokenAccount) throw new Error("Initializer ATA missing");

    [vaultAuthorityPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_authority"),
        wallet.publicKey.toBuffer(),
        mint.toBuffer(),
      ],
      program.programId
    );

    [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        wallet.publicKey.toBuffer(),
        mint.toBuffer(),
      ],
      program.programId
    );

    const approveIx = createApproveInstruction(
      initializerTokenAccount.address,
      vaultAuthorityPda,
      wallet.publicKey,
      AMOUNT
    );

    await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(approveIx)
    );

    const releaseTime = Math.floor(Date.now() / 1000) + 3;

    await program.methods
      .initializeEscrow(new BN(AMOUNT), new BN(releaseTime))
      .accounts({
        initializer: wallet.publicKey,
        beneficiary: beneficiary.publicKey,
        initializerDepositTokenAccount: initializerTokenAccount.address,
        vaultAccount: vaultTokenAccount.publicKey,
        vaultAuthority: vaultAuthorityPda,
        escrow: escrowPda,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([vaultTokenAccount])
      .rpc();

    const escrow = await program.account.escrow.fetch(escrowPda);
    assert.equal(Number(escrow.amount), AMOUNT);
  });

  it("Fail to release before time", async () => {
    try {
      await program.methods
        .releaseEscrow()
        .accounts({
          beneficiary: beneficiary.publicKey,
          beneficiaryReceiveTokenAccount: beneficiaryTokenAccount.address,
          escrow: escrowPda,
          initializer: wallet.publicKey,
          vaultAccount: vaultTokenAccount.publicKey,
          vaultAuthority: vaultAuthorityPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([beneficiary])
        .rpc();

      assert.fail("Should fail");
    } catch {
      assert.ok(true);
    }
  });

  it("Wait for release time", async () => {
    await new Promise((r) => setTimeout(r, 4000));
  });

  it("Release escrow successfully", async function () {
    this.timeout(60_000);

    await program.methods
      .releaseEscrow()
      .accounts({
        beneficiary: beneficiary.publicKey,
        beneficiaryReceiveTokenAccount: beneficiaryTokenAccount.address,
        escrow: escrowPda,
        initializer: wallet.publicKey,
        vaultAccount: vaultTokenAccount.publicKey,
        vaultAuthority: vaultAuthorityPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([beneficiary])
      .rpc();

    const beneficiaryAcc = await getAccount(
      connection,
      beneficiaryTokenAccount.address
    );

    assert.equal(Number(beneficiaryAcc.amount), AMOUNT);
  });
});
