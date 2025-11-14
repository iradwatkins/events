#!/usr/bin/env node

/**
 * Safely remove console.log statements from production code
 * Preserves console.error, console.warn, and all statements in test files
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

// Patterns to find files (exclude test files)
const patterns = [
  'convex/**/*.ts',
  '!convex/**/*.spec.ts',
  '!convex/**/*.test.ts',
  '!convex/test*.ts',
  '!convex/debug.ts',
  '!convex/testing/**',
  'app/**/*.{ts,tsx}',
  '!app/**/*.spec.ts',
  '!app/**/*.test.ts',
  'components/**/*.{ts,tsx}',
  '!components/**/*.spec.ts',
  '!components/**/*.test.ts',
  'lib/**/*.{ts,tsx}',
  '!lib/**/*.spec.ts',
  '!lib/**/*.test.ts',
  'hooks/**/*.{ts,tsx}',
  'contexts/**/*.{ts,tsx}',
];

async function removeConsoleLogs() {
  console.log('🧹 Removing console.log statements from production code...\n');

  const files = await glob(patterns, {
    cwd: rootDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/tests/**', '**/*.spec.ts', '**/*.test.ts'],
  });

  let filesModified = 0;
  let logsRemoved = 0;

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const originalLines = content.split('\n');
      const newLines = [];
      let inMultilineLog = false;
      let skipNextBrace = false;
      let fileHasChanges = false;

      for (let i = 0; i < originalLines.length; i++) {
        const line = originalLines[i];
        const trimmed = line.trim();

        // Check if this is a console.log statement (single or multiline start)
        if (trimmed.startsWith('console.log(')) {
          fileHasChanges = true;
          logsRemoved++;

          // Check if it's a single-line console.log
          if (trimmed.endsWith(');') || trimmed.endsWith('),')) {
            // Skip this line entirely
            continue;
          } else {
            // Start of multiline console.log
            inMultilineLog = true;
            continue;
          }
        }

        // Skip lines inside multiline console.log
        if (inMultilineLog) {
          if (trimmed.endsWith(');') || trimmed.endsWith('),')) {
            inMultilineLog = false;
          }
          continue;
        }

        // Keep all other lines (including console.error, console.warn)
        newLines.push(line);
      }

      if (fileHasChanges) {
        writeFileSync(file, newLines.join('\n'));
        filesModified++;
        console.log(`✓ ${file.replace(rootDir + '/', '')}`);
      }
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`📊 Files modified: ${filesModified}`);
  console.log(`📊 console.log statements removed: ${logsRemoved}`);
  console.log(`\nNote: console.error and console.warn were preserved`);
}

removeConsoleLogs().catch(console.error);
