const path = require("path");
const { EsbuildPlugin } = require("esbuild-loader");
const { TsconfigPathsPlugin } = require("tsconfig-paths-webpack-plugin");
const swcDefaultConfig =
  require("@nestjs/cli/lib/compiler/defaults/swc-defaults").swcDefaultsFactory()
    .swcOptions;

module.exports = {
  entry: {
    main: "./src/main.ts",
  },
  target: "node",
  mode: "production",
  devtool: false,
  cache: {
    type: "filesystem",
    compression: "gzip",
  },
  optimization: {
    minimize: true,
    minimizer: [
      new EsbuildPlugin({
        target: "es2021",
        format: "cjs",
        legalComments: "none",
        minifyWhitespace: true,
        minifySyntax: true,
      }),
    ],
    splitChunks: {
      chunks: "all",
      maxSize: 500 * 1024,
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          name: "vendor",
          chunks: "all",
          enforce: true,
          priority: 20,
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.[tj]s$/,
        exclude: /node_modules/,
        use: {
          loader: "swc-loader",
          options: swcDefaultConfig,
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: "./tsconfig.json",
      }),
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `[name].js`,
    chunkFilename: `[name].[id].js`,
    clean: true,
  },
  externals: {
    lodash: "commonjs lodash",
  },
};
