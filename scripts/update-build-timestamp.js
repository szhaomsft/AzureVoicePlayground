import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const timestamp = new Date().toISOString();
const content = `// This file is auto-generated during build
export const BUILD_TIMESTAMP = '${timestamp}';
`;

const targetPath = join(__dirname, '../src/buildTimestamp.ts');
writeFileSync(targetPath, content, 'utf-8');

console.log(`Build timestamp updated: ${timestamp}`);
