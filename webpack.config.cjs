const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/web/index.tsx",
  target: "web",
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.web.json",
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      fs: false,
      path: false,
    },
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist-web"),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/web/index.html",
    }),
  ],
  devServer: {
    static: path.resolve(__dirname, "dist-web"),
    port: 8300,
    hot: true,
    setupMiddlewares(middlewares, devServer) {
      const app = devServer.app;
      const fs = require("fs");

      app.get("/api/load", (req, res) => {
        try {
          const filePath = path.resolve(__dirname, "input/高考志愿推荐助手.yml");
          const yamlText = fs.readFileSync(filePath, "utf-8");
          res.json({ yaml: yamlText });
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });

      app.post("/api/save", (req, res) => {
        try {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", () => {
            const outPath = path.resolve(__dirname, "output/web-output.yml");
            fs.writeFileSync(outPath, body, "utf-8");
            res.json({ ok: true, path: outPath });
          });
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });

      return middlewares;
    },
  },
};
