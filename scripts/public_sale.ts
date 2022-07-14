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
  .command("open-public-sale")
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
    console.log("Step 1: Load Program Owner");
    const serviceKeyPair = loadWallet(keypair);

    console.log("Step 2: Load Config");
    let configFile = fs.readFileSync(config, "utf-8");
    const setting = JSON.parse(configFile);

    const nft_type = setting["nft_type"];
    const public_sale_user_per = new anchor.BN(setting["public_sale_user_per"]);
    console.log("Step 3: Open Public Sale");
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

    let [configPDA, configPDABump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(CONFIG_PDA_SEED), Buffer.from(nft_type)],
        program.programId
      );
    await program.methods
      .enablePublicSale(nft_type, public_sale_user_per)
      .accounts({
        owner: serviceKeyPair.publicKey,
        config: configPDA,
      })
      .signers([serviceKeyPair])
      .rpc();
    console.log("Finish Open Public Sale");
  });
program.parse(process.argv);
