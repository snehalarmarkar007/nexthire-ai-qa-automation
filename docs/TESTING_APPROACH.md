# Testing Approach

## Why a mock layer instead of testing the real Next Hire AI repo directly
The production app calls out to Gemini Flash / LLaMA 3 / Mistral 7B via the OpenRouter API, which needs live API keys and returns non-deterministic text. Automated tests that depend on that would be flaky, slow, cost money per run, and couldn't reliably assert on exact output. So this suite isolates the **business logic that is deterministic and testable**:
- resume-to-keyword scoring math
- file validation rules
- interview question selection logic
- the fallback *control flow* between models (does it correctly try model 2 when model 1 fails? does it correctly give up after all three fail?)

The LLM call itself is stubbed (`callModel()` in `src/aiFallback.js`) so the *decision logic* around it is fully covered without needing a network or an API key. This mirrors how the same logic could be tested against the real repo: keep the scoring/validation functions pure and unit-testable, and mock only the network boundary.

## Test Pyramid Applied

```
        ▲
       /A\        3 suites, 18 API tests — HTTP contract, status codes, middleware
      /API \
     /------\
    /  Unit  \    2 suites, 27 unit tests — pure logic, fast, isolated
   /----------\
```

Unit tests form the base (fast, cheap, most of the count). API/integration tests sit above them, exercising Express routing and the Multer upload middleware end-to-end. No UI layer exists in this mock — in the real app, a thin layer of Playwright E2E tests would sit on top of this pyramid for the two or three critical user journeys (upload resume → see score, request interview questions).

## Tools & Rationale

| Tool | Why |
|---|---|
| **Jest** | Zero-config test runner + assertion library + coverage reporting in one dependency; standard for Node.js projects |
| **Supertest** | Lets HTTP endpoints be tested without actually binding a port — fast, and tests the real Express app instance |
| **Multer (memoryStorage)** | Matches how file uploads are typically handled in Express without touching disk during tests |

## Test Design Techniques Used
- **Equivalence partitioning** — valid resume vs. empty vs. whitespace-only; valid file types vs. unsupported types
- **Boundary value analysis** — file size exactly at, just under, and over the 5MB limit; zero-byte files
- **Negative testing** — malformed JSON, missing required fields, wrong data types (string where array expected)
- **State-based testing** — the fallback chain's behavior is verified across all reachable states (0, 1, 2, 3 models failing)
- **Contract testing** — response shape assertions (`expect.objectContaining`) so consumers of the API can rely on a stable shape

## What Would Change Testing the Real Repository
1. Point `src/app.js`'s equivalent (the real Express app) at a **test/staging** OpenRouter key with a low-cost model, or record/replay HTTP cassettes (e.g. `nock`) instead of a hand-written stub.
2. Add **contract tests** against the real Gemini/LLaMA/Mistral response shapes, since real API responses may include fields this mock doesn't model.
3. Add **auth/session tests** if the real app has login-gated routes (not present in this mock).
4. Add **Playwright E2E tests** for the actual frontend upload flow.
5. Add a **rate-limit / timeout simulation** test, since OpenRouter fallback in production is often triggered by timeouts, not just outright failures.

## CI Integration
`.github/workflows/test.yml` runs `npm test` on every push and pull request against Node 18.x and 20.x, so regressions are caught before merge. See that file for the matrix configuration.

## Known Gaps (documented, not hidden)
- Branch coverage on generic `500` error handlers in `app.js` is intentionally low — those paths require simulating internal errors (e.g. a thrown non-`Error` object) that don't occur under normal test conditions. Flagged in `TEST_PLAN.md` §9 as a follow-up rather than papered over with a forced/fake test.
