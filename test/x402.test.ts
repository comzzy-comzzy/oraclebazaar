import { describe, expect, it } from "vitest";
import { probeX402, buyX402Signal } from "../src/x402.js";

describe("x402 client", () => {
  it("detects payment-required responses", async () => {
    const quote = Buffer.from(JSON.stringify({ amount: "0.01", asset: "USDC", network: "pharos-testnet" })).toString(
      "base64"
    );
    const fetcher = async () =>
      new Response(JSON.stringify({ error: "payment required" }), {
        status: 402,
        headers: { "x-payment-required": quote }
      });

    const result = await probeX402("https://seller.example/x402/risk", { requestId: "1" }, fetcher as typeof fetch);
    expect(result.paid).toBe(true);
    expect(result.quote?.amount).toBe("0.01");
    expect(result.quote?.asset).toBe("USDC");
  });

  it("buys a signal with a payment header", async () => {
    const fetcher = async (_url: string | URL | Request, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>)["x-payment"]).toBe("paid-header");
      return new Response(JSON.stringify({ result: { riskScore: 0.12 } }), { status: 200 });
    };

    const result = await buyX402Signal(
      "https://seller.example/x402/risk",
      { requestId: "1" },
      "paid-header",
      fetcher as typeof fetch
    );

    expect(result.response).toEqual({ result: { riskScore: 0.12 } });
  });
});
