import { build as esbuild } from 'esbuild';
import fs from 'fs-extra';
import chokidar from 'chokidar';

const command = process.argv.slice(2);
console.log('command: ', command);

const commands = { build, watch, zip: () => {} };

commands[command]?.();

const buildJavascript = async () => {
  console.log('buildJavascript');
  return esbuild({
    entryPoints: [
      'src/background.js',
      'src/settings.js',
      'src/import-analytics.js',
      'src/hot-reload.js',
    ],
    sourcemap: 'inline',
    logLevel: 'info',
    // minify: true,
    bundle: true,
    outdir: 'dist',
  }).catch(() => process.exit(1));
};

const copyImages = async () => {
  console.log('copyImages');
  return fs.copy('src/img', 'dist/img', err => {
    if (err) return console.error(err);
    // console.log(`copied ${dist}`);
  }); // copies directory, even if it has subdirectories or files
};

const copyStatics = async () => {
  console.log('copyStatics');
  [
    ['manifest.json', 'dist/manifest.json'],
    ['README.md', 'dist/README.md'],
    ['src/index.html', 'dist/index.html'],
    ['src/settings.css', 'dist/settings.css'],
  ].forEach(([src, dist]) => {
    fs.copy(src, dist, err => {
      if (err) return console.error(err);
      console.log(`  ${dist}`);
    });
  });
};

async function clean() {
  console.log('clean dist');
  return fs.removeSync('dist');
}

async function build() {
  await clean();
  await buildJavascript();
  await copyImages();
  await copyStatics();
}

async function watch() {
  build();

  // One-liner for current directory
  chokidar.watch('src/*').on('change', async path => {
    console.log('\nFile changed:');
    console.log(` ${path}`);
    build();
  });
}
