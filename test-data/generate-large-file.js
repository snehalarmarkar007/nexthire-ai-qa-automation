/**
 * Generates a >5MB dummy .txt file used by tests to verify the
 * "file too large" rejection path. Run once: node generate-large-file.js
 */
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, 'resume_oversized.txt');
const chunk = 'A'.repeat(1024); // 1KB
const stream = fs.createWriteStream(outPath);
for (let i = 0; i < 6 * 1024; i++) { // ~6MB
  stream.write(chunk);
}
stream.end(() => console.log('Created', outPath));
