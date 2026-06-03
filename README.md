# OracleBazaar

OracleBazaar is a Pharos Agent Center skill for agent-to-agent paid oracle data. It lets an AI agent probe an x402 seller endpoint, buy a risk/oracle signal, wrap the response in a signed verifiable envelope, and anchor the signal hash on Pharos testnet or mainnet.

It is designed for the Pharos Skill Builder Campaign as a multi-skill package:

- `provider-card`: create metadata for a paid oracle provider.
- `probe-signal`: discover the x402 price for a seller endpoint.
- `buy-signal`: buy a signal and save a verifiable OracleBazaar envelope.
- `verify-signal`: verify a provider signature and signal digest.
- `deploy-registry`: prepare the Pharos registry deployment.
- `register-provider`: register a seller endpoint onchain.
- `publish-attestation`: anchor a purchased signal hash onchain.

## What OracleBazaar Builds

OracleBazaar turns paid agent APIs into an onchain data marketplace:

1. A seller agent exposes a paid x402 endpoint, for example an RWA risk model.
2. A buyer agent probes the endpoint and sees the required payment.
3. The buyer pays through an x402-compatible wallet/facilitator.
4. The seller returns a structured oracle signal.
5. OracleBazaar signs, verifies, and hashes the signal.
6. The provider can anchor the signal hash in `OracleBazaarRegistry` on Pharos.

## Requirements

- Node.js 20 or newer.
- npm.
- A Pharos-compatible EVM wallet for live write commands.
- Testnet or mainnet PHRS for live contract transactions.
- An x402-compatible wallet/facilitator for real paid purchases.

Read-only commands and local tests do not require a wallet.

## Install

```bash
git clone <your-github-repo-url>
cd oraclebazaar
npm install
cp .env.example .env
npm run build
```

Open `.env` and set the network:

```bash
PHAROS_NETWORK=pharos-testnet
```

For live write commands, also set:

```bash
PRIVATE_KEY=0xyour_private_key
```

Never commit `.env`. It is ignored by git.

## Supported Pharos Networks

OracleBazaar includes profiles for both:

- `pharos-testnet`
- `pharos-mainnet`

Show the current profiles:

```bash
npm run dev -- list-networks
```

If Pharos updates RPC URLs, override them without changing code:

```bash
PHAROS_RPC_URL=https://your-rpc.example npm run dev -- list-networks
```

## Beginner Quickstart

### 1. Run the tests

```bash
npm run check
```

This runs TypeScript checks, unit tests, and a production build.

### 2. Start the local demo seller

Open terminal 1:

```bash
npx tsx scripts/mock-seller.ts
```

The mock seller listens at:

```text
http://127.0.0.1:8787/x402/risk
```

### 3. Probe the x402 price

Open terminal 2:

```bash
npm run dev -- probe-signal \
  --url http://127.0.0.1:8787/x402/risk \
  --query examples/rwa-risk-query.json
```

You should see a `payment_required` style response with a demo quote.

### 4. Buy a demo signal

The mock seller accepts any payment header so you can test the skill locally:

```bash
npm run dev -- buy-signal \
  --url http://127.0.0.1:8787/x402/risk \
  --query examples/rwa-risk-query.json \
  --network pharos-testnet \
  --provider "Demo RWA Risk Agent" \
  --payment-header demo-paid-header \
  --out signal.json
```

### 5. Sign the signal

Add a test private key to `.env`, then run:

```bash
npm run dev -- buy-signal \
  --url http://127.0.0.1:8787/x402/risk \
  --query examples/rwa-risk-query.json \
  --network pharos-testnet \
  --provider "Demo RWA Risk Agent" \
  --payment-header demo-paid-header \
  --sign \
  --out signal.json
```

### 6. Verify the signal

```bash
npm run dev -- verify-signal --file signal.json
```

Expected result:

```json
{
  "valid": true,
  "signer": "0x...",
  "digest": "0x..."
}
```

## Using Pharos Testnet

Use testnet while developing:

```bash
PHAROS_NETWORK=pharos-testnet npm run dev -- list-networks
```

Deploy the registry contract with your preferred Pharos-compatible deployment tool:

```bash
npm run dev -- deploy-registry --network pharos-testnet
```

The command prints the network config and source hash. Deploy:

```text
contracts/OracleBazaarRegistry.sol
```

After deployment, register your seller:

```bash
npm run dev -- register-provider \
  --network pharos-testnet \
  --registry 0xYourRegistryAddress \
  --endpoint https://your-seller.example/x402/risk \
  --metadata-uri ipfs://your-provider-card
```

Then publish a signed signal attestation:

```bash
npm run dev -- publish-attestation \
  --network pharos-testnet \
  --registry 0xYourRegistryAddress \
  --file signal.json \
  --uri ipfs://your-signal-json
```

## Using Pharos Mainnet

Mainnet uses the same commands with `pharos-mainnet`:

```bash
npm run dev -- register-provider \
  --network pharos-mainnet \
  --registry 0xYourMainnetRegistryAddress \
  --endpoint https://your-seller.example/x402/risk \
  --metadata-uri ipfs://your-provider-card
```

```bash
npm run dev -- publish-attestation \
  --network pharos-mainnet \
  --registry 0xYourMainnetRegistryAddress \
  --file signal.json \
  --uri ipfs://your-signal-json
```

Use mainnet only after you have tested the full flow on testnet.

## Creating a Provider Card

```bash
npm run dev -- provider-card \
  --name "RWA Risk Agent" \
  --endpoint https://your-seller.example/x402/risk \
  --price "0.01 USDC" \
  --description "Scores invoice, bond, and receivable risk for lending agents" \
  --category rwa,risk,oracle
```

Publish this JSON to IPFS, Arweave, GitHub, or your own HTTPS endpoint. Use that URI as `--metadata-uri`.

## Real x402 Integration

For a real seller endpoint:

1. `probe-signal` sends the signal request.
2. The seller returns HTTP `402 Payment Required`.
3. Your x402 wallet/facilitator creates a payment header.
4. `buy-signal` sends that header through `--payment-header`.
5. The seller returns the paid signal response.

The local mock seller skips real settlement so judges can test the skill without funded accounts.

## Project Structure

```text
contracts/OracleBazaarRegistry.sol   Onchain provider and signal registry
src/cli.ts                           Skill command entrypoint
src/x402.ts                          x402 probe and buy helpers
src/signal.ts                        Signal envelope, signing, verification
src/networks.ts                      Pharos testnet/mainnet profiles
scripts/mock-seller.ts               Local test seller endpoint
test/                                Unit tests
skills/oraclebazaar/SKILL.md         Pharos/Codex skill descriptor
```

## Submission Notes

Skill name: OracleBazaar

Short description: Agent-to-agent x402 marketplace for paid oracle signals with Pharos onchain provider registration and signal attestation.

Supported framework: Node.js TypeScript CLI skill, Solidity registry contract, Pharos EVM networks, x402-compatible paid APIs.

Dependencies: Node.js, npm, ethers, commander, zod, dotenv.

## Safety

- Keep private keys out of git.
- Test with `pharos-testnet` first.
- Verify seller endpoints before paying.
- Anchor only signed signals that `verify-signal` marks as valid.
