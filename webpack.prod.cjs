const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const common = require('./webpack.common.cjs');

module.exports = merge(common, {
   mode: 'production',
   optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true, // Must be set to true if using source-maps in production
        terserOptions: {
          // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
          mangle: false,
          removeAvailableModules: true,
          providedExports: true,
          concatenateModules: true,
        }
      }),
    ],
  }
});