const path = require('path');

module.exports = {
  entry: './src/background.js',
  output: {
    filename: 'background.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
