const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  stream: require.resolve("stream-browserify"),
  crypto: require.resolve("crypto-browserify"),
  path: require.resolve("path-browserify"),
  os: require.resolve("os-browserify"),
  buffer: require.resolve("buffer"),
};

module.exports = config;
