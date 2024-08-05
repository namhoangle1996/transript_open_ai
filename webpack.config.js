const webpack = require("webpack"),
  path = require("path"),
  CopyWebpackPlugin = require("copy-webpack-plugin");

if (process.env.NODE_ENV == null) {
  process.env.NODE_ENV = "development";
}
const ENV = (process.env.ENV = process.env.NODE_ENV);

const plugins = [
  new webpack.DefinePlugin({
    "process.env": {
      ENV: JSON.stringify(ENV),
    },
  }),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: "manifest.json",
      },
      {
        from: "src/images",
        to: "images",
      },
      {
        from: "src/css/*.css",
        to({ context, absoluteFilename }) {
          return "css/[name][ext]";
        },
      },
      {
        from: "src/options.html",
      }
    ],
  })
];

const fileExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "eot",
  "otf",
  "svg",
  "ttf",
  "woff",
  "woff2",
];
const moduleRules = [
  {
    test: /\.css$/,
    use: ["style-loader", "css-loader"],
    exclude: /node_modules/,
  },
  {
    test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
    use: "file-loader?name=[name].[ext]",
    exclude: /node_modules/,
  },
  {
    test: /\.html$/,
    use: {
      loader: "html-loader",
    },
    exclude: /node_modules/,
  },
  {
    test: /\.tsx?$/,
    use: 'ts-loader',
    exclude: /node_modules/,
  },
];

const config = {
  target: "web",
  devtool: "cheap-module-source-map",
  mode: process.env.NODE_ENV || "development",
  entry: {
    "index": path.join(__dirname, "src", "index.ts"),
    "background": path.join(__dirname, "src", "background.ts"),
    "options": path.join(__dirname, "src", "options.ts")
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].bundle.js",
    clean: true,
  },
  module: {
    rules: moduleRules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.ts', '.js'],
  },
};

module.exports = config;
