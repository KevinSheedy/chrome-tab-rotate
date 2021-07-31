const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.js',
    settings: './src/settings.js',
    'import-analytics': './src/import-analytics.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '' },
        { from: 'README.md', to: '' },
      ],
    }),
    new HtmlWebpackPlugin({
      title: 'Output Management',
    }),
  ],
};
