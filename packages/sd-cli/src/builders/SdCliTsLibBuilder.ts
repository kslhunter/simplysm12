import {FsUtil, Logger, SdFsWatcher} from "@simplysm/sd-core-node";
import path from "path";
import {ISdCliBuilderResult, ISdCliLibPackageConfig} from "../commons";
import {EventEmitter} from "events";
import {SdTsCompiler} from "../build-tools/SdTsCompiler";
import {SdLinter} from "../build-tools/SdLinter";
import {FunctionQueue} from "@simplysm/sd-core-common";
import {SdCliIndexFileGenerator} from "../build-tools/SdCliIndexFileGenerator";

export class SdCliTsLibBuilder extends EventEmitter {
  private readonly _logger = Logger.get(["simplysm", "sd-cli", "SdCliTsLibBuilder"]);

  public constructor(private readonly _pkgPath: string,
                     private readonly _pkgConf: ISdCliLibPackageConfig,
                     private readonly _withLint: boolean) {
    super();
  }

  public override on(event: "change", listener: () => void): this;
  public override on(event: "complete", listener: (result: ISdCliBuilderResult) => void): this;
  public override on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }

  public async buildAsync(): Promise<ISdCliBuilderResult> {
    this._debug("dist 초기화...");
    await FsUtil.removeAsync(path.resolve(this._pkgPath, "dist"));

    this._debug(`BUILD 준비...`);
    const builder = new SdTsCompiler({
      pkgPath: this._pkgPath,
      emit: true,
      emitDts: true,
      globalStyle: true
    });

    this._debug("GEN INDEX...");
    await SdCliIndexFileGenerator.runAsync(this._pkgPath, this._pkgConf.polyfills);

    this._debug(`BUILD & CHECK...`);
    const checkResult = await builder.buildAsync();

    this._debug("LINT...");
    const lintResults = !this._withLint ? [] : await SdLinter.lintAsync(checkResult.affectedFilePaths, builder.program);

    this._debug(`빌드 완료`);
    return {
      affectedFilePaths: checkResult.affectedFilePaths,
      buildResults: [...checkResult.results, ...lintResults]
    };
  }

  public async watchAsync(): Promise<void> {
    this._debug("dist 초기화...");
    await FsUtil.removeAsync(path.resolve(this._pkgPath, "dist"));

    this._debug(`BUILD 준비...`);
    const builder = new SdTsCompiler({
      pkgPath: this._pkgPath,
      emit: true,
      emitDts: true,
      globalStyle: true
    });

    this._debug("WATCH GEN INDEX...");
    await SdCliIndexFileGenerator.watchAsync(this._pkgPath, this._pkgConf.polyfills);

    this._debug("WATCH...");
    const fnQ = new FunctionQueue();
    const watcher = SdFsWatcher
      .watch([
        path.resolve(this._pkgPath, "src/**/*.*")
      ], {
        ignoreInitial: false
      })
      .onChange({
        delay: 100,
      }, (changeInfos) => {
        builder.markChanges(changeInfos.map((item) => item.path));

        fnQ.runLast(async () => {
          this.emit("change");

          this._debug(`BUILD && CHECK...`);
          const checkResult = await builder.buildAsync();

          this._debug("LINT...");
          const lintResults = !this._withLint ? [] : await SdLinter.lintAsync(checkResult.affectedFilePaths, builder.program);

          this._debug(`빌드 완료`);
          this.emit("complete", {
            affectedFilePaths: checkResult.affectedFilePaths,
            buildResults: [...checkResult.results, ...lintResults]
          });

          watcher.add(builder.program.getSourceFiles().map((item) => item.fileName).distinct());
        });
      });
  }

  private _debug(msg: string): void {
    this._logger.debug(`[${path.basename(this._pkgPath)}] ${msg}`);
  }
}
