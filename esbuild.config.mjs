import { build } from 'esbuild';
import fs from 'fs-extra';
import chokidar from 'chokidar';

const sleep = async () => await new Promise(resolve => setTimeout(resolve, 0));

const buildJavascript = async () => {
  console.log('buildJavascript');
  return build({
    entryPoints: [
      'src/background.js',
      'src/settings.js',
      'src/import-analytics.js',
    ],
    sourcemap: 'external',
    bundle: true,
    outdir: 'dist',
  }).catch(() => process.exit(1));
};

const copyImages = async () => {
  console.log('copyImages');
  return fs.copy('src/img', 'dist/img', err => {
    if (err) return console.error(err);
    console.log('success!');
  }); // copies directory, even if it has subdirectories or files
};

const clean = async () => {
  console.log('clean dist');
  return fs.removeSync('dist');
};

const buildAll = async () => {
  await sleep();
  await clean();
  await sleep();
  await buildJavascript();
  await sleep();
  await copyImages();
};

buildAll();

// One-liner for current directory
chokidar.watch('src/*').on('change', async path => {
  console.log('\nFile changed:');
  console.log(` ${path}`);
  buildAll();
});
