import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";

const server = createServer((request, response) => {
  if (request.method !== "POST" || request.url !== "/x402/risk") {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "not found" }));
    return;
  }

  let body = "";
  request.on("data", (chunk) => {
    body += chunk;
  });

  request.on("end", () => {
    const payment = request.headers["x-payment"];
    if (!payment) {
      const quote = Buffer.from(
        JSON.stringify({
          amount: "0.01",
          asset: "USDC",
          network: "pharos-testnet",
          recipient: "0x0000000000000000000000000000000000000000"
        })
      ).toString("base64");
      response.writeHead(402, {
        "content-type": "application/json",
        "x-payment-required": quote
      });
      response.end(JSON.stringify({ error: "payment required" }));
      return;
    }

    const requestBody = JSON.parse(body || "{}");
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        result: {
          riskScore: 0.19,
          suggestedHaircut: 0.28,
          confidence: 0.84,
          rationale: "Demo score based on tenor, debtor rating, jurisdiction, and invoice size.",
          requestId: requestBody.requestId
        }
      })
    );
  });
});

server.listen(port, host, () => {
  process.stdout.write(`OracleBazaar mock x402 seller listening on http://${host}:${port}/x402/risk\n`);
});
