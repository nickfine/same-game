const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Exclude macOS resource fork files (._* files that appear on external drives)
config.resolver.blockList = [
  /\._[^/]*$/,  // Match files starting with ._
  /\.DS_Store$/,
];

module.exports = withNativeWind(config, { input: "./global.css" });

