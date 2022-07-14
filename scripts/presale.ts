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
  .command("open-presale")
  .requiredOption("-k, --keypair <path>", `Solana Wallet Location`)
  .requiredOption("-c, --config <path>", "Mint Config Location")
  .option(
    "-e, --env <string>",
    `Solana cluster env name. One of: mainnet-beta, testnet, devnet`,
    "devnet"
  )
  .action(async (_directory: any, cmd: any) => {});

program.parse(process.argv);
