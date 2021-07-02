const path = require('path');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    alias: {
      Components: path.resolve(__dirname, 'src/Components/'),
      Layouts: path.resolve(__dirname, 'src/Layouts/'),
      Pages: path.resolve(__dirname, 'src/Pages/'),
    }
  },
};