module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Reanimated 4 uses the worklets plugin (NOT react-native-reanimated/plugin,
      // which was the v3 path). Must be the LAST plugin in the list.
      "react-native-worklets/plugin"
    ]
  };
};
