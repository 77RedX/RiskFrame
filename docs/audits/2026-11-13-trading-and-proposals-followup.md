# Trading and proposal UI follow-up - 2026-11-13

Status: verified findings and implementation plan only. No application code changes. Tested current fixes branch after ac80bc3 using Microsoft Edge, the running Docker stack, controlled browser fixtures, and a separate isolated live Atlas account. UTC evidence timestamps fall on November 12; the local audit date is November 13 (Asia/Calcutta).

## P2 - Trade quantity controls allow invalid oversell attempts

**User report:** able to sell more shares than owned.

**Verified distinction:** excessive quantity entry is reproducible; a completed excessive sale was not reproduced. With 2 AAPL held, My Portfolio accepts quantity 3 with no input max and an enabled Sell button. Submission shows "Cannot sell 3 shares. You currently own 2 shares." and sends no portfolio write. The model-sell proposal permits +5 to increase 2 to 7, then also rejects submission. Switching an unowned buy proposal to Sell accepts a positive quantity but rejects execution because holdings are zero.

**Server verification:** a temporary account bought 1 AAPL through the real API. Selling 2 returned HTTP 400 / Insufficient shares. Cash, holdings and trade history remained unchanged. Two concurrent requests to sell the single share returned 200 and 409; only one sale was recorded, holdings became empty, and the resulting Atlas document matched the API. The temporary account was deleted. Existing accounts were not touched.

**Root cause:** TradeModal.jsx has no quantity max; plus/preset buttons increase without a bound, MAX forces at least 1 even when nothing is sellable, and submit is disabled only while saving. Validation occurs after clicking submit. This makes an invalid order look executable and displays unrealistic previews. The server ledger guard and optimistic concurrency are currently working.

**Priority:** P2 confirmed interaction/validation defect. Treat as P1 if a successful excessive mutation is later captured; do not report the unproven server bypass as confirmed. Preserve server-side checks regardless of frontend limits.

**Related execution clarity:** the same dialog still advertises Groww/Zerodha execution and Delivery/Intraday modes even though these do not represent implemented broker/order behavior. Include removal of these misleading controls/copy in the trade-dialog correction.

## P2 - Optimization status overlaps Quant Copilot

Confirmed in the supplied screenshot and reproduced signed in and signed out. At 1440 x 900, the status notice and copilot toggle intersect by approximately 224 x 44 CSS pixels; at 390 x 844, approximately 224 x 40. The higher-layer copilot obscures notice text.

Root cause: .signals-toast is fixed bottom:28px/right:28px/z-index:999 while .agent-copilot-container is fixed bottom:24px/right:24px/z-index:9999. The notice persists until another optimization starts and is no longer a short transient toast. Raising its layer would obscure the copilot instead.

## P2 - Buy/sell proposal layout is unfinished

Confirmed by image inspection and Edge. The earlier truthful-data cleanup simplified OptimalSignals.jsx while leaving CSS aimed at old wrappers such as .card-top-row and .signal-cards-stack. The rendered .card-header has display:block with a measured zero-pixel gap between ticker and company name. Labels/values appear as an undifferentiated paragraph list.

A guest sees one rendered column inside a permanent two-column desktop grid: the first card is 554px wide within a 1136px layout, leaving the other half empty. Signed-in accounts with no sell candidates have no explanatory empty state. This is a presentation defect; retain the verified dated data and avoid restoring invented scores/rationales.

## P2 - Hidden hypothetical capital and missing selection feedback

OptimalSignals initializes capital to $15,000, while visible chips offer only $5k/$10k/$25k/$50k. On initial render all four chips report aria-pressed=false; share quantities still use $15k. This prevents a user from seeing the amount behind those quantities. Selecting a visible chip updates aria-pressed, but styling still targets .cap-chip.active, which the JSX does not apply.

Also distinguish hypothetical allocation sizing from an executable order: buying should remain subject to actual simulated cash and selling to current owned shares. A positive target weight is not itself a personalized instruction to buy additional shares.

## Evidence and verification limits

- User image: Screenshot 2026-11-13 012407.png.
- Reproduction screenshots: 2026-11-13-proposals-1440.png, 2026-11-13-proposals-390.png, 2026-11-13-oversell-dialog.png.
- Measurements and API check results: 2026-11-13-followup-evidence.json.
- Browser fixtures used an account with 2 AAPL and deterministic prices/allocations. These establish UI behavior, not live account state. Atlas verification was performed separately as described above.
- No real broker orders, existing account mutations, or successful oversell bypass observed. The user's original successful-sale path may differ from the tested paths; if it recurs, capture entry point, held/submitted quantity and API response before changing server logic.
- Fix plan: ../superpowers/plans/2026-11-13-trading-and-proposal-ui-followup.md.
