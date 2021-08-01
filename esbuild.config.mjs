import { build as esbuild } from 'esbuild';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import cpy from 'cpy';

const command = process.argv.slice(2);
console.log('command: ', command);
const commands = { build, watch, zip: () => {} };

commands[command]?.();

const buildJavascript = async () => {
  console.log('buildJavascript');
  return esbuild({
    sourcemap: 'inline',
    logLevel: 'info',
    // minify: true,
    bundle: true,
    outdir: 'dist',
    entryPoints: [
      'src/background.js',
      'src/settings.js',
      'src/import-analytics.js',
      'src/hot-reload.js',
    ],
  }).catch(() => {});
};

const copyImages = async () => {
  console.log('copyImages');
  return cpy('src/img', 'dist/img');
};

const copyStatics = async () => {
  console.log('copyStatics');
  const statics = [
    'manifest.json',
    'README.md',
    'src/index.html',
    'src/settings.css',
  ];
  statics.forEach(file => console.log(`  ${file}`));
  return cpy(statics, 'dist');
};

async function clean() {
  console.log('clean dist');
  return fs.removeSync('dist');
}

async function build() {
  console.log('\nBuild Started -------------');
  console.time('\nBuild done: ');
  await clean();

  await Promise.all([buildJavascript(), copyImages(), copyStatics()]);
  console.timeEnd('\nBuild done: ');
}

async function watch() {
  build();

  // One-liner for current directory
  chokidar.watch('src/*').on('change', async path => {
    console.log('\nFile changed:');
    console.log(` ${path}`);
    await build();
  });
}
