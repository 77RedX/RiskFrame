# Groq Copilot Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. The user authorized inline implementation on 2026-11-13. Complete the four trading/proposal UI issues first. Test and commit each independently reviewable step on fix/ui-account-corrections before moving on. Use Microsoft Edge for browser checks.

**Goal:** Replace the current keyword router with a conversational Groq copilot grounded in existing verified application tools, without giving the model account mutation powers.

**Architecture:** Keep the React chat UI, /api/agent/chat response shape, authenticated session ownership, Node tool execution and Python calculations. Groq requests run only in Node via the installed Axios client. A bounded tool loop sends validated tool results back to the model for explanations. No agent framework, extra database or provider SDK is required for the initial version.

**Dependency:** 2026-11-13-trading-and-proposal-ui-followup.md, Tasks 1-4. This is a separate feature phase on the same roadmap, not part of a layout or quantity fix.

## Configuration

The user has a Groq API key. Store the real key only as GROQ_API_KEY in ignored server/.env. Do not paste it into chat, VITE variables, source, Dockerfiles or tracked examples. The server reads both values; server/.env.example keeps the key blank and documents the initial model.

Initial selection: openai/gpt-oss-20b, verified against current official tool-use documentation and the user account model listing on 2026-11-13. The previously blank local GROQ_MODEL was filled without changing the private key. Check current official model capabilities and account limits then; do not hardcode an unverified or retired model ID. For Render, add these variables to the Node backend service only, or an environment group linked only to that service. For Compose, --env-file supplies interpolation values but does not automatically inject every variable: both Compose files now forward these values only to Node.

References: https://console.groq.com/docs/tool-use/local-tool-calling and https://console.groq.com/docs/api-reference .

## Step 1 - Backend provider configuration and failure behavior

**Touch:** server/src/services/agent.service.js, an adjacent provider module only if needed to keep the tool loop readable, server/.env.example, docker-compose.yml, docker-compose.dev.yml, README.md, focused Node tests.

- [ ] Add a failing provider-request regression using mocked Axios; prove requests never come from the browser and secrets are absent from returned errors/logs.
- [ ] Read GROQ_API_KEY/GROQ_MODEL on the server and forward them only to the backend in both Compose files. Keep the rest of the application usable when Groq is unconfigured; return a clear unavailable response for chat instead of silently presenting canned output as AI.
- [ ] Call Groq's supported chat/tool API with a finite timeout and output-token limit. Start without streaming; preserve the current {reply, toolCalls, sessionId} response contract.
- [ ] Handle missing/invalid configuration, provider authentication failures, 429 and timeout/unavailable responses without printing Authorization headers or raw Axios request configuration. No unbounded retries or paid fallback provider.
- [ ] Test the request/error boundary, verify resolved Compose variable ownership with fixtures, and commit.

## Step 2 - Restricted validated tool calling

**Touch:** agent.service.js, existing quant.service.js functions, validated tool schemas using installed Zod, focused Node tests.

- [ ] Expose only optimization, supported tickers/verified historical prices, risk calculations, and consented reads of owned saved strategies. Reuse existing functions. Do not expose savePortfolio, trades, deposits, account deletion or arbitrary URLs/queries.
- [ ] The backend injects authenticated user identity and preferences; model arguments cannot choose user IDs or another account's session. Validate tool name, JSON arguments, tickers, numeric ranges and feasible constraints before execution.
- [ ] Keep numeric calculations in Python/existing deterministic services. Risk analysis should consume results from a trusted calculation, not model-invented metrics. Preserve source, dates, settings, zero values and unavailable states in tool results.
- [ ] Bound the loop (initial maximum 3 model rounds and 4 tool executions per user message, with one finite overall deadline). Limit tool payload sizes and reject malformed/unknown tool calls. Do not enable web search, code execution or remote MCP for this version.
- [ ] Test correct tool selection and dispatch, invalid JSON, unknown tools, unsupported tickers, range/feasibility failures, model-provided user IDs, mutation attempts, repeated calls and loop limits. Run backend gates and commit.

## Step 3 - Owned multi-turn context and privacy boundary

**Touch:** agent.routes.js, AgentSession.js only if storage changes are necessary, API/chat UI consent handling, focused account/session tests.

- [ ] Load owned bounded history before the provider call. Preserve the current 40-message storage cap and enforce a separate prompt size budget. Avoid resending unlimited full allocation/price results each turn; retain only the context needed for follow-ups.
- [ ] Reconstruct provider-compatible assistant/tool messages correctly or summarize trusted application outputs with their provenance; validate client input separately. Never treat stored/user/tool text as privileged system instructions.
- [ ] Keep guest history bounded and avoid server persistence without an authenticated owner. Discard in-flight replies on logout/account changes; never share history between users.
- [ ] Public market analysis is the default. Before sending saved private strategy data to Groq, show a clear disclosure and require explicit per-account/session permission; enforce it server-side and reset on identity change. Do not send passwords, tokens, connection strings or unnecessary profile identifiers.
- [ ] Test multi-turn ticker/risk follow-ups, history limits, session ownership, invalid/expired tokens, logout during a request, user switches and private-data requests without permission. Commit after passing gates.

