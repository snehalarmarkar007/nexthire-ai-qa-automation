const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/interview/questions', () => {
  test('TC-A13: 200 — returns questions for a known role', async () => {
    const res = await request(app)
      .post('/api/interview/questions')
      .send({ jobRole: 'QA Engineer', experienceLevel: 'mid' });
    expect(res.status).toBe(200);
    expect(res.body.questions.length).toBeGreaterThan(0);
  });

  test('TC-A14: 400 — missing jobRole', async () => {
    const res = await request(app)
      .post('/api/interview/questions')
      .send({ experienceLevel: 'mid' });
    expect(res.status).toBe(400);
  });

  test('TC-A15: 400 — invalid experienceLevel value', async () => {
    const res = await request(app)
      .post('/api/interview/questions')
      .send({ jobRole: 'QA Engineer', experienceLevel: 'guru' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/ai/generate (multi-model fallback)', () => {
  test('TC-A16: 200 — primary model (gemini-flash) responds normally', async () => {
    const res = await request(app).post('/api/ai/generate').send({ forceFail: [] });
    expect(res.status).toBe(200);
    expect(res.body.model).toBe('gemini-flash');
  });

  test('TC-A17: 200 — falls back to llama-3 when gemini-flash is down', async () => {
    const res = await request(app).post('/api/ai/generate').send({ forceFail: ['gemini-flash'] });
    expect(res.status).toBe(200);
    expect(res.body.model).toBe('llama-3');
  });

  test('TC-A18: 503 — all three models unavailable', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .send({ forceFail: ['gemini-flash', 'llama-3', 'mistral-7b'] });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('ALL_MODELS_UNAVAILABLE');
    expect(res.body.attempts).toHaveLength(3);
  });
});
