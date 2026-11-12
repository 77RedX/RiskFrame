# RiskFrame UI and Account Corrections Implementation Plan

> **For agentic workers:** Execute task by task with superpowers:executing-plans. This document is a proposed plan, not implementation authorization. Use Microsoft Edge for all Playwright checks.

**Goal:** Make ownership, calculations, persistence, and UI feedback truthful; remove implicit demo accounts; correct the audited interaction and accessibility failures.

**Architecture:** Keep the existing React, Express/Mongoose, Python and Redis layers. MongoDB owns authenticated account state; React displays confirmed state. Public analytics remain available without authentication, while personal holdings and simulated account mutations require an authenticated account. Reuse current services and installed dependencies.

**Spec:** User request on 2026-11-12; `docs/audits/2026-11-11-ui-audit.md`; findings and working behavior from `2026-11-11-optimization-button.md`.

**Status:** Planning only. No product changes, Docker startup, data migration, or database operations are included in this planning pass. Product decisions below are recommendations for review.

## Exact diagnosis of the signed-out portfolio

1. `website/src/App.jsx:37` initializes holdings with `loadUserHoldings('guest')` and cash with `loadCashBalance('guest')`, before authentication completes.
2. `website/src/data/marketSignals.js:144` returns the five-stock `DEFAULT_DEMO_HOLDINGS` when guest storage is absent, corrupt, or an empty array. Cash defaults to $24,500. The NVDA fixture has 35 shares.
3. App renders MyPortfolio and passes the holdings count to Navbar unconditionally. Neither component is gated on authentication. Guest buy/sell/deposit/reset handlers can modify browser storage without a login. The protected server routes are not what produces this initial guest portfolio.
4. `server/src/models/User.js` also defaults new accounts to those five holdings and $24,500. `GET /api/auth/me` in `auth.routes.js` writes demo holdings into an account whenever its holdings are empty. Thus authentication alone does not remove the invented portfolio, and selling everything can be undone on the next profile read.
5. Account state and simulated guest state are scoped by local-storage keys, but there is no visible demo distinction. The evidence does not show another person's server portfolio being returned anonymously; the misleading guest content comes from browser defaults/storage.

### What 35 means

- **35%:** `preferences.maxAssetWeight` defaults to 0.35 in User.js and AuthModal.jsx; Python also hardcodes a 0.35 optimization cap. This is a configured concentration limit, not a personal holding or earned return.
- **35 shares:** NVDA's seeded quantity, unrelated to the percentage limit.
- **0 / 35 equities:** stock selector count/maximum, unrelated to both above.
- The holdings table's Weight column computes each holding's share of total equity value. It has no universal 35% default. Without the exact original screen, do not assert which of these the user saw.

## Product decisions proposed for this correction

- Signed out: show public stock selection, optimization and historical data. Personal portfolio area shows “Sign in to view your portfolio”; no holding count, balances, P&L, personal sell advice, or trade/deposit/reset controls. Do not create a new demo mode.
- Authentication pending: show an account loading state; never briefly display guest or another account's holdings. Distinguish an expired login from temporary server/network failure.
- New signed-in account: holdings `[]`, simulated cash 0, trade history `[]`. Users add explicitly labelled simulated funds. No automatic real-money deposit or brokerage connection.
- Existing accounts: preserve all existing holdings/cash/trades. Seeded rows cannot reliably be distinguished from user edits; do not wipe matching data automatically. Remove future reseeding rather than invent a destructive migration.
- Ignore legacy guest ledger data for authenticated ownership; never silently import it. Preserve it on disk during rollout instead of deleting unrelated browser/account data.
- Public optimization defaults remain 35% maximum asset weight and 4% annual risk-free rate, visibly labelled as calculation settings. Provide per-run controls using the existing parameters so a visitor can request a feasible two-stock allocation. Saved account preferences supply initial settings after login, with explicit per-run overrides taking precedence.
- All portfolio transactions remain paper trading and say so. Historical closing prices are not live executable quotes. Missing market data is unavailable, not synthesized.
- No new dependencies unless a concrete accessibility/formatting requirement cannot be met safely with the installed stack. A Groq provider is a separately reviewable final phase, not a prerequisite for these fixes.

