const webpack = require('webpack');

module.exports = {
  entry: {
    'index': [
      'babel-polyfill',
      'webpack/hot/dev-server',
      'webpack-hot-middleware/client',
      './src/index.js',
    ],
    'demo': [
      'babel-polyfill',
      'webpack/hot/dev-server',
      'webpack-hot-middleware/client',
      './src/game/demo.js',
    ],
  },
  output: {
    path: `${__dirname}/dist`,
    filename: '[name].bundle.js',
    publicPath: '/'
  },
  // 使用 Hot Module Replacement 外掛
  plugins: [
	  new webpack.optimize.OccurrenceOrderPlugin(),
	  new webpack.HotModuleReplacementPlugin()
  ],
  module: {
    rules: [
      {
        enforce: "pre",
        loader: 'eslint-loader',
        include: `${__dirname}/app`,
        exclude: /bundle\.js$/,
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      }
    ],
  },
  resolve: {
    // 設定後只需要寫 require('file') 而不用寫成 require('file.coffee')
    extensions: ['.js', '.json'] ,
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
    }
  },
};
