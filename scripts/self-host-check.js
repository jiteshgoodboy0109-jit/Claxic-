#!/usr/bin/env node
// Claxic Self-Hosting System Diagnostic Pre-Flight Checker
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('       CLAXIC SELF-HOSTING DIAGNOSTIC AUDIT         ');
console.log('====================================================');

let hasErrors = false;

// 1. Check Node.js Version
const nodeVer = process.versions.node;
const [major, minor] = nodeVer.split('.').map(Number);
console.log(`[1] Node.js Runtime Version: v${nodeVer}`);
if (major > 22 || (major === 22 && minor >= 5)) {
  console.log('    ✓ Node version meets requirements (v22.5.0+ with built-in node:sqlite)');
} else {
  console.log('    ❌ Node version too low. Claxic requires Node.js v22.5.0 or higher.');
  hasErrors = true;
}

// 2. Check SQLite Native Engine
try {
  const { DatabaseSync } = await import('node:sqlite');
  console.log('[2] Native SQLite Engine (node:sqlite): Available');
  const tempDb = new DatabaseSync(':memory:');
  tempDb.exec('CREATE TABLE test (id INT, val TEXT)');
  tempDb.exec("INSERT INTO test VALUES (1, 'OK')");
  const row = tempDb.prepare('SELECT val FROM test WHERE id = 1').get();
  tempDb.close();
  if (row?.val === 'OK') {
    console.log('    ✓ Native SQLite execution verified');
  }
} catch (err) {
  console.log('    ❌ Native SQLite (node:sqlite) failed:', err.message);
  hasErrors = true;
}

// 3. Check SQLite Database File & Permissions
const dbDir = path.join(rootDir, 'backend', 'db');
const dbFile = path.join(dbDir, 'claxic.db');
console.log(`[3] Database Directory: ${dbDir}`);
if (fs.existsSync(dbDir)) {
  console.log('    ✓ Database directory exists');
  try {
    const testFile = path.join(dbDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('    ✓ Database directory has read/write permissions');
  } catch (err) {
    console.log('    ❌ Database directory is NOT writable:', err.message);
    hasErrors = true;
  }
} else {
  console.log('    ⚠️ Database directory not found (will be auto-created on first boot)');
}

if (fs.existsSync(dbFile)) {
  const stats = fs.statSync(dbFile);
  console.log(`    ✓ Database file present (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} else {
  console.log('    ℹ️ Database file will be initialized automatically from schema on first start.');
}

// 4. Check Frontend Production Build
const distPath = path.join(rootDir, 'frontend', 'dist');
const indexHtml = path.join(distPath, 'index.html');
console.log(`[4] Frontend Production Bundle: ${distPath}`);
if (fs.existsSync(indexHtml)) {
  console.log('    ✓ Frontend built distribution is present (ready for SERVE_FRONTEND=true)');
} else {
  console.log('    ⚠️ Frontend distribution not found. Run `npm run build:prod` before starting the server.');
}

// 5. Port and Environment
const port = process.env.PORT || 5000;
console.log(`[5] Target Port: ${port}`);
console.log(`    Environment Mode: ${process.env.NODE_ENV || 'development'}`);

console.log('====================================================');
if (hasErrors) {
  console.log('❌ SYSTEM CHECK FAILED: Please fix the errors above before deploying.');
  process.exit(1);
} else {
  console.log('✅ SYSTEM CHECK PASSED: Claxic is 100% READY FOR HOSTING!');
  console.log('====================================================');
}
