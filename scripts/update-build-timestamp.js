import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const timestamp = new Date().toISOString();

// Get the current git commit ID (short version)
let commitId = 'unknown';
try {
  commitId = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
} catch (e) {
  console.warn('Could not get git commit ID:', e.message);
}

const content = `// This file is auto-generated during build
export const BUILD_TIMESTAMP = '${timestamp}';
export const BUILD_COMMIT = '${commitId}';
`;

const targetPath = join(__dirname, '../src/buildTimestamp.ts');
writeFileSync(targetPath, content, 'utf-8');

console.log(`Build timestamp updated: ${timestamp} (commit: ${commitId})`);
