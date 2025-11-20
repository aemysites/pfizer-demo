const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const esbuild = require('esbuild');
const concat = require('./concat.js');
const copyIndex = require('./copy-lib.js');

const isDev = process.argv[2] === 'dev';

async function devBuild() {
  await concat(true);
  await copyIndex(true);
}

async function prodBuild() {
  console.log('dirname', __dirname);

  try {
    await copyIndex(true); // for the build
    await concat(false);
    await esbuild.build({
      entryPoints: [path.join(__dirname, '../scripts/lib-franklin/index.js')],
      bundle: true,
      format: 'esm',
      sourcemap: true,
      outfile: path.join(__dirname, '../dist/lib-franklin.js'),
      minify: true,
      target: ['esnext'],
      splitting: false,
      external: [path.join(__dirname, '../blocks/*')],
      resolveExtensions: ['.js', '.mjs'],
      loader: {
        '.mjs': 'js',
      },
      banner: {
        js: '/* eslint-disable */',
      },
      // logLevel: 'verbose', // Enable verbose logging
    });

    copyIndex(false);

    console.log('Build completed successfully');
  } catch (error) {
    console.error('Error running concat and esbuild:', error);
  }
}

if (isDev) {
  devBuild();
} else {
  prodBuild();
}
