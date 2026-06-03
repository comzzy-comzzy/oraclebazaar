---
name: oraclebazaar
description: "Agent-to-agent x402 data marketplace for paid oracle signals, provider discovery, and onchain attestation on Pharos testnet/mainnet."
metadata:
  author: "OracleBazaar contributors"
  user-invocable: "true"
  arguments: "list-networks | provider-card | probe-signal | buy-signal | verify-signal | deploy-registry | register-provider | publish-attestation"
  entry: "src/cli.ts"
  requires: "nodejs, npm, private-key-for-write-actions"
  tags: "pharos, x402, evm, oracle, agents, rwa, defi, tooling"
---

# OracleBazaar Skill

OracleBazaar lets AI agents discover paid data providers, probe x402 prices, buy oracle/risk signals, verify signed responses, and anchor hashes on Pharos.

Run from the project root:

```bash
npm install
npm run build
npm run dev -- list-networks
```

Common commands:

```bash
npm run dev -- provider-card --name "RWA Risk Agent" --endpoint https://example.com/x402/risk --price "0.02 USDC"
npm run dev -- probe-signal --url https://seller.example/x402/risk --query examples/rwa-risk-query.json
npm run dev -- buy-signal --url https://seller.example/x402/risk --query examples/rwa-risk-query.json --network pharos-testnet
npm run dev -- verify-signal --file signal.json
npm run dev -- deploy-registry --network pharos-testnet
npm run dev -- register-provider --registry 0x... --endpoint https://seller.example/x402/risk --metadata-uri ipfs://...
```
