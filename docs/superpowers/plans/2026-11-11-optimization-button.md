# Optimization Button Fix Plan

**Goal:** Clicking Optimize Portfolio submits selected ticker strings and renders the returned results.

**Diagnosis:** SelectionBar assigns onCalculate directly to onClick. App passes handleCalculate(customTickers = null) through StockSelector. React supplies a click event as customTickers, so the event becomes listToOptimize. Its undefined length bypasses the minimum-selection guard; api.js JSON.stringify then throws on the event's circular DOM references before fetch runs.

**Approach:** Change SelectionBar's button to `onClick={() => onCalculate()}`. This adapts the browser event at its source and preserves App's intentional custom-array interface. Adding event detection in App would hide the caller's mistake; removing customTickers would break the signals basket flow.

**Scope:** Modify website/src/components/StockSelector/SelectionBar.jsx; add website/tests/optimization.spec.js using installed @playwright/test. Read-only verification of StockSelector.jsx, App.jsx, api.js and the Node/Python optimization response. No new dependencies, backend changes, mobile layout work, or model changes.

**Browser:** Use Microsoft Edge (`channel: 'msedge'`) for all browser verification.

## Task 1: Regression and minimal fix

- [x] Add a Playwright regression against the local frontend with optimization API responses intercepted. Select AAPL, MSFT, NVDA, AMZN; click #calculate-btn; assert exactly one POST with tickers equal to those four strings, and that the response renders allocations and metrics without the circular-JSON error. Use the existing Python/Node response shape, read from Results components before defining the fixture.
- [x] Run the test before changing application code and confirm failure because no optimization POST occurs.
- [x] Replace `onClick={onCalculate}` with `onClick={() => onCalculate()}` on #calculate-btn in SelectionBar.jsx. Preserve disabled/loading behavior and all custom-basket callers.
- [x] Rerun the regression with Microsoft Edge; expect success.
- [x] Cover zero/one selection remaining disabled, Enter/Space button activation, and disabled state during a delayed response. Exercise the signals optimization button with both an existing selection and its eight-stock default basket; assert the corresponding ticker arrays. Check a failed API response displays an error and reenables the button.
- [x] Run `npm.cmd run build` from website; expect success.

## Task 2: Live integration verification

- [x] Test the changed frontend through local Vite or a rebuilt frontend container; the current production container serves previously compiled assets.
- [x] Use Edge to submit four stocks against the real backend; verify HTTP 200, finite metrics, nonnegative allocation weights summing approximately to one, and visible results. Record engine/cacheSource/cached fields so a JS fallback or cached result is not mistaken for proof of fresh Python inference.
- [x] Report tested flows and any distinct backend issues found. Do not broaden the button fix to change financial algorithms or unrelated UI behavior.

**Limits:** This fixes request dispatch. It does not establish model quality, data freshness, or the correctness of fallback financial calculations. Four-stock testing avoids conflating this defect with a potentially infeasible two-stock basket at a 35% maximum weight.

## Verification record

- Before fix: 4 regression failures; both existing signals paths passed.
- After fix and frontend container rebuild: all 6 Microsoft Edge tests passed (36.6s).
- Local Vite production build and Docker frontend build passed.
- Live Edge test: HTTP 200, engine python-pytorch-slsqp, cached=false, 4 allocation rows, weights sum approximately to 1, finite metrics, no page errors.
- Self-review: only the event adapter changes in product code; custom ticker callers and backend validation remain intact. Existing unrelated working-tree edits preserved.