## Review focus and checks required throughout

- Never destroy existing account data or conflate an empty array/zero cash/zero weight with missing data.
- Server authentication and ownership checks must hold even if frontend controls are bypassed.
- Test account switch/logout/expired tokens during requests so late responses cannot restore the previous account's state.
- Distinguish invalid calculation inputs, unavailable upstream services, and database failures. Do not turn these into successful synthetic results.
- Keep the already-fixed optimization event adapter and emoji cleanup. Update tests expecting guest demo assets rather than restoring the bug to satisfy fixtures.

## Task 1 — Remove implicit guest portfolios and account reseeding

**Modify:** `website/src/App.jsx`, `website/src/data/marketSignals.js`, `website/src/components/MyPortfolio/MyPortfolio.jsx`, `website/src/components/Navbar.jsx`, `website/src/components/OptimalSignals/OptimalSignals.jsx`, `website/src/api.js`, `server/src/models/User.js`, `server/src/routes/auth.routes.js`. Cover reset/deposit/trade callers and their fixtures.

- [ ] Add regressions: clean signed-out storage displays no personal holdings/cash/actions; old guest storage does not appear as a personal account; authentication pending does not flash demo assets.
- [ ] Introduce explicit authentication pending/signed-out/signed-in state in App. Clear account presentation on logout; ignore stale profile responses after account change. Do not call the profile endpoint without a token just to obtain an expected 401.
- [ ] Initialize personal UI state empty. Gate portfolio rendering and action handlers, holdings badges, and holding-specific signals on the authenticated user. The signed-out prompt must actually open the existing auth modal.
- [ ] Change new-user holdings/cash defaults to empty/zero. Make GET /me a read-only profile read; remove demo insertion. Preserve existing records and genuine zero values. Remove or stop calling unused demo/local ledger helpers once all callers have moved.
- [ ] Remove “Reset Portfolio” as a demo reseed action from normal account UI; do not replace it with an unsolicited destructive clear-account action.
- [ ] Verify new account, existing account, valid empty account, sell-last-holding, reload, login/logout, account switch, expired token and transient profile failure. Protected API mutations without authentication must return 401.

## Task 2 — Make simulated ledger changes validated and persistence-aware

**Modify:** App.jsx trade/deposit handlers, api.js, `Trading/TradeModal.jsx`, `MyPortfolio/MyPortfolio.jsx`, User.js, auth.routes.js. **Tests:** extend `server/test/` and add `website/tests/portfolio.spec.js`.

- [ ] Add failing tests for database/network failure, insufficient cash/shares, negative/nonfinite amounts, unsupported tickers, double submission and conflicting updates.
- [ ] Replace client-submitted authoritative holdings/cash/totals on the existing PUT /api/auth/portfolio with a validated operation contract: `{ operation: 'deposit', amount }` or `{ operation: 'buy'|'sell', ticker, shares }`. Update every App/api.js caller in the same change. Server derives identity from authentication and loads its own existing ledger.
- [ ] Compute simulated execution prices from verified latest closing-price data; return the quote date/source. Reject unavailable/stale quotes rather than using reference/hash prices. Use integer cents for cash/order arithmetic and finite positive integer share validation. Never accept a client-supplied execution total.
- [ ] Save a single consistent User document with optimistic concurrency enabled; reject version conflicts with 409 and require a refresh, rather than overwriting another update. Avoid automatic retries of ambiguous completed financial mutations. Disable repeat submit while pending.
- [ ] Await persistence before committing visible state or closing the dialog. Return server-confirmed holdings/cash/trades and update App from that response. On failure retain the entered operation, show an actionable error and preserve confirmed balances. Remove side effects inside React state-updater callbacks.
- [ ] Fix deposit input to minimum $100, cent increments (`step=0.01`), matching backend validation and every existing preset. Test presets and valid custom cents; reject negative, NaN and infinite values.
- [ ] Verify failure/retry, reload consistency, final-holding sale, and concurrent requests using isolated test accounts/databases; do not use the user's real ledger as a fixture.

