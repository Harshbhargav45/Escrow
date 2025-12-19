# 🔐 Token Escrow on Solana (Anchor)

A **simple, secure Token Escrow program** built on **Solana** using the **Anchor framework**.  
This program allows users to **deposit custom SPL tokens into a PDA-controlled vault** and **withdraw them only via program logic**, ensuring trustless custody.

This project is designed as a **learning-first, production-aligned implementation** of how real Solana escrow systems work.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Language](https://img.shields.io/badge/language-Rust-orange.svg) ![Framework](https://img.shields.io/badge/framework-Anchor-blueviolet.svg)

## 🚀 What This Project Does

* ✅ **Secure Storage:** Stores custom SPL tokens in a vault.
* ✅ **PDA Ownership:** The Vault is owned by a **Program Derived Address (PDA)** — not a user.
* ✅ **Deposit:** Users can deposit tokens into the escrow vault.
* ✅ **Conditional Withdrawal:** Tokens can be withdrawn *only* by program logic (no backdoors).
* ✅ **Universal:** Works with *any* custom SPL token mint.
* ✅ **Tested:** Built using **Anchor (Rust)** + **TypeScript integration tests**.

---

## 🧠 Why Escrow?

In Web3, **trustless custody** is the most critical primitive.

* **Without an Escrow:** Tokens are controlled by private keys. If you send tokens to someone, you have to trust them to send them back or perform the service.
* **With an Escrow:** Tokens are controlled by **on-chain logic**. No single user can steal funds. The program acts as a neutral third party that enforces the rules.

This pattern is the foundation for NFT Marketplaces, Staking contracts, DeFi protocols, and Game economies.

---

## 🏗️ Architecture Overview

### Core Components

| Component | Description |
| :--- | :--- |
| **Program** | The Anchor-based Smart Contract |
| **Vault PDA** | The Program-Derived Authority (The "Owner") |
| **Vault Token Account** | The actual account holding the locked tokens |
| **User Token Account** | The user’s wallet token account |
| **Mint** | The custom SPL token being used |

### PDA Design

We use a deterministic seed pattern to ensure safety:

> **Vault Authority Seeds** = `["vault", mint_pubkey]`

* The PDA owns the vault token account.
* Only the program can sign for this PDA.
* Users cannot withdraw directly; they must call the program's instruction.

### Architecture Flow

```mermaid
graph TD
    User[👤 User]
    Program[⚙️ Escrow Program]
    VaultPDA[🔐 Vault PDA (Authority)]
    VaultATA[💰 Vault Token Account]
    
    subgraph Initialization
    Program -- Derives --> VaultPDA
    Program -- Creates --> VaultATA
    end
    
    subgraph Deposit
    User -- Transfers Tokens --> VaultATA
    end
    
    subgraph Withdraw
    Program -- Signs via PDA --> VaultATA
    VaultATA -- Transfers Tokens --> User
    end
