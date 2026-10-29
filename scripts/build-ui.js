const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_UI_DIR = path.join(ROOT_DIR, 'src-ui');
const STYLES_DIR = path.join(SRC_UI_DIR, 'styles');
const OUTPUT_FILE = path.join(ROOT_DIR, 'ui.html');

const CSS_FILES = [
  'theme.css',
  'layout.css',
  'components.css'
];

async function bundleUI() {
  try {
    // 1. Bundle React + TSX with esbuild
    const result = await esbuild.build({
      entryPoints: [path.join(SRC_UI_DIR, 'index.tsx')],
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      target: ['es2020'],
      minify: true,
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts'
      }
    });

    const jsBundle = result.outputFiles[0].text;

    // 2. Read and combine CSS files
    let combinedCss = '';
    for (const file of CSS_FILES) {
      const fullPath = path.join(STYLES_DIR, file);
      if (fs.existsSync(fullPath)) {
        combinedCss += `\n/* --- ${file} --- */\n` + fs.readFileSync(fullPath, 'utf-8') + '\n';
      }
    }

    // 3. Assemble final ui.html
    const template = fs.readFileSync(path.join(SRC_UI_DIR, 'index.html'), 'utf-8');
    let output = template.replace(
      '<!-- INJECT_STYLES -->',
      `<style>\n${combinedCss}\n  </style>`
    );
    output = output.replace(
      '<!-- INJECT_SCRIPTS -->',
      `<script>\n${jsBundle}\n  </script>`
    );

    fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
    console.log(`[DeltaLog] UI compiled successfully to ui.html (${new Date().toLocaleTimeString()})`);
  } catch (err) {
    console.error('[DeltaLog] UI build error:', err);
  }
}

// Check watch mode
const isWatch = process.argv.includes('--watch');

if (isWatch) {
  bundleUI();
  console.log('[DeltaLog] Watching src-ui for changes...');
  let debounceTimeout = null;
  fs.watch(SRC_UI_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && !filename.endsWith('ui.html')) {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        console.log(`[DeltaLog] File changed: ${filename}, rebuilding UI...`);
        bundleUI();
      }, 100);
    }
  });
} else {
  bundleUI();
}