## Task 3 — Correct optimization parameters, responses and cache behavior

**Modify:** `app.py`, `optimizer.py`, `main.py` if impacted by optimizer signatures, `server/src/services/quant.service.js`, `server/src/routes/optimize.routes.js`, `server/src/services/cache.service.js`, api.js, App.jsx, StockSelector/SelectionBar, AuthModal, Results components. **Tests:** Python unittest coverage for parameter handling, server tests, existing Edge optimization tests.

- [ ] Pin regressions: five assets with max weight 0.20 never exceed it; zero risk-free rate remains zero; changes in risk-free rate affect Sharpe consistently; nonfinite/invalid/duplicate/unknown tickers are rejected; all valid weights sum approximately to one. Preserve existing CLI/training optimizer callers.
- [ ] Define one precedence: explicit per-run settings, authenticated saved preferences, documented public defaults. Replace truthy numeric fallbacks with presence checks so 0 is not discarded. Normalize/validate the 2–35 unique supported tickers and settings at API trust boundaries.
- [ ] Python must consume validated max_weight and risk_free_rate in solver and returned Sharpe, not hardcoded constants. Reject infeasible `assetCount * maxWeight < 1` with a clear validation message; remove silent constraint relaxation. Check solver success and finite/bounded output.
- [ ] Provide labelled per-run max-weight and risk-free-rate controls; show a feasibility message such as needing at least three stocks at 35%. Preserve the ability to analyze two stocks after choosing a feasible cap. Fix metric descriptions that always claim a 4% rate; return/display actual applied settings.
- [ ] Remove automatic synthetic-return JS optimization as a production success fallback. When Python is unavailable, return a service-unavailable result and show it honestly. Keep a fallback only if it uses verified equivalent inputs and is explicitly identified; do not silently fabricate returns/covariance.
- [ ] Use an exact canonical validated-settings representation for cache keys; current three-decimal rounding can collide for distinct rates. Version the optimization cache namespace after changed solver semantics. Do not flush unrelated Redis data.
- [ ] Expose engine, applied settings, calculation time, market data as-of and cache status through the response and Results UI. Cache hits must retain the original data/calculation timestamps, not claim a fresh solve.

## Task 4 — Synchronize results, signals and account preferences

**Modify:** App.jsx, `OptimalSignals/OptimalSignals.jsx`, `data/marketSignals.js`, `MyPortfolio/MyPortfolio.jsx`, `UserAuth/AuthModal.jsx`, Results components.

- [ ] Add regressions for zero model allocation/alpha, no result, out-of-basket stocks, selection edits during a request, failed request/toast, and login followed by opening preferences.
- [ ] Build buy candidates from the actual result basket and positive allocations; do not merge in hardcoded candidates, alpha, conviction or model-written-looking rationales. Preserve explicit zeros. Missing allocation means “not analyzed”, not a sell or 20% buy recommendation.
- [ ] Compute holding advice only for authenticated holdings actually analyzed. Clearly distinguish suggested research allocation from an owned position, and a 21-day prediction from an annualized value.
- [ ] Invalidate results when selected tickers or effective calculation settings change. Snapshot request inputs and ignore obsolete responses so changing selection mid-request cannot restore stale results. Keep actual holdings separate from optimization proposals.
- [ ] Remove the signals success timer. Derive loading/error/success from the actual optimization promise; success notifications occur only after successful application of the matching response.
- [ ] Initialize preference form fields from the current user when the editor opens/account changes. Cancel discards unsaved edits; save failures keep them visible. Validate preferences on the server rather than copying a loose allowlist; remove or clearly label risk-tolerance controls if they have no defined computational effect.
- [ ] Run click, Enter/Space, 0/1/35 selection, default signals basket, account preference changes, delayed response, failure and retry checks in Edge.

