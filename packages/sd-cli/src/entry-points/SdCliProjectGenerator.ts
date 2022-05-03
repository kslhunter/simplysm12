import { FsUtil, Logger } from "@simplysm/sd-core-node";
import path from "path";
import { StringUtil } from "@simplysm/sd-core-common";
import { fc_project_editor_config } from "./file/project/fc_project_editor_config";
import { fc_project_eslintrc } from "./file/project/fc_project_eslintrc";
import { fc_project_gitignore } from "./file/project/fc_project_gitignore";
import { fc_project_gitattributes } from "./file/project/fc_project_gitattributes";
import { fc_project_npmconfig } from "./file/project/fc_project_npmconfig";
import { fc_project_readme } from "./file/project/fc_project_readme";
import { fc_project_simplysm } from "./file/project/fc_project_simplysm";
import { fc_project_tsconfig } from "./file/project/fc_project_tsconfig";
import { fc_package_eslintrc } from "./file/base/fc_package_eslintrc";
import { fc_package_npmconfig } from "./file/base/fc_package_npmconfig";
import { fc_package_tsconfig } from "./file/base/fc_package_tsconfig";
import { fc_package_DbContext } from "./file/db/fc_package_DbContext";
import { fc_package_DbModel } from "./file/db/fc_package_DbModel";
import { fc_package_server_main } from "./file/server/fc_package_server_main";
import { fc_package_appicons } from "./file/client/fc_package_appicons";
import { fc_package_AppModule } from "./file/client/fc_package_AppModule";
import { fc_package_AppPage } from "./file/client/fc_package_AppPage";
import { fileURLToPath } from "url";
import { fc_package_index } from "./file/client/fc_package_index";
import { fc_package_client_main } from "./file/client/fc_package_client_main";
import { fc_package_manifest } from "./file/client/fc_package_manifest";
import { INpmConfig } from "../commons";
import { fc_package_polyfills } from "./file/client/fc_package_polyfills";
import { fc_package_styles } from "./file/client/fc_package_styles";

export class SdCliProjectGenerator {
  private readonly _logger = Logger.get(["simplysm", "sd-cli", this.constructor.name]);

  public constructor(private readonly _rootPath: string) {
  }

  public async initAsync(opt: { name?: string; description: string; author: string }): Promise<void> {
    if ((await FsUtil.readdirAsync(this._rootPath)).filter((item) => !["package.json", "node_modules", "package-lock.json"].includes(path.basename(item))).length > 0) {
      throw new Error("빈 디렉토리가 아닙니다. (package-lock.json, package.json, node_modules 외의 파일/폴더가 존재하는 경우, 초기화할 수 없습니다.)");
    }

    const projName = opt.name ?? path.basename(this._rootPath);

    this._logger.debug("'.editorconfig' 파일 생성");
    await FsUtil.writeFileAsync(path.resolve(this._rootPath, ".editorconfig"), fc_project_editor_config());

    this._logger.debug(`[${projName}] '.eslintrc.cjs' 파일 생성`);
    await FsUtil.writeFileAsync(path.resolve(this._rootPath, ".eslintrc.cjs"), fc_project_eslintrc());

    this._logger.debug(`[${projName}]'.gitattributes' 파일 생성`);
    await FsUtil.writeFileAsync(path.resolve(this._rootPath, ".gitattributes"), fc_project_gitattributes());

    this._logger.debug(`[${projName}] '.gitignore' 파일 생성`);
    await FsUtil.writeFileAsync(path.resolve(this._rootPath, ".gitignore"), fc_project_gitignore());

    this._logger.debug(`[${projName}] 'package.json' 파일 생성`);
    await FsUtil.writeFileAsync(path.resolve(this._rootPath, "package.json"), fc_project_npmconfig({
      name: projName,
      description: opt.description,
      author: opt.author
    }));

    this._logger.debug(`[${projName}] 'README.md' 파일 생성`);
    await FsUtil.writeFileAsync(path.resolve(this._rootPath, "README.md"), fc_project_readme({
      description: opt.description
    }));

    this._logger.debug(`[${projName}] 'simplysm.json' 파일 생성`);
    await FsUtil.writeFileAsync(path.resolve(this._rootPath, "simplysm.json"), fc_project_simplysm());

    this._logger.debug(`[${projName}] 'tsconfig.json' 파일 생성`);
    await FsUtil.writeFileAsync(path.resolve(this._rootPath, "tsconfig.json"), fc_project_tsconfig());

    this._logger.debug(`[${projName}] 'packages' 디렉토리 생성`);
    await FsUtil.mkdirsAsync(path.resolve(this._rootPath, "packages"));
  }

