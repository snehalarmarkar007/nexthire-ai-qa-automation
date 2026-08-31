/**
 * Core resume analysis logic for Next Hire AI.
 * This is a deterministic, testable re-implementation of the scoring
 * engine used by the production app (which normally calls out to an
 * LLM). Keeping the scoring logic pure and offline makes it possible
 * to unit test it without live API keys.
 */

const ALLOWED_FILE_TYPES = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function extractKeywords(text) {
  if (!text || typeof text !== 'string') return [];
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s+#.]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  )];
}

function scoreResume(resumeText, jobKeywords) {
  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error('EMPTY_RESUME');
  }
  if (!Array.isArray(jobKeywords) || jobKeywords.length === 0) {
    throw new Error('NO_JOB_KEYWORDS');
  }

  const resumeKeywords = extractKeywords(resumeText);
  const normalizedJobKeywords = jobKeywords.map((k) => k.toLowerCase());

  const matched = normalizedJobKeywords.filter((k) => resumeKeywords.includes(k));
  const missing = normalizedJobKeywords.filter((k) => !resumeKeywords.includes(k));

  const score = Math.round((matched.length / normalizedJobKeywords.length) * 100);

  return {
    score,
    matchedKeywords: matched,
    missingKeywords: missing,
    suggestions: missing.length > 0
      ? [`Consider adding experience or keywords related to: ${missing.join(', ')}`]
      : ['Strong keyword alignment with the job description.'],
  };
}

function validateFile(file) {
  if (!file) {
    return { valid: false, reason: 'NO_FILE' };
  }
  const ext = '.' + file.originalname.split('.').pop().toLowerCase();
  if (!ALLOWED_FILE_TYPES.includes(ext)) {
    return { valid: false, reason: 'UNSUPPORTED_FILE_TYPE' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: 'FILE_TOO_LARGE' };
  }
  if (file.size === 0) {
    return { valid: false, reason: 'EMPTY_FILE' };
  }
  return { valid: true };
}

function generateInterviewQuestions(jobRole, experienceLevel) {
  const roleBanks = {
    'software engineer': [
      'Explain the difference between REST and GraphQL.',
      'How would you design a rate limiter?',
      'Walk me through how you debug a memory leak.',
    ],
    'qa engineer': [
      'How do you decide what to automate vs test manually?',
      'Describe your approach to writing a test plan for a new feature.',
      'How do you handle flaky tests in a CI pipeline?',
    ],
    'data analyst': [
      'How would you handle missing data in a dataset?',
      'Explain a time you used SQL to solve a business problem.',
      'What is the difference between correlation and causation?',
    ],
  };

  const normalizedRole = (jobRole || '').toLowerCase().trim();
  if (!normalizedRole) {
    throw new Error('MISSING_JOB_ROLE');
  }

  const validLevels = ['entry', 'mid', 'senior'];
  const level = (experienceLevel || 'entry').toLowerCase();
  if (!validLevels.includes(level)) {
    throw new Error('INVALID_EXPERIENCE_LEVEL');
  }

  const questions = roleBanks[normalizedRole] || [
    `Tell me about a challenging project relevant to ${jobRole}.`,
    `What tools do you rely on most as a ${jobRole}?`,
    `How do you stay current in the ${jobRole} field?`,
  ];

  return { role: jobRole, level, questions };
}

module.exports = {
  extractKeywords,
  scoreResume,
  validateFile,
  generateInterviewQuestions,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
};
