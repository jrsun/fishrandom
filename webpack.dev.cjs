const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');


module.exports = merge(common, {
  devtool: 'inline-source-map',
  mode: 'development',
});