## Task 5 — Replace invented quotes with attributable historical data

**Modify:** marketSignals.js, MyPortfolio, OptimalSignals, Trading/TradeModal, PriceHistory/PriceChart, quant.service.js, cache.service.js and optimize.routes.js price handling.

- [ ] Stop using `BASE_MARKET_PRICES`, ticker-hash daily changes, and synthetic 15-day price history as real application data. Verify fallback failures do not return invented dates/prices or enter normal caches.
- [ ] Reuse the verified historical-price service for the latest close/previous close and as-of date. Show “Latest available close” rather than “Live”; show unavailable state when no verified quote exists. Display daily change only when two valid dated closes are available.
- [ ] Label account balances/deposits/trades as simulated throughout. Remove language implying Groww/Zerodha broker integration or actual market execution; no broker integration is part of this plan.
- [ ] Avoid serial per-holding refetches in rendering: reuse existing cached price requests, fetch each distinct ticker once per screen refresh, and show per-ticker failure without replacing the whole ledger.
- [ ] Test a weekend/holiday, missing price, upstream failure, known zero change, source/as-of labels and agreement between portfolio valuation, chart and simulated order quote.

## Task 6 — Secure copilot rendering and correct existing account/tool behavior

**Modify:** `AgentCopilot/AgentCopilot.jsx`, agent.service.js, agent.routes.js, Portfolio.js conversion callers where needed, and server/website tests.

- [ ] Replace raw HTML insertion with safe React rendering. The minimum implementation may display plain text with preserved line breaks; never use regex formatting that leaves raw HTML executable. If preserving Markdown, use a renderer/sanitizer with explicit safe behavior and tests, not a custom partial sanitizer.
- [ ] Test raw HTML/event attributes, malicious assistant output, ordinary text and Markdown. The prior harmless injection marker must not execute.
- [ ] Clear account-specific messages/session IDs on logout or user switch and discard stale replies. Load history only for the authenticated session owner and apply bounded history before generating the next reply.
- [ ] Fix saved-portfolio intent being swallowed by the broad “portfolio” branch. Use the full supported ticker universe, canonical snake_case optimizer metrics in tools, and an explicit adapter to Portfolio's camelCase storage fields. Preserve engine/data provenance through tool results; correct risk assessment's sharpeRatio/sharpe_ratio mismatch.
- [ ] Until a real provider is integrated, stop claiming autonomous AI or unsupported conversational capabilities. Do not expand the keyword router into another hand-built language system.
- [ ] Test list-my-portfolios, anonymous personal-data requests, metrics/risk output, unsupported tickers, session ownership and account switching. Preserve response shape `{reply, toolCalls, sessionId}` for the frontend.

## Task 7 — Repair responsive layout and accessibility

**Modify:** App.css, MyPortfolio.css, TradeModal.css, AuthModal.css, AgentCopilot.css and corresponding components; Navbar; StockSelector/StockCard and FilterTabs; forms and chart markup.

- [ ] Fix horizontal document overflow by wrapping/shrinking controls, not by globally clipping the page. Keep wide data tables scrollable inside their wrappers. Verify 320, 390, 768, 1024 and 1440 widths with empty, loading, success and error states.
- [ ] Constrain trade/auth/deposit dialogs to viewport height with an internal scroll area. Establish a consistent overlay order above navbar/copilot; keep close/submit reachable at 390 x 667 and 320 x 568, landscape and browser zoom. Lock background scrolling while a modal is open.
- [ ] Give modal dialogs names/roles/aria-modal, focus entry/trapping/restoration and Escape dismissal. Reuse a minimal accessible dialog behavior across the three modal types; do not duplicate subtly different implementations. Pending irreversible submissions must not be dismissed in a way that falsely implies cancellation.
- [ ] Associate labels with inputs; name icon-only controls. Expose stock selection as actual toggle buttons within list items; preserve Enter/Space behavior. Complete sector-tab keyboard behavior or use simpler filter buttons with appropriate state. Provide a textual/table equivalent for chart data and announce asynchronous errors/results.
- [ ] Verify keyboard-only flows, focus cannot escape dialogs, mobile menu dismissal, readable forms at zoom, table scrolling and no copilot overlap of primary controls.

