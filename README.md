# x402 Inspector

**Live:** https://dansgit2b.github.io/x402-inspector/

This browser tool decodes and lints [x402](https://www.x402.org/) payment headers: `PAYMENT-REQUIRED` (base64 or JSON 402 bodies), `X-PAYMENT` / `PAYMENT-SIGNATURE` payloads, and `PAYMENT-RESPONSE` settlement receipts. It's handy when you're building or debugging a pay-per-call API or an agent that pays for one.

- Decodes v1 and v2 payloads and shows USDC amounts in human units.
- Flags missing fields, non-CAIP-2 networks in v2, malformed `payTo`, non-integer amounts, missing EIP-712 `extra`, and expired EIP-3009 authorizations.
- Everything runs locally as a static page, with no backend and no tracking.

## Pro pass (0.05 USDC)
Decoding and linting are free. A one-time 0.05 USDC pass unlocks **batch mode** and **Markdown report export**. You pay in USDC on Base or Arc straight to the Lumen Works wallet `0xee9790cB3960952F585379F831a89b4e00B4029A`, and the page checks the transaction on-chain. Since the code is MIT you could remove the check yourself; the pass is a fair way to fund upkeep.

## Run locally
Open `docs/index.html`. There's no build step.

MIT © Lumen Works. Not affiliated with Coinbase or the x402 Foundation.
