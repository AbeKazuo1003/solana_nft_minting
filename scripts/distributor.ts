import * as anchor from "@project-serum/anchor";
import { program } from "commander";
import { loadWallet } from "./utils";
import * as fs from "fs";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { IDL, NftMinting } from "../target/types/nft_minting";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

program.version("0.0.1");

program
  .command("create-candy-machine")
  .requiredOption("-k, --keypair <path>", `Solana Wallet Location`)
  .requiredOption("-c, --config <path>", "Mint Config Location")
  .option(
    "-e, --env <string>",
    `Solana cluster env name. One of: mainnet-beta, testnet, devnet`,
    "devnet"
  )
  .action(async (_directory: any, cmd: any) => {
    const { keypair, config, env } = cmd.opts();
    const CONFIG_PDA_SEED = "config";
    const TOKEN_CONFIG_PDA_SEED = "token_config";
    const TOKEN_VAULT_PDA_SEED = "token_vault";
    console.log("Step 1: Load Program Owner");
    const serviceKeyPair = loadWallet(keypair);
    console.log("Step 2: Load Config");
    let configFile = fs.readFileSync(config, "utf-8");
    const setting = JSON.parse(configFile);
    console.log("Step 3: Prepare");
    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
      setting["metadata_program_id"]
    );
    const nft_type = setting["nft_type"];
    const max_supply = new anchor.BN(setting["max_supply"]);
    const fee_point = setting["fee_point"];
    const creator = new anchor.web3.PublicKey(setting["creator"]);
    const prefix = setting["prefix"];
    const token_name = setting["token_name"];
    const symbol = setting["symbol"];
    const uri = setting["uri"];
    const presale_user_per = setting["presale_user_per"];
    const public_sale_user_per = setting["public_sale_user_per"];
    let start_date = new anchor.BN(Date.parse(setting["start_date"]));
    let end_date = new anchor.BN(Date.parse(setting["end_date"]));

    const provideOptions = AnchorProvider.defaultOptions();
    const connection = new Connection(
      clusterApiUrl(env),
      provideOptions.commitment
    );

    const walletWrapper = new anchor.Wallet(serviceKeyPair);
    const provider = new AnchorProvider(connection, walletWrapper, {
      preflightCommitment: "confirmed",
    });
    const programId = new anchor.web3.PublicKey(setting["program"]);
    const program = new Program<NftMinting>(IDL, programId, provider);
    console.log("Step 4: Set UP");
    let [configPDA, configPDABump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(CONFIG_PDA_SEED), Buffer.from(nft_type)],
        program.programId
      );

    await program.methods
      .setup(
        nft_type,
        configPDABump,
        max_supply,
        fee_point,
        creator,
        prefix,
        token_name,
        symbol,
        uri,
        start_date,
        end_date
      )
      .accounts({
        owner: serviceKeyPair.publicKey,
        config: configPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([serviceKeyPair])
      .rpc();
    console.log("Step 4: Token Setup");
    setting["tokens"].map(async (tokenSetting) => {
      let token_type = tokenSetting["token_type"];
      let price = new anchor.BN(
        tokenSetting["price"] * Math.pow(10, tokenSetting["decimal"])
      );
      let tokenMint = new anchor.web3.PublicKey(tokenSetting["token_mint"]);
      let need_init = tokenSetting["need_init"];

      let [token_config_pda, token_config_pda_bump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from(TOKEN_CONFIG_PDA_SEED),
            Buffer.from(nft_type),
            Buffer.from(token_type),
          ],
          program.programId
        );
      let [token_vault, token_vault_bump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from(TOKEN_VAULT_PDA_SEED),
            Buffer.from(nft_type),
            Buffer.from(token_type),
          ],
          program.programId
        );
      if (need_init) {
        await program.methods
          .initTokenAccount(nft_type, token_type)
          .accounts({
            owner: serviceKeyPair.publicKey,
            config: configPDA,
            tokenMint: tokenMint,
            tokenVault: token_vault,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([serviceKeyPair])
          .rpc();
      }
      await program.methods
        .tokenSetup(nft_type, token_type, token_config_pda_bump, price)
        .accounts({
          owner: serviceKeyPair.publicKey,
          config: configPDA,
          tokenMint: tokenMint,
          tokenVault: token_vault,
          tokenConfig: token_config_pda,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([serviceKeyPair])
        .rpc();
    });
    console.log("Finish Create Candy Machine");
  });

program.parse(process.argv);
