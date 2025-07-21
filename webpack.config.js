const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    target: 'electron-renderer',
    entry: './src/renderer/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist/renderer'),
      filename: isProduction ? 'bundle.[contenthash].js' : 'bundle.js',
      clean: true, // Clean output directory before each build
      publicPath: './', // Important for Electron file:// protocol
    },
    // Remove source maps in production, use faster ones in development
    devtool: isProduction ? false : 'eval-source-map',
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: { electron: '25' } }],
                '@babel/preset-react',
                '@babel/preset-typescript'
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      fallback: {
        // Provide fallbacks for Node.js modules that might be referenced
        "path": false,
        "fs": false,
        "crypto": false,
        "stream": false,
        "util": false,
        "buffer": false,
        "assert": false,
        "http": false,
        "https": false,
        "os": false,
        "url": false,
        "querystring": false,
        "timers": false,
        "console": false,
        "vm": false,
        "zlib": false,
        "tty": false,
        "domain": false,
        "events": false,
        "punycode": false,
        "string_decoder": false,
        "child_process": false,
        "cluster": false,
        "dgram": false,
        "dns": false,
        "net": false,
        "readline": false,
        "repl": false,
        "tls": false,
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html',
        inject: 'body', // Automatically inject script tags
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        } : false
      }),
      // Define global variables for renderer process
      new webpack.DefinePlugin({
        'global': 'globalThis', // Fix global undefined error
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
    ],
    optimization: {
      minimize: isProduction,
      splitChunks: isProduction ? {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      } : false,
    },
  };
}; 