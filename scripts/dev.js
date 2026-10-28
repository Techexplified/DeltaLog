const { spawn } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('[DeltaLog Dev] Starting local development mode...');

// 1. Start UI Watcher (src-ui -> ui.html via esbuild)
const uiScript = path.join(__dirname, 'build-ui.js');
const uiWatcher = spawn(process.execPath, [uiScript, '--watch'], {
  cwd: ROOT_DIR,
  stdio: 'inherit'
});

// 2. Start TypeScript Watcher for code.ts (code.ts -> code.js)
const tscScript = require.resolve('typescript/bin/tsc');
const tscWatcher = spawn(process.execPath, [tscScript, '-p', 'tsconfig.json', '--watch', '--preserveWatchOutput'], {
  cwd: ROOT_DIR,
  stdio: 'inherit'
});

function cleanup() {
  console.log('\n[DeltaLog Dev] Stopping watchers...');
  try { uiWatcher.kill(); } catch {}
  try { tscWatcher.kill(); } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