## Task 8 — Make loading, readiness and environment setup honest

**Modify:** LoadingScreen.jsx, api.js, server/src/index.js, middleware/auth.middleware.js, config/db.js, docker-compose.yml, docker-compose.dev.yml, `.dockerignore` files, `.env.example` templates, README. Render configuration is a separate deployment deliverable below.

- [ ] Remove the forced four-second startup display. Allow early retry/cancel feedback; clean up retry polling on unmount and prevent duplicate polling loops. Use timeouts and cancellation for network requests instead of waiting indefinitely.
- [ ] Report MongoDB connectivity in readiness. Separate liveness from database/quant readiness so browsing is not hidden by a single unhealthy subsystem. Surface unavailable account/quant capabilities accurately. Do not return a generic “ok” while registration cannot reach the database.
- [ ] Distinguish invalid credentials/token errors (401) from database outages (503); current auth middleware masks database exceptions as invalid tokens. Keep private account data inaccessible in either case.
- [ ] Disable silent switching from Atlas to a separate local or memory database in production; it can make the same account appear missing or split writes across databases. Make development fallback explicit and visible. Keep persistent data when changing configuration.
- [ ] Require a configured production JWT_SECRET; remove committed fallback secrets. Make Compose fail clearly on missing required variables; pass configured JWT_EXPIRES_IN and HF settings to their owning services. DATABASE_URL belongs to Python, MONGODB_URI to Node.
- [ ] Verify all build contexts exclude `.env`/variants at every depth while examples remain committable. Restrict MongoDB host port publication; prefer internal-only production access and localhost-bound development access. Apply the internal-only Redis decision below to both Compose files. Preserve existing user edits and working quant DNS configuration.
- [ ] Maintain secret-free templates plus ownership instructions, including `docker compose --env-file server/.env ...`. Do not rotate credentials, edit Atlas network rules, or publish anything as part of a UI correction without a separate request.
- [ ] Check backend startup without optional Redis, database unavailable, quant unavailable, JWT missing and recovery. Never log full database/Redis URIs containing credentials.

### Redis decision — local to the backend, internal Docker access only

Configuration inspection on 2026-11-12: both Compose files hardcode `REDIS_URL=redis://redis:6379`, referring to their own Redis container. Neither local .env file defines REDIS_URL. Direct Node startup defaults to `redis://127.0.0.1:6379`. No managed Redis endpoint is currently configured. This is configuration inspection, not a live test; Docker remains stopped.

User decision: keep Redis alongside the backend; do not migrate to Redis Cloud. In a deployed Compose stack, Redis runs on the deployment server alongside Node, not on the developer's laptop.

- [ ] Remove the Redis service's entire `ports` entry (`6379:6379`) from both docker-compose.yml and docker-compose.dev.yml. Do not replace it with a localhost mapping; the approved default has no host-published Redis port.
- [ ] Retain the Redis service, backend dependency, `REDIS_URL=redis://redis:6379`, and existing production redis_data volume. Docker service networking supplies backend access without host port publication. Never delete the existing volume during this change.
- [ ] Verify Compose's resolved configuration has no Redis host-port binding. After authorization to restart Docker, verify backend Redis connectivity, PING, SETEX/GET, TTL behavior, application cache hits and fallback reporting. No additional `expose` entry or cloud dependency is necessary.
- [ ] Document that Node running directly on the host cannot use this internal Docker endpoint. A future request for mixed host/container development needs a deliberate local-only access arrangement; do not silently reopen the port.
- [ ] Keep credential-bearing Redis URLs out of logs even though the current internal Redis service has no configured credentials. Hosted Redis setup is deferred and is not part of implementation scope.

