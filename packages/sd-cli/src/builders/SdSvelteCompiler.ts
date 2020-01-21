import {Logger} from "@simplysm/sd-core-node";
import * as path from "path";
import * as fs from "fs-extra";
import * as ts from "typescript";
import * as webpack from "webpack";
import * as os from "os";
import {SdWebpackTimeFixPlugin} from "../plugins/SdWebpackTimeFixPlugin";
import {EventEmitter} from "events";
import * as HtmlWebpackPlugin from "html-webpack-plugin";

export class SdSvelteCompiler extends EventEmitter {
  private constructor(private readonly _mode: "development" | "production",
                      private readonly _tsConfigPath: string,
                      private readonly _distPath: string,
                      private readonly _entry: string,
                      private readonly _logger: Logger,
                      private readonly _packageKey: string) {
    super();
  }

  public static async createAsync(argv: {
    tsConfigPath: string;
    mode: "development" | "production";
  }): Promise<SdSvelteCompiler> {
    const tsConfigPath = argv.tsConfigPath;
    const mode = argv.mode;

    const packagePath = path.dirname(argv.tsConfigPath);

    const tsConfig = await fs.readJson(tsConfigPath);
    const parsedTsConfig = ts.parseJsonConfigFileContent(tsConfig, ts.sys, path.dirname(tsConfigPath));

    if (!tsConfig.files) {
      throw new Error("'tsConfig.json'에 'files'가 반드시 정의되어야 합니다.");
    }

    if (tsConfig.files.length > 1) {
      throw new Error("'svelte' 클라이언트는 'tsConfig.json'에 'files'가 단 하나만 정의되어야 합니다.");
    }

    const entry = path.resolve(packagePath, tsConfig.files[0]);

    const distPath = parsedTsConfig.options.outDir
      ? path.resolve(parsedTsConfig.options.outDir)
      : path.resolve(packagePath, "dist");

    const logger = Logger.get(
      [
        "simplysm",
        "sd-cli",
        path.basename(packagePath),
        "svelte",
        "compile"
      ]
    );

    return new SdSvelteCompiler(
      mode,
      tsConfigPath,
      distPath,
      entry,
      logger,
      path.basename(packagePath)
    );
  }

  public async runAsync(watch: boolean): Promise<void> {
    if (watch) {
      this._logger.log("컴파일 및 변경감지를 시작합니다.");
    }
    else {
      this._logger.log("컴파일를 시작합니다.");
    }

    const webpackConfig = await this._getWebpackConfigAsync(watch);

    const compiler = webpack(webpackConfig);

    if (watch) {
      compiler.hooks.invalid.tap("SdServerCompiler", () => {
        this.emit("change");
        this._logger.log("컴파일에 대한 변경사항이 감지되었습니다.");
      });
    }

    await new Promise<void>(async (resolve, reject) => {
      const callback = (err: Error, stats: webpack.Stats) => {
        if (err) {
          reject(err);
          return;
        }

        const info = stats.toJson("errors-warnings");

        if (stats.hasWarnings()) {
          this._logger.warn(
            "컴파일 경고\n",
            info.warnings
              .map((item) => item.startsWith("(undefined)") ? item.split("\n").slice(1).join("\n") : item)
              .join(os.EOL)
          );
        }

        if (stats.hasErrors()) {
          this._logger.error(
            "컴파일 오류\n",
            info.errors
              .map((item) => item.startsWith("(undefined)") ? item.split("\n").slice(1).join("\n") : item)
              .join(os.EOL)
          );
        }

        this.emit("complete");
        this._logger.log("컴파일이 완료되었습니다.");
        resolve();
      };

      if (watch) {
        compiler.watch({}, callback);
      }
      else {
        compiler.run(callback);
      }
    });
  }

  private async _getWebpackConfigAsync(watch: boolean): Promise<webpack.Configuration> {
    return {
      mode: this._mode,
      devtool: this._mode === "development" ? "cheap-module-source-map" : "source-map",
      target: "web",
      resolve: {
        extensions: [".ts", ".js", ".svelte"],
        alias: {
          "SD_APP": path.resolve(path.dirname(this._tsConfigPath), "src/App.svelte")
        }
      },
      optimization: {
        minimize: false
      },
      entry: {
        main: [
          `webpack-hot-middleware/client?path=/${this._packageKey}/__webpack_hmr&timeout=20000&reload=true`,
          this._entry
        ]
      },
      output: {
        path: this._distPath,
        filename: "[name].js"
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [
              {
                loader: "ts-loader",
                options: {
                  configFile: this._tsConfigPath,
                  transpileOnly: true
                }
              }
            ]
          },
          {
            test: /\.svelte$/,
            use: {
              loader: "svelte-loader",
              options: {
                hotReload: watch
              }
            }
          }
        ]
      },
      plugins: [
        ...watch ? [
          new SdWebpackTimeFixPlugin(),
          new webpack.HotModuleReplacementPlugin()
        ] : [],

        new HtmlWebpackPlugin({
          template: path.resolve(__dirname, `../lib/index.ejs`),
          BASE_HREF: `/${this._packageKey}/`
        })
      ]
    };
  }
}