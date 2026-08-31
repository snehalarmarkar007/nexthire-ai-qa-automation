# Test Plan — Next Hire AI QA Automation Case Study

## 1. Objective
Validate the core functional correctness of the Next Hire AI resume-analyzer and interview-coaching platform: resume scoring logic, file upload validation, interview question generation, and the multi-model AI fallback strategy (Gemini Flash → LLaMA 3 → Mistral 7B).

## 2. Scope

**In scope:**
- Resume-to-job-description keyword scoring engine
- Resume file upload validation (type, size, presence)
- Interview question generation by role and experience level
- AI provider fallback control flow
- REST API contract (status codes, response shape) for all endpoints above

**Out of scope:**
- Actual LLM output quality/relevance (non-deterministic, requires human/LLM-graded eval, not unit assertions)
- Frontend UI automation (no UI in this mock layer — would use Playwright against the real React/EJS frontend)
- Load/performance testing
- Real OpenRouter API integration (mocked here to keep the suite deterministic and free of API-key dependencies)

## 3. Test Strategy
Two layers, run independently or together:
- **Unit tests** — pure functions in isolation (`resumeAnalyzer.js`, `aiFallback.js`), no HTTP layer, fastest feedback.
- **API/integration tests** — full request/response cycle through Express via Supertest, exercising routing, middleware (Multer upload, JSON body parsing), and status-code contracts.

See `docs/TESTING_APPROACH.md` for tooling rationale.

## 4. Entry Criteria
- Node.js ≥ 18 installed
- `npm install` completed without errors
- Mock server code (`src/`) present and unmodified during test execution

## 5. Exit Criteria
- 100% of authored test cases executed
- No unaddressed critical/high-severity defect
- Statement coverage ≥ 90% on business logic modules (`resumeAnalyzer.js`, `aiFallback.js`)

## 6. Test Environment
- Node.js v22.x (tested), compatible with v18+
- Jest 29.x test runner, Supertest 7.x for HTTP assertions
- No external network calls — fully offline/deterministic

## 7. Test Case Summary

| ID Range | Area | Count | File |
|---|---|---|---|
| TC-U01–U11 | Keyword extraction & scoring | 11 | `tests/unit/resumeAnalyzer.test.js` |
| TC-U12–U18 | File validation | 7 | `tests/unit/resumeAnalyzer.test.js` |
| TC-U19–U23 | Interview question generation | 5 | `tests/unit/resumeAnalyzer.test.js` |
| TC-U24–U27 | AI fallback chain (unit) | 4 | `tests/unit/aiFallback.test.js` |
| TC-A01 | Health check | 1 | `tests/api/resumeAnalyze.api.test.js` |
| TC-A02–A07 | `/api/resume/analyze` | 6 | `tests/api/resumeAnalyze.api.test.js` |
| TC-A08–A12 | `/api/resume/upload` | 5 | `tests/api/resumeUpload.api.test.js` |
| TC-A13–A15 | `/api/interview/questions` | 3 | `tests/api/interviewAndAI.api.test.js` |
| TC-A16–A18 | `/api/ai/generate` (fallback via HTTP) | 3 | `tests/api/interviewAndAI.api.test.js` |
| **Total** | | **45** | |

## 8. Representative Test Cases (Design)

| TC ID | Title | Preconditions | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-U06 | Empty resume text rejected | None | Call `scoreResume('', [...keywords])` | Throws `EMPTY_RESUME` | High |
| TC-U15 | File over 5MB rejected | File object with `size > 5MB` | Call `validateFile(file)` | Returns `{valid: false, reason: 'FILE_TOO_LARGE'}` | High |
| TC-A06 | Malformed JSON body | Server running | POST invalid JSON to `/api/resume/analyze` | HTTP 400 | High |
| TC-A12 | Oversized upload via HTTP | 6MB dummy file generated | POST file to `/api/resume/upload` | HTTP 413, `error: FILE_TOO_LARGE` | High |
| TC-A18 | All AI models down | `forceFail` includes all 3 models | POST `/api/ai/generate` | HTTP 503, `attempts` array length 3 | Medium |
| TC-U20 | Unknown job role falls back to generic questions | Role not in question bank | Call `generateInterviewQuestions('Blockchain Architect', 'senior')` | Generic questions referencing the role name | Low |

Full case list with pass/fail status: see `reports/TEST_EXECUTION_REPORT.md`.

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Real LLM responses are non-deterministic, hard to assert on | High | Medium | Test the fallback *control flow* deterministically (this suite); evaluate real LLM output quality via a separate human/LLM-graded rubric, not hard assertions |
| Multer memory storage differs from disk storage used in production | Low | Low | Document the difference; add a disk-storage integration test before merging to the real repo |
| File-size/type validation logic drifts from production if duplicated | Medium | Medium | Treat `resumeAnalyzer.js` as the single source of truth; import it directly rather than re-implementing in tests |
| No auth layer tested | Medium | High (for real deployment) | Out of scope for this case study; flagged as a follow-up in `TESTING_APPROACH.md` |

## 10. Deliverables
- This test plan
- Automated test suite (`tests/`)
- Test data fixtures (`test-data/`)
- Test execution report (`reports/TEST_EXECUTION_REPORT.md`)
- Testing approach documentation (`docs/TESTING_APPROACH.md`)
- CI workflow (`.github/workflows/test.yml`)
