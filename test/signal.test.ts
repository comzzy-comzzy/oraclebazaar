import { describe, expect, it } from "vitest";
import { ethers } from "ethers";
import { createSignal, signSignal, verifySignal } from "../src/signal.js";

describe("OracleBazaar signal envelopes", () => {
  it("signs and verifies a purchased signal", async () => {
    const wallet = ethers.Wallet.createRandom();
    const signal = createSignal({
      request: {
        requestId: "risk-1",
        question: "score this invoice",
        facts: { amount: 1000 }
      },
      provider: "Risk Agent",
      providerAddress: wallet.address,
      endpoint: "https://seller.example/x402/risk",
      network: "pharos-testnet",
      result: { riskScore: 0.18, haircut: 0.25 }
    });

    const signed = await signSignal(signal, wallet.privateKey);
    const verification = verifySignal(signed);

    expect(verification.valid).toBe(true);
    expect(verification.signer).toBe(wallet.address);
  });
});
