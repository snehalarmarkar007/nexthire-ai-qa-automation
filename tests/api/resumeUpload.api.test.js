const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../../src/app');

const dataDir = path.join(__dirname, '../../test-data');
const oversizedPath = path.join(dataDir, 'resume_oversized.txt');

beforeAll(() => {
  // Ensure the oversized fixture exists (generated once, ~6MB)
  if (!fs.existsSync(oversizedPath)) {
    require(path.join(dataDir, 'generate-large-file.js'));
  }
});

describe('POST /api/resume/upload', () => {
  test('TC-A08: 200 — accepts a valid .txt resume', async () => {
    const res = await request(app)
      .post('/api/resume/upload')
      .attach('resume', path.join(dataDir, 'resume_strong_match.txt'));
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('resume_strong_match.txt');
  });

  test('TC-A09: 400 — no file attached', async () => {
    const res = await request(app).post('/api/resume/upload');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('NO_FILE');
  });

  test('TC-A10: 415 — unsupported file type (.exe)', async () => {
    const tmpFile = path.join(dataDir, 'malicious.exe');
    fs.writeFileSync(tmpFile, 'fake binary content');
    const res = await request(app)
      .post('/api/resume/upload')
      .attach('resume', tmpFile);
    expect(res.status).toBe(415);
    expect(res.body.error).toBe('UNSUPPORTED_FILE_TYPE');
    fs.unlinkSync(tmpFile);
  });

  test('TC-A11: 400 — zero-byte file rejected', async () => {
    const res = await request(app)
      .post('/api/resume/upload')
      .attach('resume', path.join(dataDir, 'resume_empty.txt'));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('EMPTY_FILE');
  });

  test('TC-A12: 413 — file over 5MB rejected', async () => {
    const res = await request(app)
      .post('/api/resume/upload')
      .attach('resume', oversizedPath);
    expect(res.status).toBe(413);
    expect(res.body.error).toBe('FILE_TOO_LARGE');
  }, 15000);
});

afterAll(() => {
  if (fs.existsSync(oversizedPath)) fs.unlinkSync(oversizedPath);
});
