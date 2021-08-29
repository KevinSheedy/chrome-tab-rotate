import { build as esbuild } from 'esbuild';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import cpy from 'cpy';
import { zip as zipFolder } from 'zip-a-folder';

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
  statics.forEach((file) => console.log(`  ${file}`));
  return cpy(statics, 'dist');
};

const copyNodeModules = async () => {
  console.log('copyNodeModules');
  const statics = ['node_modules/bootstrap/dist'];
  statics.forEach((file) => console.log(`  ${file}`));
  return cpy(statics, 'dist/', { parents: true });
};

async function clean() {
  console.log('clean dist');
  return fs.removeSync('dist');
}

async function build() {
  console.log('\nBuild Started -------------');
  console.time('\nBuild Done in');
  await clean();

  await Promise.all([
    buildJavascript(),
    copyImages(),
    copyStatics(),
    copyNodeModules(),
  ]);
  console.timeEnd('\nBuild Done in');

  const date = new Date().toISOString().substring(11, 19);
  console.log(`\nFinished at ${date}`);

  zip();
}

async function zip() {
  // console.time('Zip created in');
  const { version } = JSON.parse(fs.readFileSync('./manifest.json'));

  await zipFolder('dist', `./zip/tab-rotate-${version}.zip`);
  // console.timeEnd('Zip created in');
}

async function watch() {
  build();

  // One-liner for current directory
  chokidar.watch('src/*').on('change', async (path) => {
    console.log('\nFile changed:');
    console.log(` ${path}`);
    await build();
  });
}

function run() {
  const command = process.argv.slice(2);
  console.log('command: ', command);
  const commands = { build, watch, zip };

  commands[command]?.();
}

run();
