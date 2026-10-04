module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          // Jotai's ESM build uses import.meta.env; Metro emits a classic script.
          web: { unstable_transformImportMeta: true },
        },
      ],
    ],
  }
}
