# Trading and Proposal UI Follow-up Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans task by task. This is a verified plan only; the user has not requested implementation in this turn. When implementation is requested, test and commit each individual issue before editing the next. Use Microsoft Edge for Playwright.

**Goal:** Make invalid trades visibly unavailable, make the proposal section readable, expose its sizing inputs, and prevent optimization feedback colliding with the copilot.

**Architecture:** Reuse React TradeModal, OptimalSignals, existing CSS/tokens and Node ledger validation. MongoDB remains authoritative. No new dependencies, design system, invented signals, real brokerage modes or provider integration.

**Evidence:** docs/audits/2026-11-13-trading-and-proposals-followup.md and 2026-11-13-followup-evidence.json; supplied screenshot plus desktop/mobile reproductions. Excessive quantity entry is confirmed; successful server overselling was not reproduced.

## Chosen approach

Keep the existing dark/gold application style. Repair the current section rather than introducing a separate visual theme. Use a clear identity row, aligned numeric facts and a separate action row; adapt columns to actual content. Move calculation feedback into the control section instead of competing for the copilot's fixed corner. Expose every input used to size the hypothetical basket.

Alternatives considered: raising the toast layer only moves the obstruction onto the copilot, and restoring the old cards wholesale risks bringing back fabricated confidence/rationales and broker claims. Neither is part of this plan.

## Task 1 - Trade quantity bounds and honest order controls

**Touch:** website/src/components/Trading/TradeModal.jsx and .css; MyPortfolio.jsx and OptimalSignals.jsx trade callers as needed; website/tests/market-data.spec.js (or focused trade spec); server/test/ledger.test.js only if a server regression is exposed.

- [ ] Add failing Edge checks showing that quantities above ownership leave Sell enabled today: direct typing, +/preset buttons, MAX with zero holdings, and switching a buy proposal to Sell. Include both My Portfolio and proposal entry points.
- [ ] Compute valid limits from current authoritative account props: sell max equals owned shares, buy max equals affordable whole shares. Show owned/available quantity clearly; do not use proposed target shares as owned shares. Derive held shares from the current holdings list rather than the snapshot captured when the modal opened.
- [ ] Add input max and integer validity, immediate associated error/helper text and disabled submission whenever the quantity/quote/balance is invalid. Keep submit-time checks and server validation as independent protections. Let users edit a numeric draft without silently truncating fractional/exponent input into a different order.
- [ ] Bound stepper/preset changes, disable increases at the limit, and show a genuine unavailable state when max is zero. MAX must not manufacture one sellable share. Normalize mode changes without enabling an invalid order.
- [ ] Freeze mutable order controls while a request is pending and preserve errors/retry behavior. Revalidate if holdings or cash change while open; a stale quote/order rejected by the server must leave displayed confirmed state unchanged.
- [ ] Remove Groww/Zerodha execution wording and unsupported Delivery/Intraday controls. Keep plain simulated buy/sell language and verified quote dates; no short selling or actual broker integration.
- [ ] Verify valid partial sale, complete liquidation, zero holdings, oversell rejection, insufficient cash, repeated/pending clicks, server conflict, reload and keyboard/mobile reachability. Run backend ledger tests and an isolated real Atlas oversell/concurrency check; delete only test data. If an actual successful oversell path is discovered, fix it before UI polishing and add its failing server regression.
- [ ] Rebuild the affected service, run the relevant Edge/backend gates, then commit only this issue. Record results before Task 2.

## Task 2 - Optimization feedback without copilot collisions

**Touch:** OptimalSignals.jsx/.css; website/tests/optimization.spec.js and layout.spec.js as needed.

- [ ] Add failing Edge checks for notice/toggle rectangle intersection at 1440 x 900 and 390 x 844 after successful optimization. Include 320px and keyboard access in the passing gate.
- [ ] Render the existing role=status feedback inline with the optimization controls, in normal document flow, with readable wrapping. Remove the fixed bottom/right toast layout. Keep it concise and report success only after a successful result.
- [ ] Clear or hide old success when the underlying result is invalidated or a new calculation begins. Preserve the existing failed-optimization/no-false-success protections.
- [ ] Check the copilot closed/open, repeated optimization, failure/retry, responsive wrapping and modal layering. Inline status should not become a competing fixed overlay; the intentionally open copilot drawer may overlay page content as designed.
- [ ] Rebuild frontend, run optimization/layout regressions, then commit this issue before Task 3.

## Task 3 - Visible hypothetical capital and reliable selected state

**Touch:** OptimalSignals.jsx/.css; focused website proposal tests; marketSignals.js only if sizing calculations need a verified correction.

- [ ] Add failing checks that initial sizing has no selected visible preset, and selected styling does not reflect aria-pressed today.
- [ ] Preserve the current $15k default by exposing a $15k preset alongside the existing presets, and show the current dollar amount next to the label. Exactly one preset must be selected initially and after every change.
- [ ] Style [aria-pressed="true"] directly using existing colors/tokens. Make selected/focus states distinguishable without depending on hover.
- [ ] Verify quantities follow floor(capital * target weight / verified close), zero-share suggestions are honest, missing quotes remain unavailable, and changing hypothetical capital does not mutate ledger cash or bypass actual trading limits.
- [ ] Rebuild/test the sizing controls in Edge and commit before Task 4.

## Task 4 - Finish the buy/sell proposal presentation

**Touch:** OptimalSignals.jsx/.css; proposal/layout/accessibility Edge tests. Reuse existing fonts, spacing variables, buttons and surface colors.

- [ ] Add checks for guest single-column space usage, separate ticker/name presentation and clear empty sell state. Record before screenshots at desktop/mobile.
- [ ] Match JSX structure to the CSS actually used. Each proposal needs a distinct ticker/company row, a compact label/value grid (target weight, annualized model return, latest close/date), a clearly separated hypothetical sizing/owned quantity row, and a consistent simulated trade action where signed in.
- [ ] Use available width for guest proposals instead of reserving an invisible sell column. With both sections present, keep a balanced desktop layout that stacks at mobile widths. Give each empty section a useful explanation, including when there are no owned sell candidates; do not insert fabricated candidates to fill space.
- [ ] Distinguish model target allocations from executable incremental trades. Show a sign-in action for account trading and preserve all dated/unavailable/zero-value states. Avoid describing every positive target as an unconditional instruction to buy more.
- [ ] Remove CSS for obsolete wrappers only within this component; avoid new nested-card layers, decorative confidence bars or global restyling. Keep existing test selectors where useful.
- [ ] Verify 320, 390, 768, 1024 and 1440 widths, signed-in/out states, no results, missing quotes, no sell candidates, populated sell candidates, zero suggested shares, keyboard focus and at least 200% zoom. Capture after screenshots for visual review alongside the supplied image.
- [ ] Rebuild/test, commit, then run the complete Edge/backend/Python regression gates. Update audit status and Graphify after implementation, not during this planning-only turn.

## Completion criteria and boundaries

No invalid sell looks executable; server enforcement remains authoritative and tested under concurrent requests. Quantities and capital are visible and consistent. Ticker/name/metric/date hierarchy is readable, empty columns do not waste space, and calculation status does not share the copilot's fixed corner. Each tested issue gets a separate commit on the existing fixes branch; no push, deployment, provider integration or external credential changes.

The successful oversell claim remains unconfirmed. If the user reproduces an actual holdings/cash mutation, collect the entry point, before/after holdings, submitted quantity and API status, without recording tokens or private connection strings, and elevate it to a ledger integrity issue.
