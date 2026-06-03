import { z } from "zod";

export const NetworkName = z.enum(["pharos-testnet", "pharos-mainnet"]);
export type NetworkName = z.infer<typeof NetworkName>;

export type NetworkConfig = {
  name: NetworkName;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
};

export const NETWORKS: Record<NetworkName, NetworkConfig> = {
  "pharos-testnet": {
    name: "pharos-testnet",
    chainId: 688688,
    rpcUrl: "https://testnet.dplabs-internal.com",
    explorerUrl: "https://testnet.pharosscan.xyz",
    nativeCurrency: {
      name: "Pharos",
      symbol: "PHRS",
      decimals: 18
    }
  },
  "pharos-mainnet": {
    name: "pharos-mainnet",
    chainId: 688688,
    rpcUrl: "https://rpc.pharosnetwork.xyz",
    explorerUrl: "https://pharosscan.xyz",
    nativeCurrency: {
      name: "Pharos",
      symbol: "PHRS",
      decimals: 18
    }
  }
};

export function resolveNetwork(name?: string, rpcOverride?: string): NetworkConfig {
  const parsed = NetworkName.safeParse(name ?? process.env.PHAROS_NETWORK ?? "pharos-testnet");
  if (!parsed.success) {
    throw new Error(`Unsupported network "${name}". Use pharos-testnet or pharos-mainnet.`);
  }

  const base = NETWORKS[parsed.data];
  return {
    ...base,
    rpcUrl: rpcOverride || process.env.PHAROS_RPC_URL || base.rpcUrl
  };
}

export function listNetworks() {
  return Object.values(NETWORKS);
}
