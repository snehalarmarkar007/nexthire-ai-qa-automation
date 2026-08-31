# Next Hire AI — QA Automation Case Study

Automated test suite for **Next Hire AI**, an AI-powered resume analyzer and interview coaching platform. This repo implements a QA automation case study: test plan, automated scripts, test data, execution reports, and testing methodology documentation.

> The service layer under test (`src/`) is a deterministic, offline mock of the core logic from the production app — resume-to-job-description scoring, file validation, interview question generation, and the Gemini Flash → LLaMA 3 → Mistral 7B fallback chain — so the suite runs without live API keys or network access. See [`docs/TESTING_APPROACH.md`](docs/TESTING_APPROACH.md) for why, and what changes when pointed at the real service.

## Project Structure

```
nexthire-ai-qa-automation/
├── src/                      # App under test (mock resume-analyzer service)
│   ├── app.js                 # Express server + routes
│   ├── resumeAnalyzer.js      # Scoring, file validation, question generation
│   └── aiFallback.js          # Multi-model AI fallback logic
├── tests/
│   ├── unit/                  # Pure logic unit tests (Jest)
│   └── api/                   # HTTP integration tests (Supertest)
├── test-data/                 # Sample resumes, job keywords, fixture generator
├── reports/                   # Test execution report + raw console log
├── docs/
│   ├── TEST_PLAN.md            # Scope, strategy, case design, risk assessment
│   └── TESTING_APPROACH.md     # Methodology, tooling rationale, pyramid
└── .github/workflows/test.yml  # CI: runs the suite on every push/PR
```

## Setup

**Prerequisites:** Node.js ≥ 18

```bash
git clone <this-repo-url>
cd nexthire-ai-qa-automation
npm install
```

## Running the Tests

```bash
npm test              # full suite with coverage
npm run test:unit     # unit tests only
npm run test:api      # API/integration tests only
```

Optionally run the mock server standalone to explore the endpoints manually:

```bash
npm start              # starts on http://localhost:3000
curl http://localhost:3000/api/health
```

## Results (last run)

| Metric | Value |
|---|---|
| Test Suites | 5/5 passed |
| Tests | 45/45 passed |
| Statement Coverage | 95.14% |
| Branch Coverage | 83.33% |

Full report: [`reports/TEST_EXECUTION_REPORT.md`](reports/TEST_EXECUTION_REPORT.md)

## What's Tested

| Area | Endpoint / Module | Cases |
|---|---|---|
| Resume scoring | `POST /api/resume/analyze` | Valid scoring, empty input, malformed keywords, malformed JSON, response contract |
| File upload | `POST /api/resume/upload` | Valid `.txt/.pdf/.docx`, no file, unsupported type, zero-byte, >5MB |
| Interview questions | `POST /api/interview/questions` | Known role, unknown role fallback, missing role, invalid experience level |
| AI model fallback | `POST /api/ai/generate` | Primary success, single fallback, double fallback, total outage |

Each test case is numbered (`TC-U01`…, `TC-A01`…) and cross-referenced in [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) §7–8.

## CI

Every push/PR runs the full suite on Node 18.x and 20.x via GitHub Actions — see [`.github/workflows/test.yml`](.github/workflows/test.yml).

## Documentation

- [Test Plan](docs/TEST_PLAN.md) — scope, entry/exit criteria, case design, risk assessment
- [Testing Approach](docs/TESTING_APPROACH.md) — methodology, tool choices, test pyramid, known gaps
- [Test Execution Report](reports/TEST_EXECUTION_REPORT.md) — latest run results and coverage
