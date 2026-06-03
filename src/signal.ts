import { ethers } from "ethers";
import { hashJson, signalDigest } from "./hash.js";
import { OracleSignal, OracleSignalSchema, SignalRequest } from "./schemas.js";

export function createSignal(input: {
  request: SignalRequest;
  provider: string;
  providerAddress?: string;
  endpoint: string;
  network: string;
  result: Record<string, unknown>;
  quote?: unknown;
  receipt?: unknown;
}): OracleSignal {
  const issuedAt = new Date().toISOString();
  const payloadHash = hashJson({
    request: input.request,
    result: input.result
  });

  return OracleSignalSchema.parse({
    schema: "oraclebazaar.signal.v1",
    requestId: input.request.requestId,
    provider: input.provider,
    providerAddress: input.providerAddress,
    endpoint: input.endpoint,
    issuedAt,
    network: input.network,
    payloadHash,
    result: input.result,
    payment: {
      quote: input.quote,
      receipt: input.receipt
    }
  });
}

export async function signSignal(signal: OracleSignal, privateKey: string): Promise<OracleSignal> {
  const wallet = new ethers.Wallet(privateKey);
  const digest = signalDigest(signal);
  const signature = await wallet.signMessage(ethers.getBytes(digest));
  return {
    ...signal,
    providerAddress: signal.providerAddress ?? wallet.address,
    signature
  };
}

export function verifySignal(signal: OracleSignal): { valid: boolean; signer?: string; digest: string } {
  const parsed = OracleSignalSchema.parse(signal);
  const digest = signalDigest(parsed);

  if (!parsed.signature) {
    return { valid: false, digest };
  }

  const signer = ethers.verifyMessage(ethers.getBytes(digest), parsed.signature);
  return {
    valid: !parsed.providerAddress || signer.toLowerCase() === parsed.providerAddress.toLowerCase(),
    signer,
    digest
  };
}
