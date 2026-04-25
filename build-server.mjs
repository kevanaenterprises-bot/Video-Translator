// Compile the Express/WebSocket server to dist/index.js using esbuild.
// esbuild is a transitive dep of vite — no extra install needed.
import { build } from 'esbuild';

await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',  // keep node_modules as runtime deps, not bundled
});

console.log('✅ Server compiled → dist/index.js');
