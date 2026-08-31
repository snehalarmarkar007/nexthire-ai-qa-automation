const express = require('express');
const multer = require('multer');
const { scoreResume, validateFile, generateInterviewQuestions } = require('./resumeAnalyzer');
const { getAIResponseWithFallback } = require('./aiFallback');

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'nexthire-ai-mock' });
});

app.post('/api/resume/analyze', (req, res) => {
  const { resumeText, jobKeywords } = req.body;
  try {
    const result = scoreResume(resumeText, jobKeywords);
    res.status(200).json(result);
  } catch (err) {
    if (err.message === 'EMPTY_RESUME') {
      return res.status(400).json({ error: 'Resume text must not be empty.' });
    }
    if (err.message === 'NO_JOB_KEYWORDS') {
      return res.status(400).json({ error: 'jobKeywords must be a non-empty array.' });
    }
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/resume/upload', upload.single('resume'), (req, res) => {
  const result = validateFile(req.file);
  if (!result.valid) {
    const statusMap = {
      NO_FILE: 400,
      UNSUPPORTED_FILE_TYPE: 415,
      FILE_TOO_LARGE: 413,
      EMPTY_FILE: 400,
    };
    return res.status(statusMap[result.reason] || 400).json({ error: result.reason });
  }
  res.status(200).json({ message: 'File accepted', filename: req.file.originalname });
});

app.post('/api/interview/questions', (req, res) => {
  const { jobRole, experienceLevel } = req.body;
  try {
    const result = generateInterviewQuestions(jobRole, experienceLevel);
    res.status(200).json(result);
  } catch (err) {
    if (err.message === 'MISSING_JOB_ROLE') {
      return res.status(400).json({ error: 'jobRole is required.' });
    }
    if (err.message === 'INVALID_EXPERIENCE_LEVEL') {
      return res.status(400).json({ error: 'experienceLevel must be entry, mid, or senior.' });
    }
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/ai/generate', async (req, res) => {
  const forceFail = req.body.forceFail || [];
  try {
    const result = await getAIResponseWithFallback(forceFail);
    res.status(200).json(result);
  } catch (err) {
    res.status(503).json({ error: 'ALL_MODELS_UNAVAILABLE', attempts: err.attempts });
  }
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Next Hire AI mock server running on port ${PORT}`));
}