## Task 9 — Optional Groq integration, after the corrections above

This records the previously discussed direction; provider integration still needs a separately reviewed implementation plan, selected model and configured credentials. Do not combine it with UI fixes or purchase/deploy services automatically.

- [ ] Keep Groq calls in Node; `GROQ_API_KEY` never enters VITE variables, browser code, Git, or tool outputs. Use the existing HTTP client unless a concrete SDK feature justifies a dependency.
- [ ] Replace keyword routing with a bounded tool-calling loop using explicit validated schemas and owned, bounded history. The server supplies user identity; model arguments cannot select another user. Limit message sizes, tool rounds, timeouts and response tokens; handle rate limits/provider errors.
- [ ] Start with optimization, verified historical prices, risk analysis, and reading owned portfolios. Do not expose trades, cash mutation or account deletion as autonomous tools. Saved strategy writes require an explicit user action and server ownership/validation.
- [ ] Explain numbers supplied by tools without inventing prices or performance, and disclose timestamps/fallbacks. Do not put private portfolio data into a provider request without the product making that use clear.
- [ ] Test tool selection, invalid arguments, unknown tools, loop limits, 429/timeouts, multi-turn context, prompt-injection attempts, and no unauthorized writes before a live provider smoke test.

## Task 10 — Final verification, documentation and deployment preparation

- [ ] Add focused regressions before each behavior change; update existing optimization fixtures for new explicit guest/account behavior. Keep a task ledger in this document: test command, failure before change, passing result after change and any deviations.
- [ ] Run Python/backend tests relevant to changed logic, frontend build and Edge regression suite. Mock external services for deterministic failure tests; clearly separate these from live checks.
- [ ] With separate authorization to resume Docker, rebuild only changed services and verify live public analysis and owned test-account persistence. Test account switching, full liquidation/reload, no synthetic data on upstream failure, real applied constraints, HTML safety and responsive dialogs.
- [ ] Update the audit with fixed/open items and refresh Graphify after source changes. Do not describe stale graph output as current.
- [ ] Before any Render deployment, replace the Python-only render.yaml with a reviewed multi-service configuration or equivalent documented service setup. Configure secrets per owning service; verify frontend build-time API URL, Node-to-Python address, deployed Redis address, CORS, readiness and frontend Docker build-variable behavior. Docker Compose is not automatically deployed by Render. No deployment is requested now.

## Completion criteria

A signed-out visitor sees no personal holdings, balance, P&L or portfolio count. New accounts are empty and existing data is preserved. Explicitly empty portfolios remain empty. Confirmed operations survive reload, failures do not masquerade as success, optimization respects the displayed settings, all prices/results identify source and time, copilot content cannot execute HTML, and keyboard/mobile users can reach every required control. The original optimization-button fix and emoji-free application output remain intact.

## Implementation ledger

- Issue 1 (implicit guest/demo portfolios): complete. Backend regressions failed before the fix and passed afterward (2/2); Microsoft Edge account and existing optimization suite passed (9/9, 36.3s). Frontend/backend images rebuilt; existing account data was not migrated or deleted.

- Issue 2 (copilot HTML injection): complete. Edge regression reproduced executable message HTML before the fix; encoding text before the existing fixed formatting transformations now passes user/assistant injection checks. All 10 Edge tests passed (36.3s); committed as f82b9f9.

- Issue 3 (deposit presets): complete; regression failed on the old step, passed after cent increments. All 11 Edge tests passed (36.0s); committed as 190f4f7.

- Issue 4 (internal-only Redis): both resolved Compose configurations have no Redis published port; backend PING/SETEX/GET/TTL and readiness passed; all 11 Edge tests passed (36.2s); committed as 2d4c10c.
- Issue 5 (forced loading delay/retry cleanup): regression failed before change; all 13 Edge tests passed after rebuild (10.7s). Ruling: move this small issue ahead of the remaining UI work to shorten each subsequent regression cycle.

