const fs = require('fs');
const path = require('path');
const {
  extractKeywords,
  scoreResume,
  validateFile,
  generateInterviewQuestions,
} = require('../../src/resumeAnalyzer');
const jobKeywords = require('../../test-data/job-keywords.json');

const strongResume = fs.readFileSync(
  path.join(__dirname, '../../test-data/resume_strong_match.txt'),
  'utf-8'
);
const weakResume = fs.readFileSync(
  path.join(__dirname, '../../test-data/resume_weak_match.txt'),
  'utf-8'
);

describe('extractKeywords()', () => {
  test('TC-U01: extracts lowercase unique keywords from text', () => {
    const result = extractKeywords('Node.js Node.js React');
    expect(result).toContain('node.js');
    expect(result).toContain('react');
    expect(result.filter((k) => k === 'node.js')).toHaveLength(1); // deduped
  });

  test('TC-U02: returns empty array for null/undefined input', () => {
    expect(extractKeywords(null)).toEqual([]);
    expect(extractKeywords(undefined)).toEqual([]);
  });

  test('TC-U03: filters out words shorter than 3 characters', () => {
    const result = extractKeywords('a an at go to react');
    expect(result).not.toContain('a');
    expect(result).not.toContain('at');
    expect(result).toContain('react');
  });
});

describe('scoreResume()', () => {
  test('TC-U04: strong-match resume scores highly against relevant keywords', () => {
    const result = scoreResume(strongResume, jobKeywords.softwareEngineerRole);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.missingKeywords.length).toBeLessThanOrEqual(1);
  });

  test('TC-U05: weak-match resume scores low against unrelated keywords', () => {
    const result = scoreResume(weakResume, jobKeywords.softwareEngineerRole);
    expect(result.score).toBeLessThan(30);
  });

  test('TC-U06: throws EMPTY_RESUME on empty string', () => {
    expect(() => scoreResume('', jobKeywords.softwareEngineerRole)).toThrow('EMPTY_RESUME');
  });

  test('TC-U07: throws EMPTY_RESUME on whitespace-only string', () => {
    expect(() => scoreResume('   \n  ', jobKeywords.softwareEngineerRole)).toThrow('EMPTY_RESUME');
  });

  test('TC-U08: throws NO_JOB_KEYWORDS when keyword list is empty', () => {
    expect(() => scoreResume(strongResume, [])).toThrow('NO_JOB_KEYWORDS');
  });

  test('TC-U09: throws NO_JOB_KEYWORDS when keywords is not an array', () => {
    expect(() => scoreResume(strongResume, 'javascript')).toThrow('NO_JOB_KEYWORDS');
  });

  test('TC-U10: score is 100 when every keyword matches', () => {
    const result = scoreResume('python python python', ['python']);
    expect(result.score).toBe(100);
    expect(result.missingKeywords).toEqual([]);
  });

  test('TC-U11: score is 0 when no keyword matches', () => {
    const result = scoreResume('cooking baking recipes', ['python', 'sql']);
    expect(result.score).toBe(0);
  });
});

describe('validateFile()', () => {
  test('TC-U12: accepts a valid .pdf file within size limit', () => {
    const file = { originalname: 'resume.pdf', size: 1024 };
    expect(validateFile(file)).toEqual({ valid: true });
  });

  test('TC-U13: accepts .docx and .txt extensions', () => {
    expect(validateFile({ originalname: 'r.docx', size: 100 }).valid).toBe(true);
    expect(validateFile({ originalname: 'r.txt', size: 100 }).valid).toBe(true);
  });

  test('TC-U14: rejects unsupported file type', () => {
    const file = { originalname: 'resume.exe', size: 1024 };
    expect(validateFile(file)).toEqual({ valid: false, reason: 'UNSUPPORTED_FILE_TYPE' });
  });

  test('TC-U15: rejects file over 5MB', () => {
    const file = { originalname: 'resume.pdf', size: 6 * 1024 * 1024 };
    expect(validateFile(file)).toEqual({ valid: false, reason: 'FILE_TOO_LARGE' });
  });

  test('TC-U16: rejects zero-byte file', () => {
    const file = { originalname: 'resume.pdf', size: 0 };
    expect(validateFile(file)).toEqual({ valid: false, reason: 'EMPTY_FILE' });
  });

  test('TC-U17: rejects when no file provided', () => {
    expect(validateFile(null)).toEqual({ valid: false, reason: 'NO_FILE' });
  });

  test('TC-U18: is case-insensitive on file extension', () => {
    const file = { originalname: 'resume.PDF', size: 1024 };
    expect(validateFile(file).valid).toBe(true);
  });
});

describe('generateInterviewQuestions()', () => {
  test('TC-U19: returns known question bank for a recognized role', () => {
    const result = generateInterviewQuestions('QA Engineer', 'mid');
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.level).toBe('mid');
  });

  test('TC-U20: falls back to generic questions for an unknown role', () => {
    const result = generateInterviewQuestions('Blockchain Architect', 'senior');
    expect(result.questions[0]).toMatch(/Blockchain Architect/);
  });

  test('TC-U21: defaults experienceLevel to "entry" when omitted', () => {
    const result = generateInterviewQuestions('QA Engineer');
    expect(result.level).toBe('entry');
  });

  test('TC-U22: throws MISSING_JOB_ROLE when role is blank', () => {
    expect(() => generateInterviewQuestions('', 'entry')).toThrow('MISSING_JOB_ROLE');
  });

  test('TC-U23: throws INVALID_EXPERIENCE_LEVEL on bad value', () => {
    expect(() => generateInterviewQuestions('QA Engineer', 'expert')).toThrow('INVALID_EXPERIENCE_LEVEL');
  });
});
