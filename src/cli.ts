#!/usr/bin/env node
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { Command } from "commander";
import { ethers } from "ethers";
import { hashJson, signalDigest } from "./hash.js";
import { printJson, readJsonFile } from "./io.js";
import { listNetworks, resolveNetwork } from "./networks.js";
import { attestSignal, registerProvider, registrySource } from "./registry.js";
import { OracleSignalSchema, ProviderCardSchema, SignalRequestSchema } from "./schemas.js";
import { createSignal, signSignal, verifySignal } from "./signal.js";
import { buyX402Signal, probeX402 } from "./x402.js";

const program = new Command();

program
  .name("oraclebazaar")
  .description("Agent-to-agent x402 data marketplace skill for Pharos")
  .version("0.1.0");

program.command("list-networks").description("Show supported Pharos network profiles").action(() => {
  printJson(listNetworks());
});

program
  .command("provider-card")
  .description("Create a provider metadata card for publishing or sharing")
  .requiredOption("--name <name>", "Provider name")
  .requiredOption("--endpoint <url>", "x402 endpoint URL")
  .requiredOption("--price <price>", "Human-readable price, for example '0.02 USDC'")
  .option("--description <text>", "Provider description", "Paid oracle signal provider")
  .option("--category <items>", "Comma-separated categories", "oracle,risk,agent")
  .option("--metadata-uri <uri>", "Optional metadata URI")
  .action((options) => {
    const card = ProviderCardSchema.parse({
      schema: "oraclebazaar.provider.v1",
      name: options.name,
      endpoint: options.endpoint,
      description: options.description,
      price: options.price,
      categories: String(options.category)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      metadataUri: options.metadataUri
    });
    printJson(card);
  });

program
  .command("probe-signal")
  .description("Probe an x402 seller endpoint and show required payment without anchoring onchain")
  .requiredOption("--url <url>", "Seller x402 endpoint URL")
  .requiredOption("--query <file>", "JSON signal request file")
  .action(async (options) => {
    const request = SignalRequestSchema.parse(await readJsonFile(options.query));
    const result = await probeX402(options.url, request);
    printJson({
      endpoint: options.url,
      requestId: request.requestId,
      ...result
    });
  });

program
  .command("buy-signal")
  .description("Buy a signal from an x402 seller and optionally sign/save the OracleBazaar envelope")
  .requiredOption("--url <url>", "Seller x402 endpoint URL")
  .requiredOption("--query <file>", "JSON signal request file")
  .option("--network <name>", "pharos-testnet or pharos-mainnet")
  .option("--provider <name>", "Provider display name", "unknown-provider")
  .option("--payment-header <value>", "Prebuilt x402 payment header for the seller")
  .option("--sign", "Sign the signal with PRIVATE_KEY")
  .option("--out <file>", "Write signal JSON to a file")
  .action(async (options) => {
    const network = resolveNetwork(options.network);
    const request = SignalRequestSchema.parse(await readJsonFile(options.query));
    const quote = await probeX402(options.url, request);

    if (quote.paid && !options.paymentHeader) {
      printJson({
        status: "payment_required",
        message: "Seller requires x402 payment. Re-run with --payment-header after your x402 wallet/facilitator creates it.",
        quote: quote.quote
      });
      return;
    }

    const purchase = await buyX402Signal(options.url, request, options.paymentHeader);
    const result =
      typeof purchase.response === "object" && purchase.response !== null && "result" in purchase.response
        ? ((purchase.response as { result: Record<string, unknown> }).result)
        : ({ value: purchase.response } as Record<string, unknown>);

    let signal = createSignal({
      request,
      provider: options.provider,
      endpoint: options.url,
      network: network.name,
      result,
      quote: quote.quote,
      receipt: purchase.receipt
    });

    if (options.sign) {
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) throw new Error("PRIVATE_KEY is required when --sign is used.");
      signal = await signSignal(signal, privateKey);
    }

    if (options.out) {
      await writeFile(options.out, `${JSON.stringify(signal, null, 2)}\n`);
    }

    printJson(signal);
  });

program
  .command("verify-signal")
  .description("Verify an OracleBazaar signal signature and payload digest")
  .requiredOption("--file <file>", "Signal JSON file")
  .action(async (options) => {
    const signal = OracleSignalSchema.parse(await readJsonFile(options.file));
    printJson(verifySignal(signal));
  });

program
  .command("deploy-registry")
  .description("Print registry source and deployment instructions for Pharos")
  .option("--network <name>", "pharos-testnet or pharos-mainnet")
  .action(async (options) => {
    const network = resolveNetwork(options.network);
    printJson({
      network,
      note: "Compile and deploy contracts/OracleBazaarRegistry.sol with Foundry, Hardhat, Remix, or Pharos Agent Center deploy-contract. The CLI keeps deployment tool-agnostic for the hackathon skill format.",
      constructorArgs: [],
      sourceHash: hashJson(await registrySource())
    });
  });

program
  .command("register-provider")
  .description("Register a paid x402 provider in a deployed OracleBazaarRegistry")
  .requiredOption("--registry <address>", "OracleBazaarRegistry contract address")
  .requiredOption("--endpoint <url>", "Provider x402 endpoint")
  .requiredOption("--metadata-uri <uri>", "Provider metadata URI")
  .option("--network <name>", "pharos-testnet or pharos-mainnet")
  .action(async (options) => {
    const network = resolveNetwork(options.network);
    printJson(
      await registerProvider({
        network,
        registry: options.registry,
        endpoint: options.endpoint,
        metadataUri: options.metadataUri
      })
    );
  });

program
  .command("publish-attestation")
  .description("Anchor a purchased signal hash in OracleBazaarRegistry")
  .requiredOption("--registry <address>", "OracleBazaarRegistry contract address")
  .requiredOption("--file <file>", "Signal JSON file")
  .option("--uri <uri>", "URI where the full signal can be retrieved", "")
  .option("--network <name>", "pharos-testnet or pharos-mainnet")
  .action(async (options) => {
    const network = resolveNetwork(options.network);
    const signal = OracleSignalSchema.parse(await readJsonFile(options.file));
    const verification = verifySignal(signal);
    if (!verification.valid) {
      throw new Error("Refusing to publish an invalid or unsigned signal.");
    }

    const signalId = signalDigest(signal);
    printJson(
      await attestSignal({
        network,
        registry: options.registry,
        signalId,
        payloadHash: signal.payloadHash,
        uri: options.uri || `oraclebazaar://signal/${ethers.hexlify(ethers.getBytes(signalId))}`
      })
    );
  });

program.parseAsync().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
