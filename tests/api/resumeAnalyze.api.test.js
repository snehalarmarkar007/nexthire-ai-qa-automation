const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../src/app');
const jobKeywords = require('../../test-data/job-keywords.json');

const strongResume = fs.readFileSync(
  path.join(__dirname, '../../test-data/resume_strong_match.txt'),
  'utf-8'
);

describe('GET /api/health', () => {
  test('TC-A01: returns 200 and service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/resume/analyze', () => {
  test('TC-A02: 200 — returns score for valid resume + keywords', async () => {
    const res = await request(app)
      .post('/api/resume/analyze')
      .send({ resumeText: strongResume, jobKeywords: jobKeywords.softwareEngineerRole });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('score');
    expect(res.body.score).toBeGreaterThanOrEqual(80);
  });

  test('TC-A03: 400 — empty resumeText', async () => {
    const res = await request(app)
      .post('/api/resume/analyze')
      .send({ resumeText: '', jobKeywords: jobKeywords.softwareEngineerRole });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/empty/i);
  });

  test('TC-A04: 400 — missing jobKeywords field entirely', async () => {
    const res = await request(app)
      .post('/api/resume/analyze')
      .send({ resumeText: strongResume });
    expect(res.status).toBe(400);
  });

  test('TC-A05: 400 — jobKeywords sent as a string instead of array', async () => {
    const res = await request(app)
      .post('/api/resume/analyze')
      .send({ resumeText: strongResume, jobKeywords: 'javascript' });
    expect(res.status).toBe(400);
  });

  test('TC-A06: 400 — malformed JSON body is rejected by Express', async () => {
    const res = await request(app)
      .post('/api/resume/analyze')
      .set('Content-Type', 'application/json')
      .send('{ this is not valid json ');
    expect(res.status).toBe(400);
  });

  test('TC-A07: response shape matches contract (score, matchedKeywords, missingKeywords, suggestions)', async () => {
    const res = await request(app)
      .post('/api/resume/analyze')
      .send({ resumeText: strongResume, jobKeywords: jobKeywords.softwareEngineerRole });
    expect(res.body).toEqual(
      expect.objectContaining({
        score: expect.any(Number),
        matchedKeywords: expect.any(Array),
        missingKeywords: expect.any(Array),
        suggestions: expect.any(Array),
      })
    );
  });
});