  public async addTsLibAsync(opt: { name: string; description: string; useDom: boolean }): Promise<void> {
    await this._addPackageBaseTemplate({
      ...opt,
      isModule: true,
      isForAngular: false,
      types: "dist/index.d.ts",
      main: "dist/index.mjs",
      dependencies: {}
    });

    this._logger.debug(`[${opt.name}] 'simplysm.json' 파일에 등록`);

    await this._addPackageToSimplysmJson({
      name: opt.name,
      type: "library",
      useAutoIndex: true
    });
  }

  public async addDbLibAsync(opt: { name: string }): Promise<void> {
    const pkgName = "db-" + opt.name;
    const pkgPath = path.resolve(this._rootPath, "packages", pkgName);

    await this._addPackageBaseTemplate({
      name: pkgName,
      description: "DB " + opt.name.toUpperCase(),
      useDom: false,
      isModule: false,
      isForAngular: false,
      types: "dist/index.d.ts",
      main: "dist/index.cjs",
      dependencies: {
        "@simplysm/sd-core-common": "~7.0.0",
        "@simplysm/sd-orm-common": "~7.0.0"
      }
    });

    this._logger.debug(`[${pkgName}] 'src/${StringUtil.toPascalCase(opt.name)}DbContext.ts' 파일 생성`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, `src/${StringUtil.toPascalCase(opt.name)}DbContext.ts`), fc_package_DbContext({
      name: opt.name
    }));

    this._logger.debug(`[${pkgName}] 'src/models' 디렉토리 생성`);
    await FsUtil.mkdirsAsync(path.resolve(pkgPath, "src/models"));

