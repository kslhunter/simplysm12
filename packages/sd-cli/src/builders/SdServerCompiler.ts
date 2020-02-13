import {FsUtil, Logger} from "@simplysm/sd-core-node";
import * as path from "path";
import * as ts from "typescript";
import * as webpack from "webpack";
import * as os from "os";
import {SdWebpackTimeFixPlugin} from "../plugins/SdWebpackTimeFixPlugin";
import {EventEmitter} from "events";

export class SdServerCompiler extends EventEmitter {
  private constructor(private readonly _mode: "development" | "production",
                      private readonly _tsConfigPath: string,
                      private readonly _distPath: string,
                      private readonly _entry: { [key: string]: string },
                      private readonly _logger: Logger) {
    super();
  }

  public static async createAsync(argv: {
    tsConfigPath: string;
    mode: "development" | "production";
  }): Promise<SdServerCompiler> {
    const tsConfigPath = argv.tsConfigPath;
    const mode = argv.mode;

    const packagePath = path.dirname(argv.tsConfigPath);

    const tsConfig = await FsUtil.readJsonAsync(tsConfigPath);
    const parsedTsConfig = ts.parseJsonConfigFileContent(tsConfig, ts.sys, path.dirname(tsConfigPath));

    if (!tsConfig.files) {
      throw new Error("서버 패키지의 'tsConfig.json'에는 'files'가 반드시 정의되어야 합니다.");
    }

    const entry = (tsConfig.files as string[]).toObject(
      (item) => path.basename(item, path.extname(item)),
      (item) => path.resolve(packagePath, item)
    );

    const distPath = parsedTsConfig.options.outDir
      ? path.resolve(parsedTsConfig.options.outDir)
      : path.resolve(packagePath, "dist");

    const logger = Logger.get(
      [
        "simplysm",
        "sd-cli",
        path.basename(packagePath),
        "server",
        "compile"
      ]
    );

    return new SdServerCompiler(
      mode,
      tsConfigPath,
      distPath,
      entry,
      logger
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

        this._logger.log("컴파일이 완료되었습니다.");
        this.emit("complete");
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
      target: "node",
      node: {
        __dirname: false
      },
      resolve: {
        extensions: [".ts", ".js"]
      },
      optimization: {
        minimize: false
      },
      entry: this._entry,
      output: {
        path: this._distPath,
        filename: "[name].js",
        libraryTarget: "umd"
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            enforce: "pre",
            loader: "source-map-loader",
            exclude: [
              /node_modules[\\/](?!@simplysm)/
            ]
          },
          {
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [
              "shebang-loader",
              {
                loader: "ts-loader",
                options: {
                  configFile: this._tsConfigPath,
                  transpileOnly: true
                }
              }
            ]
          }
        ]
      },
      plugins: [
        ...watch ? [new SdWebpackTimeFixPlugin()] : [],
        new webpack.BannerPlugin({
          banner: "#!/usr/bin/env node",
          raw: true,
          entryOnly: true,
          include: ["bin.js"]
        })
      ],
      externals: [
        (context, request, callback) => {
          if (request === "node-gyp-build") {
            const sourcePath = path.resolve(context, "prebuilds", "win32-x64", "node-napi.node");
            const targetRelativePath = path.relative(path.resolve(process.cwd(), "node_modules"), sourcePath);
            const targetPath = path.resolve(this._distPath, "node_modules", targetRelativePath);

            if (FsUtil.exists(sourcePath)) {
              FsUtil.mkdirs(path.dirname(targetPath));
              FsUtil.copy(sourcePath, targetPath);
            }

            callback(undefined, `function (() => require('${targetRelativePath.replace(/\\/g, "/")}'))`);
          }
          else if (/.*\.node$/.test(request)) {
            const sourcePath = path.resolve(context, request);
            const targetRelativePath = path.relative(path.resolve(process.cwd(), "node_modules"), sourcePath);
            const targetPath = path.resolve(this._distPath, "node_modules", targetRelativePath);

            if (FsUtil.exists(sourcePath)) {
              FsUtil.mkdirs(path.dirname(targetPath));
              FsUtil.copy(sourcePath, targetPath);
            }

            callback(undefined, `commonjs ${targetRelativePath.replace(/\\/g, "/")}`);
          }
          else {
            callback(undefined, undefined);
          }
        }
      ]
    };
  }
}