- Issue 6 (saved preferences): account regression reproduced defaults after login; all 14 Edge tests passed; committed as e94562b.
- Issue 7 (false optimization notification): failure regression reproduced the false success toast; all 15 Edge tests passed; committed as fe48977.
- Issue 8 (stale selection/results): both existing-result and in-flight-response regressions pass; all 17 Edge tests passed; committed as 77b3f56.
- Issue 9 (optimization settings): 5 Python, 6 backend and all 18 Edge tests passed. Live uncached Python response honored a 20% cap and a zero risk-free rate. Synthetic optimization fallback removed; exact cache settings versioned. Committed as 62c19b7.

- Issue 10 (zero model values): all 19 Edge tests passed; committed as 7d63097.
- Issue 11 (mobile dialog fit/stacking): initial CSS-only attempt failed the actual close-button click. Dialogs were moved to body portals; all 20 Edge tests then passed. Committed as 3b3d2f8.
- Issue 12 (horizontal overflow): traced actual overflowing controls and footer; all 21 Edge tests passed at tested widths. Committed as 3420e26.
- Issue 13 (accessibility): shared dialog focus behavior, labelled controls, native selection buttons and chart text alternatives; all 22 Edge tests passed. Committed as 1d9815c.
- Issue 14 (fabricated prices/signals): removed synthetic price fallback, reference prices and predefined signal scores/rationales; added dated quote loading and unavailable states. All 24 Edge and 7 backend tests passed. Committed as 097d019.
- Issue 15 (ledger persistence/validation): IN PROGRESS, NOT COMMITTED. Frontend failed-save regressions and server client-authored-balance regression failed before the fix. Current checks: 27/27 Edge tests, 10/10 backend tests, 5/5 Python tests pass; Docker frontend/backend builds pass. Live isolated-account verification is BLOCKED before account creation: Atlas connection fails with ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR on all three nodes from the backend container as well as from the host. Backend startup logs confirm it used the separate local MongoDB fallback. No real test account was created. Restore Atlas access and rerun the live test before committing this issue or moving to another issue, per user instructions.
- Git workflow: all verified fixes are on fix/ui-account-corrections as separate commits. Existing environment/setup edits remain unstaged. No branch was pushed. Groq/provider integration and Render deployment remain deferred as specified above.

- Issue 15 live verification RESOLVED: Atlas ping passed from the backend container after access was restored. Restarted only Node to exit its prior local fallback. Temporary-account test passed against Atlas: empty registration, cent-exact deposit, paper buy/sell, empty-profile reload, oversell rejection, and concurrent updates. Verified the resulting account state directly in Atlas and deleted only the temporary account (deletedCount=1). Existing accounts were untouched.

## Paused work - resume after quota reset

User requested pausing implementation on 2026-11-12. MongoDB connection and ping passed from the backend container. Ledger persistence was verified against Atlas and committed (3a31810); readiness (f9747be), required private JWT (db93f7b), and saved-portfolio routing (2352151) are also committed.

Remaining: fix the copilot risk tool canonical metric mismatch (the new regression in server/test/agent.test.js is intentionally pending and expected to fail); isolate chat sessions and stale replies across accounts; validate owned bounded history; use the supported ticker universe; adapt saved metrics and preserve provenance; correct unsupported AI claims. Finish environment documentation/templates and credential logging checks, update audit status and Graphify, then run final backend/Python/Edge/build verification. Continue one issue at a time, test before moving on, commit each tested fix on fix/ui-account-corrections, and use Microsoft Edge. Groq integration and Render deployment remain deferred.

## Review follow-up - five reported findings (2026-11-12)

Checked against current branch HEAD 5b74879. No implementation changes made. Existing one-issue/test/commit workflow remains in force when implementation resumes.

