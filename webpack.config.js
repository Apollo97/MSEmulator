const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

let config;

if (process.env.NODE_ENV === 'production') {
config = {
  entry: {
    'index': [
      'babel-polyfill',
      './src/index.js',
    ],
    'demo': [
      'babel-polyfill',
      './src/game/demo.js',
    ],
  },
  output: {
    path: `${__dirname}/public`,
    filename: '[name].bundle.js',
    publicPath: '/'
  },
  plugins: [
  ],
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jp(e*)g|svg)$/,  
        use: [{
          loader: 'url-loader',
          options: { 
            limit: 8000, // Convert images < 8kb to base64 strings
            name: 'images/[hash]-[name].[ext]'
          } 
	    }]
	  }
    ],
  },
  resolve: {
    // 設定後只需要寫 require('file') 而不用寫成 require('file.js')
    extensions: ['.js', '.json'] ,
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
    }
  }
};
}
else {
config = {
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
    path: `${__dirname}/public`,
    filename: '[name].bundle.js',
    publicPath: '/'
  },
  plugins: [
    /*new UglifyJsPlugin(),*/
    // 使用 Hot Module Replacement 外掛
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
      /*{
        enforce: 'pre',
        loader: 'eslint-loader',
        include: `${__dirname}/src`,
        exclude: /bundle\.js$/,
      },*/
      /*{
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['env', 'es2015', 'stage-3', 'es2017'],
          plugins: ["transform-remove-strict-mode"]
        }
      },*/
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jp(e*)g|svg)$/,  
        use: [{
          loader: 'url-loader',
          options: { 
            limit: 8000, // Convert images < 8kb to base64 strings
            name: 'images/[hash]-[name].[ext]'
          } 
	    }]
	  }
    ],
  },
  resolve: {
    // 設定後只需要寫 require('file') 而不用寫成 require('file.js')
    extensions: ['.js', '.json'] ,
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
    }
  },
  devtool: 'eval-source-map'
};
}

module.exports = config;