## Step 4 - Copilot UX and grounded explanations

**Touch:** AgentCopilot.jsx/.css, website/src/api.js, focused Edge tests.

- [ ] Replace command-only instructions once real provider integration works. Explain available capabilities and dated data, show pending/unavailable/retry states, and retain safe rendering.
- [ ] Explain actual tool outputs without inventing prices, execution, model confidence or portfolio performance. Clearly distinguish model forecasts, historical observations and hypothetical sizing. The AI cannot override portfolio validation or execute account mutations.
- [ ] Keep tool/source details inspectable without filling the drawer with raw JSON. Reuse existing responsive UI; do not reopen the fixed-notice/copilot collision issue.
- [ ] Test conversational follow-ups, actual tool chips/results, unknown prompts, malformed provider output, raw HTML, 429/timeouts, missing key, retry, keyboard/mobile interaction and account isolation. Rebuild affected services and commit.

## Step 5 - Final integration gate and documentation

- [ ] Run backend/Python/Edge suites and Docker builds; verify no secrets reach frontend assets, responses, logs or Git.
- [ ] Run one limited live smoke test with the configured model/key after mocked tests pass. Start with public data; use an isolated account only for consented owned-data checks, then delete that test data. Check provider usage/latency without recording credentials.
- [ ] Verify a real optimizer result is accurately explained, a follow-up uses the same context, and unavailable tools do not become fabricated successes. Record the selected model and limitations.
- [ ] Update templates, README, audit status and Graphify. Commit the verified feature work; do not push or deploy automatically.

## Completion criteria and exclusions

The copilot understands follow-up requests, obtains its figures from validated tools, keeps histories owned/bounded, handles provider failures, and cannot mutate account state. Groq receives only the authorized conversation/tool context; keys remain server-only. The existing application continues working if Groq is absent.

Excluded from this initial phase: autonomous trading, strategy writes, browser automation, web search, remote MCP, streaming, model training, multi-agent orchestration, Render provisioning and external credential rotation. Costs/rate limits/model choice must be checked with the user's current Groq account before a live run; no availability or free-tier guarantee is implied.

## Execution ledger

- Step 1 complete: added bounded Axios provider requests, parsed assistant responses, safe unavailable/rate-limit/incomplete errors, and backend-only Compose forwarding. New provider regression failed before implementation; backend 23/23 passed afterward. Fixture configuration checks proved key ownership. Groq account model listing confirmed openai/gpt-oss-20b; filled the blank local GROQ_MODEL only, preserving the private key. No inference call yet. No new dependency.
- Step 2 complete: four new regressions failed against keyword routing, then passed with validated Groq tool orchestration. Only public market/calculation tools and permission-gated owned strategy reads are offered; no mutation tools. Three model rounds/four tool executions, 45s deadline, request/result size limits, verified-risk context, exact ticker/constraint checks and safe route errors are enforced. All 23 backend tests passed; obsolete keyword tests were replaced with provider/tool-loop regressions. No live inference yet.
- Step 3 complete: history/privacy regressions failed before changes. Owned history is loaded before requests and reduced to a 16k-character context budget; guest text never supplies trusted tool state. Explicit portfolio-context consent resets the UI session and is enforced by stored permission/version metadata; legacy sessions cannot silently send earlier private results. Added bounded 10/min per-client and one-in-flight limits (per process; shared Redis required before horizontal scaling), optimistic session saves and safe guest history schemas. Backend 25/25 and Edge account/copilot 7/7 passed after rebuilding Node/frontend.
- Step 4 complete: failing Edge regression reproduced missing Groq status/retry/source inspection. UI now identifies Groq, offers explicit retry/new conversation, excludes failed replies from history, bounds browser requests, and shows human-readable tool/source details including zero metrics/settings. Full Edge 42/42 and backend 25/25 passed after frontend rebuild. No live inference yet.
- Final review fix: an isolated regression reproduced a stalled Mongo read exceeding its 20ms test deadline (253ms completion). Passed the overall signal into the owned query and added a 5s server query limit; regression now cancels promptly. Full backend 26/26 passed. No other important defects were found by the independent reviewer.

- Step 5 live verification: openai/gpt-oss-20b called the actual Python optimizer for AAPL/MSFT/NVDA (35% cap, 4% risk-free), explained the returned Sharpe 0.665 and market date 2026-11-11, and answered an owned follow-up without rerunning optimization. Explicit permission read exactly one isolated fixture strategy; changing permission within the existing session returned 400. All fixture portfolios/sessions and the test account were deleted. Live user-request latency in this smoke test was approximately 0.8-1.6 seconds, not a performance guarantee. Real Edge guest chat/follow-up and 1440/390/320 drawer checks also passed; chat bodies contained no provider key.
- Final presentation check corrected Windows-encoded question marks in copilot controls/separators. One initial live conceptual answer confused systematic and unsystematic risk; clarified that distinction in system guidance. A subsequent real Edge answer correctly distinguished them. Generated prose remains fallible; the tools/source panel is the numerical source of truth, and this smoke test is not a model-quality benchmark. Backend 26/26 and focused Edge 11/11 passed after the change.
