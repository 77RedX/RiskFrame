# Groq integration verification - 2026-11-13

## Implemented behavior

- Groq replaces keyword routing in the Node backend; the existing Python engine remains responsible for optimizer numbers.
- Optional GROQ_API_KEY and GROQ_MODEL are backend-only. Initial model openai/gpt-oss-20b was verified against official tool-use documentation and the account's model listing. Only the previously blank local model setting was filled; the real API key was preserved and not committed.
- Tool names/arguments are validated. Only supported-market reads, verified optimization/risk and permission-gated owned strategy reads are available. The model has no trade, deposit, strategy-save, account-delete, arbitrary database or arbitrary URL tool.
- Three model rounds/four tool executions, a 45-second overall provider/tool deadline, per-call HTTP limits, output/result/history size caps and cancellable Mongo reads constrain work. Per-client ten/minute and one-in-flight limits are per Node process.
- Owned sessions load before generation; guest history is bounded text without trusted tool authority. Stored context is capped and summarized with provenance. Session ownership/version/permission checks precede tools. Legacy command sessions start fresh. Private strategy context requires sign-in and explicit permission, and changing permission starts a new conversation.
- UI provides Groq disclosure, explicit retry, New, safe formatted text and inspectable numerical sources. Logout/account switches discard messages, permission and pending replies.

## Verified gates

- Full Microsoft Edge suite: 42 passed; final copilot/proposal/layout focused gate: 11 passed after display/prompt corrections.
- Full backend suite: 26 passed, including cancellation, tool refusal, ownership, permission changes, legacy sessions, bounded history, rate limits and error redaction.
- Python suite: 6 passed. Frontend and all Docker images built successfully; the running backend includes the cancellation fix.
- Independent final review found one important deadline defect; the failing test completed at 253ms against its 20ms deadline before the fix, then cancelled promptly afterward. No other important findings were confirmed in scope.
- Actual private key absent from 147 tracked text files and served frontend assets. Real env files are untracked; backend image contains no .env. Both Compose files forward Groq settings only to Node. A real signal-enabled Atlas read succeeded after the cancellation change.

## Limited live checks

1. Groq invoked the real Python optimizer for AAPL/MSFT/NVDA with maximum weight 35% and risk-free rate 4%. Tool output: Sharpe 0.665347, expected return 0.210583 and volatility 0.256382, market data as of 2026-11-11. Its generated explanation reported rounded figures, actual allocations/date and engine/settings.
2. An owned follow-up named the same three assets and explained concentration without rerunning optimization.
3. Enabling private context within the old session was rejected with HTTP 400. A new explicitly permitted session read exactly one isolated fixture strategy belonging to its owner. Test portfolios, chats and account were deleted afterward.
4. Real Edge guest chat and follow-up sent two prior text messages, with no provider key in browser request bodies. Drawer controls fit at 1440/390/320 widths. Screenshot: 2026-11-13-groq-copilot-live-390.png.
5. An initial conceptual answer confused systematic with unsystematic risk. System guidance was clarified; the next live check correctly distinguished them. This is not a model-quality guarantee; generated prose remains fallible and the source panel exposes the actual numerical outputs.

Live user-request latency in the isolated optimization/history/strategy smoke test was about 0.8-1.6 seconds. This is a small smoke test, not a latency, cost, or model benchmark. Provider account limits and usage charges remain applicable.

## Remaining boundaries

No push, production deployment, real broker integration, external secret rotation, streaming, web search or remote MCP was performed. Render service topology/proxy/CORS and frontend Docker API build arguments remain separate deployment work. Share rate-limit state through Redis before adding Node replicas. Source-document semantic graph labels remain cached when Graphify is refreshed without an external LLM.

References checked: https://console.groq.com/docs/tool-use/overview ; https://console.groq.com/docs/models ; https://console.groq.com/docs/api-reference .
