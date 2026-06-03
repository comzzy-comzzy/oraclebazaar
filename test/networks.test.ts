import { describe, expect, it } from "vitest";
import { resolveNetwork } from "../src/networks.js";

describe("Pharos network profiles", () => {
  it("supports testnet and mainnet", () => {
    expect(resolveNetwork("pharos-testnet").name).toBe("pharos-testnet");
    expect(resolveNetwork("pharos-mainnet").name).toBe("pharos-mainnet");
  });

  it("allows rpc overrides", () => {
    expect(resolveNetwork("pharos-testnet", "http://localhost:8545").rpcUrl).toBe("http://localhost:8545");
  });
});
