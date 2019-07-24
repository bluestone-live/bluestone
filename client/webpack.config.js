const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Buffer = require('buffer').Buffer;
const isProduction = process.env.NODE_ENV === 'production';
const dotEnvPath = `.env.${isProduction ? 'prod' : process.env.NODE_ENV}`;
if (!fs.existsSync(path.resolve(__dirname, dotEnvPath))) {
  throw new Error(`DOTENV File: ${dotEnvPath} does not exists.`);
}
require('dotenv').config({ path: dotEnvPath });
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OfflinePlugin = require('offline-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

const express = require('express');

const reduceABIFileSize = require('./scripts/reduce-abi-files-size');
if (['analyzer', 'production'].indexOf(process.env.NODE_ENV) >= 0) {
  reduceABIFileSize();
}

const getStyleLoader = () =>
  isProduction ? MiniCssExtractPlugin.loader : 'style-loader';

module.exports = env => ({
  mode: isProduction ? 'production' : 'development',
  entry: {
    app: ['babel-polyfill', './src/index.tsx'],
  },
  output: {
    path: `${__dirname}/dist`,
    filename: '[name].[hash].js',
    chunkFilename: '[name].[hash].js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'source-map-loader'],
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.jpe?g$|\.gif$|\.png$|\.ico$|\.svg$|\.eot$|\.woff$|\.ttf$/,
        loader: 'url-loader',
        options: {
          limit: '10000',
          name: '[name].[hash:5].[ext]',
        },
      },
      {
        test: /\.(css)$/,
        use: [
          getStyleLoader(),
          { loader: 'css-loader', options: { importLoaders: 1 } },
        ],
      },
    ],
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  target: 'web',
  devServer: {
    proxy: {
      [process.env.API_PATH]: {
        target: process.env.DEV_SERVER_PROXY,
        secure: false,
        changeOrigin: true,
      },
      [process.env.OTC_SERVER]: {
        target: process.env.DEV_SERVER_PROXY,
        secure: false,
        changeOrigin: true,
      },
    },
    disableHostCheck: true,
    port: process.env.DEV_SERVER_PORT,
    historyApiFallback: true,
    hot: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 8,
      minSize: 100000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          filename: isProduction ? '[chunkhash].js' : '[name].bundle.js',
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/,
            )[1];

            return `${packageName.replace('@', '')}`;
          },
        },
      },
    },
  },
  plugins: [
    new webpack.EnvironmentPlugin(Object.keys(process.env)),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      favicon: './src/styles/images/favicon.ico',
      template: './src/index.html',
      hash: env === 'production',
    }),
    new webpack.HashedModuleIdsPlugin(),
    new OfflinePlugin(),
    new BundleAnalyzerPlugin({
      analyzerMode: process.env.NODE_ENV === 'analyzer' ? 'server' : 'disabled',
    }),
  ],
});
