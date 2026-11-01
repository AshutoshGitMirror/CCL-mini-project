#!/usr/bin/env node
// Build the exact application bundle that Terraform copies to EC2.
//
//   node scripts/build-bundle.mjs
//
// The bundle contains:
//   backend/            API source, Prisma schema, lockfile (no node_modules)
//   frontend/dist/      production Vite build (built by `npm run build`)
//
// Terraform uploads deploy/placementhub-app.zip to S3 and the instance
// downloads + unpacks it on boot. Keeping this step explicit means the
// Terraform plan stays fast and reproducible on Windows and Unix.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deployDir = path.join(root, 'deploy');
const stageDir = path.join(deployDir, 'app');
const zipPath = path.join(deployDir, 'placementhub-app.zip');
const frontendDist = path.join(root, 'frontend', 'dist');

if (!fs.existsSync(path.join(frontendDist, 'index.html'))) {
  console.error('[bundle] frontend/dist is missing. Run: cd frontend && npm run build');
  process.exit(1);
}

fs.rmSync(stageDir, { recursive: true, force: true });
fs.mkdirSync(stageDir, { recursive: true });

const backendSkip = new Set([
  'node_modules',
  '.env',
  '.env.local',
  '.env.production',
  '.dockerignore',
  'Dockerfile',
]);

function copyDir(src, dest, skipNames) {
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (from) => {
      const name = path.basename(from);
      return !skipNames.has(name);
    },
  });
}

console.log('[bundle] staging backend…');
copyDir(path.join(root, 'backend'), path.join(stageDir, 'backend'), backendSkip);

console.log('[bundle] staging frontend/dist…');
fs.cpSync(frontendDist, path.join(stageDir, 'frontend', 'dist'), { recursive: true });

fs.rmSync(zipPath, { force: true });
console.log('[bundle] writing zip…');

if (process.platform === 'win32') {
  // bsdtar ships with Windows 10/11 and writes ZIP entries with forward
  // slashes, unlike Compress-Archive. That matters because the bundle is
  // unpacked on Linux.
  execFileSync('tar', ['-a', '-c', '-f', zipPath, '-C', stageDir, '.'], {
    stdio: 'inherit',
  });
} else {
  execFileSync('zip', ['-qr', zipPath, '.'], { cwd: stageDir, stdio: 'inherit' });
}

const sizeMb = (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2);
console.log(`[bundle] ready: ${path.relative(root, zipPath)} (${sizeMb} MB)`);
console.log('[bundle] staged tree:', path.relative(root, stageDir));
