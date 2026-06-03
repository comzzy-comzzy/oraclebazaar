import { ethers } from "ethers";

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(",")}}`;
}

export function hashJson(value: unknown): string {
  return ethers.keccak256(ethers.toUtf8Bytes(stableJson(value)));
}

export function signalDigest(input: {
  requestId: string;
  provider: string;
  endpoint: string;
  payloadHash: string;
  issuedAt: string;
  network: string;
}): string {
  return hashJson({
    requestId: input.requestId,
    provider: input.provider,
    endpoint: input.endpoint,
    payloadHash: input.payloadHash,
    issuedAt: input.issuedAt,
    network: input.network
  });
}
