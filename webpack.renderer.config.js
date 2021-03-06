const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const path = require('path');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      Components: path.resolve(__dirname, 'src/Components/'),
      Layouts: path.resolve(__dirname, 'src/Layouts/'),
      Pages: path.resolve(__dirname, 'src/Pages/'),
      Extensions: path.resolve(__dirname, 'src/Extensions/'),
    }
  },
};
