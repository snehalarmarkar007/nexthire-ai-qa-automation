# Test Execution Report — Next Hire AI QA Automation

**Project:** Next Hire AI — Resume Analyzer & Interview Coaching Platform (mock layer)
**Framework:** Jest + Supertest
**Executed on:** Node.js v22.22.2
**Run command:** `npm test`

## Summary

| Metric | Result |
|---|---|
| Test Suites | 5 passed / 5 total |
| Test Cases | 45 passed / 45 total |
| Failures | 0 |
| Execution Time | ~1.05s |
| Statement Coverage | 95.14% |
| Branch Coverage | 83.33% |
| Function Coverage | 94.11% |
| Line Coverage | 95.91% |

## Coverage by Module

| File | Stmts | Branch | Funcs | Lines | Uncovered Lines |
|---|---|---|---|---|---|
| `aiFallback.js` | 100% | 50% | 100% | 100% | 15, 26 (unreached catch-log branches) |
| `app.js` | 89.13% | 61.11% | 83.33% | 91.11% | 26, 56, 73–74 (generic 500 error handlers) |
| `resumeAnalyzer.js` | 100% | 100% | 100% | 100% | — |

**Note:** the uncovered lines in `app.js` and `aiFallback.js` are unreachable-in-normal-testing generic `500` error handlers — flagged as a known gap in [TEST_PLAN.md](../docs/TEST_PLAN.md) rather than hidden.

## Suite Breakdown

### Unit — `tests/unit/resumeAnalyzer.test.js` (23 tests, all passed)
Covers `extractKeywords()`, `scoreResume()`, `validateFile()`, `generateInterviewQuestions()` — keyword extraction, scoring math, file validation boundary conditions, and interview-question generation across valid, boundary, and invalid inputs.

### Unit — `tests/unit/aiFallback.test.js` (4 tests, all passed)
Verifies the Gemini Flash → LLaMA 3 → Mistral 7B fallback chain: happy path, single fallback, double fallback, and total-outage error path.

### API — `tests/api/resumeAnalyze.api.test.js` (6 tests, all passed)
`POST /api/resume/analyze` — valid scoring, empty resume, missing/malformed `jobKeywords`, malformed JSON body, response contract shape.

### API — `tests/api/resumeUpload.api.test.js` (5 tests, all passed)
`POST /api/resume/upload` — valid `.txt` upload, no file, unsupported extension (`.exe`), zero-byte file, oversized (>5MB) file.

### API — `tests/api/interviewAndAI.api.test.js` (6 tests, all passed)
`POST /api/interview/questions` and `POST /api/ai/generate` — valid question generation, missing role, invalid experience level, and all three AI-fallback scenarios via HTTP.

## Full Console Output
See [`test-run-console.log`](./test-run-console.log) for the raw Jest run captured from this execution.

## Defects Found
None in this run — all 45 cases passed on the mock reference implementation. See `docs/TESTING_APPROACH.md` for how this suite would be pointed at the real Next Hire AI service and what additional defect classes (auth, rate-limiting, actual LLM timeout behavior) it would then need to cover.
