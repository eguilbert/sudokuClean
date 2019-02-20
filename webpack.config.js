const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

// Configuration pour le build
const config = {
  entry: ["./src/assets/js/app.js", "./src/assets/css/app.scss"],
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js"
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      minify: { removeComments: true }
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
    new CleanWebpackPlugin(["dist"])
  ],
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        exclude: /node_modules/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        // use: ["babel-loader", "eslint-loader"]
        use: ["babel-loader"]
      },
      {
        test: /\.(jpg|jpeg|png|gif|eot|ttf|svg|woff|woff2|mp3|mp4)$/,
        use: {
          loader: "file-loader"
        }
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: {
          loader: "html-loader",
          options: {
            attrs: ["img:src", "link:href"]
          }
        }
      }
    ]
  }
};

module.exports = (env, argv) => {
  // Si on n'est pas en mode production (ex: npm run serve)
  if (argv.mode !== "production") {
    // Activer les sourcemaps
    config.devtool = "cheap-eval-source-map";
    // Activer le hot reload sur l'HTML
    config.entry.push("./src/index.html");
    // Enlever le CleanWebpack en dev
    config.plugins.pop();
    // Activer le HMR
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
    // Désactiver la génération de fichiers .css séparés du bundle
    // (qui empêche le Hot Reload de marcher pour les styles)
    config.module.rules[0].use[0] = "style-loader";
    // Activer le serveur de dev
    config.devServer = {
      contentBase: path.join(__dirname, "src"),
      watchContentBase: true,
      hot: true,
      host: "0.0.0.0"
    };
    // Activer la surveillance des changements de fichiers
    config.watch = true;
  }
  return config;
};
