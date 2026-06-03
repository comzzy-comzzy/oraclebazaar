import { z } from "zod";

export const SignalRequestSchema = z.object({
  requestId: z.string().min(1),
  assetType: z.string().min(1).optional(),
  assetId: z.string().min(1).optional(),
  question: z.string().min(1),
  facts: z.record(z.unknown()).default({})
});

export type SignalRequest = z.infer<typeof SignalRequestSchema>;

export const PaymentQuoteSchema = z.object({
  amount: z.string(),
  asset: z.string(),
  network: z.string().optional(),
  recipient: z.string().optional(),
  facilitator: z.string().optional(),
  raw: z.unknown().optional()
});

export type PaymentQuote = z.infer<typeof PaymentQuoteSchema>;

export const OracleSignalSchema = z.object({
  schema: z.literal("oraclebazaar.signal.v1"),
  requestId: z.string(),
  provider: z.string(),
  providerAddress: z.string().optional(),
  endpoint: z.string().url(),
  issuedAt: z.string(),
  expiresAt: z.string().optional(),
  network: z.string(),
  payloadHash: z.string(),
  result: z.record(z.unknown()),
  payment: z
    .object({
      quote: PaymentQuoteSchema.optional(),
      receipt: z.unknown().optional()
    })
    .optional(),
  attestation: z
    .object({
      registry: z.string().optional(),
      txHash: z.string().optional(),
      signalId: z.string().optional()
    })
    .optional(),
  signature: z.string().optional()
});

export type OracleSignal = z.infer<typeof OracleSignalSchema>;

export const ProviderCardSchema = z.object({
  schema: z.literal("oraclebazaar.provider.v1"),
  name: z.string().min(1),
  endpoint: z.string().url(),
  description: z.string(),
  price: z.string(),
  categories: z.array(z.string()).default([]),
  networks: z.array(z.string()).default(["pharos-testnet", "pharos-mainnet"]),
  publicKey: z.string().optional(),
  metadataUri: z.string().optional()
});

export type ProviderCard = z.infer<typeof ProviderCardSchema>;
