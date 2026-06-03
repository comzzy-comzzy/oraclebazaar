import { PaymentQuote, PaymentQuoteSchema } from "./schemas.js";

export type FetchLike = typeof fetch;

function parsePaymentHeader(header: string | null): PaymentQuote | undefined {
  if (!header) return undefined;

  try {
    const parsed = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    return PaymentQuoteSchema.parse({
      amount: String(parsed.amount ?? parsed.maxAmountRequired ?? parsed.maxAmount ?? ""),
      asset: String(parsed.asset ?? parsed.assetName ?? parsed.token ?? "unknown"),
      network: parsed.network,
      recipient: parsed.recipient ?? parsed.payTo,
      facilitator: parsed.facilitator,
      raw: parsed
    });
  } catch {
    try {
      const parsed = JSON.parse(header);
      return PaymentQuoteSchema.parse({
        amount: String(parsed.amount ?? parsed.maxAmountRequired ?? parsed.maxAmount ?? ""),
        asset: String(parsed.asset ?? parsed.assetName ?? parsed.token ?? "unknown"),
        network: parsed.network,
        recipient: parsed.recipient ?? parsed.payTo,
        facilitator: parsed.facilitator,
        raw: parsed
      });
    } catch {
      return {
        amount: "unknown",
        asset: "unknown",
        raw: header
      };
    }
  }
}

export async function probeX402(
  url: string,
  body: unknown,
  fetcher: FetchLike = fetch
): Promise<{ paid: boolean; status: number; quote?: PaymentQuote; preview?: unknown }> {
  const response = await fetcher(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify(body)
  });

  if (response.status === 402) {
    const header = response.headers.get("x-payment-required") ?? response.headers.get("payment-required");
    let quote = parsePaymentHeader(header);
    if (!quote) {
      const data = await response.json().catch(() => undefined);
      quote = PaymentQuoteSchema.partial()
        .transform((value) => ({
          amount: String(value.amount ?? "unknown"),
          asset: String(value.asset ?? "unknown"),
          network: value.network,
          recipient: value.recipient,
          facilitator: value.facilitator,
          raw: data
        }))
        .parse(data ?? {});
    }
    return { paid: true, status: response.status, quote };
  }

  const preview = await response.json().catch(() => undefined);
  return { paid: false, status: response.status, preview };
}

export async function buyX402Signal(
  url: string,
  body: unknown,
  paymentHeader?: string,
  fetcher: FetchLike = fetch
): Promise<{ response: unknown; receipt?: unknown }> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json"
  };

  if (paymentHeader) {
    headers["x-payment"] = paymentHeader;
  }

  const response = await fetcher(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Signal purchase failed with HTTP ${response.status}: ${text}`);
  }

  const receiptHeader = response.headers.get("x-payment-response");
  const receipt = receiptHeader ? parsePaymentHeader(receiptHeader)?.raw ?? receiptHeader : undefined;
  return {
    response: await response.json(),
    receipt
  };
}
