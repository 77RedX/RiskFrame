# High - malformed optimization responses accepted and cached

Verified 2026-11-13 on the current fixes branch after 0e1df77. Application behavior was not changed during verification.

## Evidence

- server/src/services/quant.service.js checks only truthiness of response.data.allocation and response.data.metrics, then assigns engine=python-pytorch-slsqp.
- Mocked sidecar payloads accepted by the real helper: (1) empty allocation/metrics objects; (2) negative weights and invalid/string/null metric fields; (3) an unknown ticker with a total weight of only 0.1.
- Isolated Express route reproduction using the real optimization route and cache service: first malformed response returned HTTP 200, cached=false. The sidecar mock was then changed to throw. The identical request still returned HTTP 200, cached=true, cacheSource=memory, metrics={}; only one sidecar call occurred.
- Microsoft Edge with an intercepted malformed result showed the successful results panel with metric values NaN%, NaN%, and an em dash. No quant-engine-unavailable message appeared.
- cache.service.js uses a 24-hour default optimization TTL, and optimize.routes.js returns cache hits without validating their contents. Both Redis and memory paths accept parsed cached objects without schema checks; the route/cache-hit reproduction used only isolated process-local memory.

## Required correction

Validate the complete optimization result in the shared quant service before any caller can return, explain, save or cache it. Require finite numeric expected_return, volatility and sharpe_ratio; volatility must not be negative. Preserve legitimate zero/negative return and Sharpe values. Require a nonempty plain allocation object with keys matching the requested supported basket, finite nonnegative weights, the requested cap within an explicit numeric tolerance, and an approximately unit total. Reject missing metrics, arrays, strings, null/nonfinite values, unknown/missing symbols and invalid totals.

Invalid upstream results should produce the existing unavailable/error path and never enter either cache. Protect cache reads as well, or version the optimization namespace so previously cached malformed records are not served after deployment. Do not flush unrelated Redis keys or delete data volumes. Validate optional prediction/individual-metric fields if present and consumed by the UI; avoid silently coercing strings or replacing invalid numbers with zeros.

Tests should cover each malformed case, legitimate zero/negative metrics, floating-point tolerance, valid result caching, rejection without a cache write, bad pre-existing cache entries, and frontend error display without NaN or a success notice. Check the shared helper callers: optimization/signals routes, saved-strategy rebalancing and Groq tools. Update fixtures to valid numerical contracts rather than weakening validation.

## Limits

No live Python failure or production-cache corruption was asserted. Server reproduction mocked Axios and used an ephemeral local Express process and memory cache; browser requests were intercepted. No production Redis writes, account changes, Docker restart or Groq inference calls occurred. This verifies a response-boundary defect, not a claim that the normal Python engine currently emits malformed data.


## Correction verified - 2026-11-13

The shared quant boundary and both optimization cache paths now use the same strict numeric/basket validator. Metrics must be finite, volatility nonnegative, allocation keys must exactly match the requested basket, weights must be nonnegative and no greater than the requested cap plus 1e-6, and their sum must be within 1e-5 of one. The Python engine remains responsible for checking the requested symbols against its supported universe; Node rejects any substituted/missing result symbol. Model predictions are required for every symbol because the results table consumes them unconditionally; optional individual metrics must be complete and finite when supplied. No string coercion or synthetic zero replacement occurs. Valid negative returns/Sharpe and zeros remain accepted.

Optimization keys are now rf:opt:v3, so old v2 records are bypassed and expire normally. Redis and memory reads validate again; invalid records become misses. Writes validate before touching either cache or its set counter. No Redis flush, database changes or volume deletion occurred.

Regression tests first failed against the original service/cache/HTTP route, then passed after the fix. All 30 backend tests pass, including simulated Redis malformed JSON, malformed payloads, valid writes/hits, memory corruption, repeated HTTP 503 without caching, and valid HTTP caching. Existing copilot/rebalance fixtures now supply the real response contract. All 43 Edge tests pass. The new Edge regression routes a browser request through the real Node route with only the sidecar mocked: malformed data shows the unavailable error without results/NaN; retry with valid data renders four rows. A rebuilt local Docker backend accepted a real three-symbol Python result with weights summing to 0.9999999999999994, then returned an identical Redis hit. Production deployment was not changed.
