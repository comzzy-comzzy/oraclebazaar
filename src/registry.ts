import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";
import { NetworkConfig } from "./networks.js";

export const REGISTRY_ABI = [
  "event ProviderRegistered(address indexed provider, string endpoint, string metadataURI)",
  "event SignalAttested(bytes32 indexed signalId, address indexed provider, bytes32 payloadHash, string uri)",
  "function registerProvider(string endpoint, string metadataURI) external",
  "function attestSignal(bytes32 signalId, bytes32 payloadHash, string uri) external",
  "function providers(address) view returns (string endpoint, string metadataURI, uint256 registeredAt, bool active)",
  "function attestations(bytes32) view returns (address provider, bytes32 payloadHash, string uri, uint256 timestamp)"
] as const;

export async function registrySource(): Promise<string> {
  const current = dirname(fileURLToPath(import.meta.url));
  return readFile(resolve(current, "../contracts/OracleBazaarRegistry.sol"), "utf8");
}

export function walletFor(network: NetworkConfig, privateKey?: string) {
  const key = privateKey ?? process.env.PRIVATE_KEY;
  if (!key) {
    throw new Error("PRIVATE_KEY is required for this write command.");
  }
  return new ethers.Wallet(key, new ethers.JsonRpcProvider(network.rpcUrl, network.chainId));
}

export async function registerProvider(input: {
  network: NetworkConfig;
  registry: string;
  endpoint: string;
  metadataUri: string;
  privateKey?: string;
}) {
  const wallet = walletFor(input.network, input.privateKey);
  const contract = new ethers.Contract(input.registry, REGISTRY_ABI, wallet);
  const tx = await contract.registerProvider(input.endpoint, input.metadataUri);
  const receipt = await tx.wait();
  return {
    network: input.network.name,
    registry: input.registry,
    provider: wallet.address,
    txHash: receipt?.hash ?? tx.hash,
    explorerUrl: `${input.network.explorerUrl}/tx/${receipt?.hash ?? tx.hash}`
  };
}

export async function attestSignal(input: {
  network: NetworkConfig;
  registry: string;
  signalId: string;
  payloadHash: string;
  uri: string;
  privateKey?: string;
}) {
  const wallet = walletFor(input.network, input.privateKey);
  const contract = new ethers.Contract(input.registry, REGISTRY_ABI, wallet);
  const tx = await contract.attestSignal(input.signalId, input.payloadHash, input.uri);
  const receipt = await tx.wait();
  return {
    network: input.network.name,
    registry: input.registry,
    provider: wallet.address,
    signalId: input.signalId,
    txHash: receipt?.hash ?? tx.hash,
    explorerUrl: `${input.network.explorerUrl}/tx/${receipt?.hash ?? tx.hash}`
  };
}
