let { build } = require('esbuild');

build({
  entryPoints: [
    'src/background.js',
    'src/settings.js',
    'src/import-analytics.js',
  ],
  sourcemap: 'external',
  bundle: true,
  outdir: 'dist',
}).catch(() => process.exit(1));