    this._logger.debug(`[${pkgName}] 'simplysm.json' 파일에 등록`);
    await this._addPackageToSimplysmJson({
      name: pkgName,
      type: "library",
      useAutoIndex: true
    });
  }

  public async addDbLibModelAsync(opt: { dbPkgName: string; category: string; name: string; description: string }): Promise<void> {
    const pkgName = "db-" + opt.dbPkgName;
    const pkgPath = path.resolve(this._rootPath, "packages", pkgName);

    this._logger.debug(`[${pkgName}] 'src/models/${opt.category}/${opt.name}.ts' 파일 생성`);

    await FsUtil.writeFileAsync(
      path.resolve(pkgPath, `src/models/${opt.category}/${opt.name}.ts`), fc_package_DbModel({
        name: opt.name,
        description: opt.description
      }));

    this._logger.debug(`[${pkgName}] DbContext 파일에 등록`);
    let dbContextContent = await FsUtil.readFileAsync(path.resolve(pkgPath, `src/${StringUtil.toPascalCase(opt.dbPkgName)}DbContext.ts`));

    if (!dbContextContent.includes(`Queryable`)) {
      this._logger.debug(`[${pkgName}] DbContext 파일에 등록: import: Queryable`);
      dbContextContent = dbContextContent.replace(/ } from "@simplysm\/sd-orm-common";/, `, Queryable } from "@simplysm/sd-orm-common";`);
    }

    this._logger.debug(`[${pkgName}] DbContext 파일에 등록: import: MODEL`);
    dbContextContent = `import { ${opt.name} } from "./models/${opt.category}/${opt.name}";\n` + dbContextContent;

    if (!dbContextContent.includes(`//-- ${opt.category}\n`)) {
      this._logger.debug(`[${opt.name}] DbContext 파일에 등록: CATEGORY`);

      dbContextContent = dbContextContent.replace(/\n}/, `\n\n  //-- ${opt.category}\n}`);
    }

    this._logger.debug(`[${pkgName}] DbContext 파일에 등록: MODEL`);

    dbContextContent = dbContextContent.replace(new RegExp(`//-- ${opt.category}\n`), `
  //-- ${opt.category}
  public readonly ${StringUtil.toCamelCase(opt.name)} = new Queryable(this, ${opt.name});
`.trim() + "\n");

    await FsUtil.writeFileAsync(path.resolve(pkgPath, `src/${StringUtil.toPascalCase(opt.dbPkgName)}DbContext.ts`), dbContextContent);
  }

  public async addServerAsync(opt: { name?: string; description?: string }): Promise<void> {
    const pkgName = "server" + (opt.name === undefined ? "" : `-${opt.name}`);
    const pkgPath = path.resolve(this._rootPath, "packages", pkgName);

    await this._addPackageBaseTemplate({
      name: pkgName,
      description: (opt.description === undefined ? "" : `${opt.description.toUpperCase()} `) + "서버",
      useDom: false,
      isModule: false,
      isForAngular: false,
      main: "dist/main.js",
      dependencies: {
        "@simplysm/sd-core-common": "~7.0.0",
        "@simplysm/sd-core-node": "~7.0.0",
        "@simplysm/sd-service-common": "~7.0.0",
        "@simplysm/sd-service-server": "~7.0.0"
      }
    });

    this._logger.debug(`[${pkgName}] 'src/main.ts' 파일 등록`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, `src/main.ts`), fc_package_server_main({
      projPath: this._rootPath,
      pkgName: pkgName
    }));

    this._logger.debug(`[${pkgName}] 'simplysm.json' 파일에 등록`);
    await this._addPackageToSimplysmJson({
      name: pkgName,
      type: "server",
      useAutoIndex: false
    });
  }

  public async addClientAsync(opt: { name: string; description: string; serverName: string }): Promise<void> {
    const pkgName = `client-${opt.name}`;
    const pkgPath = path.resolve(this._rootPath, "packages", pkgName);

    const projNpmConfig = await this._getProjNpmConfigAsync();

    await this._addPackageBaseTemplate({
      name: pkgName,
      description: `${opt.description} 클라이언트`,
      useDom: true,
      isModule: true,
      isForAngular: true,
      dependencies: {
        "@angular/common": "^13.2.0",
        "@angular/core": "^13.2.0",
        "@angular/platform-browser": "^13.2.0",
        "@angular/platform-browser-dynamic": "^13.2.0",
        "@fortawesome/angular-fontawesome": "^0.10.2",
        "@fortawesome/fontawesome-svg-core": "^6.1.0",
        "@fortawesome/free-brands-svg-icons": "^6.1.0",
        "@fortawesome/pro-duotone-svg-icons": "^6.1.0",
        "@fortawesome/pro-light-svg-icons": "^6.1.0",
        "@fortawesome/pro-regular-svg-icons": "^6.1.0",
        "@fortawesome/pro-solid-svg-icons": "^6.1.0",
        "@simplysm/sd-angular": "~7.0.0",
        "@simplysm/sd-core-browser": "~7.0.0",
        "@simplysm/sd-core-common": "~7.0.0",
        "rxjs": "^6.6.7",
        "zone.js": "~0.11.4"
      }
    });

    this._logger.debug(`[${pkgName}] 'src/app-icons.ts' 파일 등록`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, "src/app-icons.ts"), fc_package_appicons());

    this._logger.debug(`[${pkgName}] 'src/AppModule.ts' 파일 등록`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, "src/AppModule.ts"), fc_package_AppModule());

    this._logger.debug(`[${pkgName}] 'src/AppPage.ts' 파일 등록`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, "src/AppPage.ts"), fc_package_AppPage());

    this._logger.debug(`[${pkgName}] 'src/index.html' 파일 등록`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, "src/index.html"), fc_package_index({
      description: opt.description
    }));

    this._logger.debug(`[${pkgName}] 'src/main.ts' 파일 등록`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, "src/main.ts"), fc_package_client_main());

    this._logger.debug(`[${pkgName}] 'src/manifest.json' 파일 등록`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, "src/manifest.json"), fc_package_manifest({
      description: projNpmConfig.description,
      author: projNpmConfig.author,
      version: projNpmConfig.version
    }));

    this._logger.debug(`[${pkgName}] 'src/polyfills.ts' 파일 등록`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, "src/polyfills.ts"), fc_package_polyfills());

    this._logger.debug(`[${pkgName}] 'src/styles.scss' 파일 등록`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, "src/styles.scss"), fc_package_styles());

    this._logger.debug(`[${pkgName}] 'src/assets' 파일 복사`);
    await FsUtil.copyAsync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), "file/assets"),
      path.resolve(pkgPath, "src")
    );

    await this._addPackageToSimplysmJson({
      name: pkgName,
      type: "client",
      useAutoIndex: false,
      serverName: opt.serverName
    });
  }

  private async _addPackageBaseTemplate(opt: { name: string; description: string; useDom: boolean; isModule: boolean; isForAngular: boolean; main?: string; types?: string; dependencies: Record<string, string> }): Promise<void> {
    const pkgPath = path.resolve(this._rootPath, "packages", opt.name);

    this._logger.debug(`[${opt.name}] '.eslintrc.cjs' 파일 생성`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, ".eslintrc.cjs"), fc_package_eslintrc({
      isForAngular: opt.isForAngular
    }));

    this._logger.debug(`[${opt.name}] 'package.json' 파일 생성`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, "package.json"), fc_package_npmconfig({
      projPath: this._rootPath,
      name: opt.name,
      description: opt.description,
      isModule: opt.isModule,
      main: opt.main,
      types: opt.types,
      dependencies: opt.dependencies
    }));

    this._logger.debug(`[${opt.name}] 'tsconfig.json' 파일 생성`);
    await FsUtil.writeFileAsync(path.resolve(pkgPath, "tsconfig.json"), fc_package_tsconfig({
      isModule: opt.isModule,
      useDom: opt.useDom
    }));

    this._logger.debug(`[${opt.name}] 'src' 디렉토리 생성`);
    await FsUtil.mkdirsAsync(path.resolve(pkgPath, "src"));
  }

  private async _addPackageToSimplysmJson(opt: { name: string; type: string; useAutoIndex: boolean; serverName?: string }): Promise<void> {
    const config = await FsUtil.readJsonAsync(path.resolve(this._rootPath, "simplysm.json"));
    config.packages = config.packages ?? {};
    config.packages[opt.name] = {
      type: opt.type,
      ...opt.useAutoIndex ? { autoIndex: {} } : {},
      ...opt.serverName !== undefined ? { server: opt.serverName } : {}
    };
    await FsUtil.writeJsonAsync(path.resolve(this._rootPath, "simplysm.json"), config, { space: 2 });
  }

  private async _getProjNpmConfigAsync(): Promise<INpmConfig & { description: string; author: string }> {
    const projNpmConfig = await FsUtil.readJsonAsync(path.resolve(this._rootPath, "package.json")) as INpmConfig;

    if (projNpmConfig.description === undefined) {
      throw new Error("프로젝트 package.json 파일에 description 이 설정되어있지 않습니다.");
    }
    if (projNpmConfig.author === undefined) {
      throw new Error("프로젝트 package.json 파일에 author 가 설정되어있지 않습니다.");
    }

    return projNpmConfig as any;
  }
}