- [x] **High: committed production JWT secret - fixed in current source, historical exposure remains conditional.** docker-compose.yml:48 now requires `${JWT_SECRET:?JWT_SECRET must be set}`; config/auth.js has no public default. This was fixed in db93f7b. A literal signing secret existed in earlier tracked Compose revisions. If any deployed service still uses that old value, replace it with a fresh private secret and invalidate existing tokens; inspect actual deployment configuration before calling exposure resolved. Do not restore a hardcoded default. No live secret inspection, credential rotation, or history rewriting was performed.
- [ ] **Medium: documented development startup omits required JWT_SECRET - confirmed.** docker-compose.dev.yml:5 and README.md:370 document a command without --env-file, but Compose requires JWT_SECRET. server/.env is not automatically used for Compose interpolation. Document generation of a private JWT_SECRET and `docker compose --env-file server/.env -f docker-compose.dev.yml up`; also correct README.md:362 production startup to use the explicit env file. Verify config parsing without a key fails clearly and the documented command succeeds with a temporary non-secret fixture. Keep secrets mandatory.
- [ ] **Medium: Compose advertises an ignored MongoDB fallback - configuration mismatch confirmed.** docker-compose.yml:43 supplies MONGODB_FALLBACK_URI, while config/db.js intentionally uses only MONGODB_URI; database.test.js explicitly guards against silent datastore switching. Remove obsolete fallback configuration and document explicit Atlas versus Docker-local selection (`mongodb://mongo:27017/riskframe` inside Compose). Make the required primary URI fail clearly when missing. Preserve data/volumes; do not reinstate automatic fallback. Verify configured primary selection and outage readiness behavior.
- [ ] **Medium: future-dated closing prices can fund paper trades - reproduced.** ledger.service.js:29 accepts ages down to minus one day. With the clock fixed to 2026-11-12 noon UTC, a quote dated 2026-11-13 was accepted and reduced cash from 100 to 90. Reject future UTC calendar dates, retain valid current/past dates within the agreed freshness window, and verify buy/sell failures leave cash, holdings and trades unchanged. Add deterministic clock-boundary tests, including tomorrow just after UTC midnight and the stale cutoff.
- [ ] **Low: malformed range separators in validation text - confirmed.** website/src/App.jsx:168 contains literal `5?100%` and `0?100%`. Replace with clear `5 to 100%` / `0 to 100%` wording and verify invalid-input output. Results.jsx:63 also contains question marks between provenance fields; review those as part of the same text cleanup. This is actual file content, not merely PowerShell display encoding.

Verification performed: inspected both Compose files, README startup instructions, JWT/database configuration, ledger validation and its callers/tests; ran a standalone in-memory future-quote reproduction. No database writes or Docker restarts. Production/Render environment values and deployed signing keys were not checked. Three medium findings and one low finding remain actionable; the high finding is already fixed in current source, with historical-key retirement requiring deployment verification.

- 2026-11-13 quote freshness: regression reproduced tomorrow being accepted; changed the lower age bound to zero. Ledger/account/auth/API checks: 11/11 passed, including UTC midnight/end-of-day, stale dates, current dates, and unchanged buy/sell state on rejection. Docker verification pending availability.
- Quote fix integration gate: rebuilt and started Compose; container ledger tests 3/3 and Edge portfolio/market-data tests 6/6 passed. Future-date finding resolved.
- 2026-11-13 startup documentation: reproduced missing-key failure; documented private key generation and explicit --env-file for both Compose commands, including dev header. Both commands parse with a temporary fixture. No signing key was changed.
- 2026-11-13 MongoDB configuration: removed obsolete fallback variable and made primary URI mandatory. Documented Atlas versus Docker-local selection. Database/readiness tests 2/2 passed; fixture Compose checks reject missing URI and preserve each explicit selection. No silent fallback restored.
- 2026-11-13 copilot risk metrics: pending regression failed on camelCase lookup, passed after using canonical sharpe_ratio. Full backend suite 16/16 passed.
- 2026-11-13 malformed range messaging: Edge regression reproduced literal question marks; replaced ranges with plain words and provenance separators with pipes. Frontend rebuilt; all 12 optimization Edge tests passed.
