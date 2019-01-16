import * as path from "path";
import * as fs from "fs-extra";
import * as os from "os";
import {INpmConfig, ISdConfigFileJson, ITsConfig, SdPackageConfigTypes} from "./commons";
import {optional} from "@simplysm/common";

export class SdProjectBuilderUtil {
  public static getProjectPath(...args: string[]): string {
    return path.resolve(process.cwd(), ...args);
  }

  public static getPackagesPath(...args: string[]): string {
    return SdProjectBuilderUtil.getProjectPath("packages", ...args);
  }

  public static getTsConfigPath(packageKey: string, isForBuild: boolean = false): string {
    return SdProjectBuilderUtil.getPackagesPath(packageKey, `tsconfig${isForBuild ? ".build" : ""}.json`);
  }

  public static async readTsConfigAsync(packageKey: string, isForBuild: boolean = false): Promise<ITsConfig> {
    const tsconfigPath = SdProjectBuilderUtil.getTsConfigPath(packageKey, isForBuild);
    return await fs.pathExists(tsconfigPath) ? await fs.readJson(tsconfigPath) : {};
  }

  public static async writeTsConfigAsync(packageKey: string, tsconfig: ITsConfig, isForBuild: boolean = false): Promise<void> {
    const tsconfigPath = SdProjectBuilderUtil.getTsConfigPath(packageKey, isForBuild);
    await fs.writeJson(tsconfigPath, tsconfig, {spaces: 2, EOL: os.EOL});
  }

  public static async readConfigAsync(env: "development" | "production"): Promise<{ [key: string]: SdPackageConfigTypes }> {
    const orgConfig: ISdConfigFileJson = await fs.readJson(SdProjectBuilderUtil.getProjectPath("simplysm.json"));

    const result: { [key: string]: SdPackageConfigTypes } = {};
    for (const packageKey of Object.keys(orgConfig.packages)) {
      let currPackageConfig: SdPackageConfigTypes = {};
      currPackageConfig = SdProjectBuilderUtil._mergePackageConfigExtends(currPackageConfig, orgConfig, orgConfig.packages[packageKey].extends);

      if (orgConfig.packages[packageKey][env]) {
        currPackageConfig = Object.merge(currPackageConfig, orgConfig.packages[packageKey][env]);
      }

      const orgPackageConfig = Object.clone(orgConfig.packages[packageKey]);
      delete orgPackageConfig.extends;
      delete orgPackageConfig.development;
      delete orgPackageConfig.production;
      currPackageConfig = Object.merge(currPackageConfig, orgPackageConfig);

      if (!currPackageConfig.type) {
        throw new Error("타입이 지정되지 않은 패키지가 있습니다.");
      }

      result[packageKey] = currPackageConfig;
    }

    return result;
  }

  private static _mergePackageConfigExtends(curr: SdPackageConfigTypes, orgConfig: ISdConfigFileJson, extendNames?: string[]): SdPackageConfigTypes {
    if (extendNames) {
      let result = Object.clone(curr);
      for (const extendName of extendNames) {
        const extendConfig = optional(orgConfig, o => o.extends![extendName]);
        if (!extendConfig) {
          throw new Error(`설정에서 확장 "${extendName}"를 찾을 수 없습니다.`);
        }
        result = this._mergePackageConfigExtends(result, orgConfig, extendConfig.extends);
        result = Object.merge(result, extendConfig);
      }
      return result;
    }
    return Object.clone(curr);
  }

  public static getNpmConfigPath(packageKey: string): string {
    return SdProjectBuilderUtil.getPackagesPath(packageKey, "package.json");
  }

  public static async readNpmConfigAsync(packageKey: string): Promise<INpmConfig> {
    const configPath = SdProjectBuilderUtil.getNpmConfigPath(packageKey);
    return await fs.readJson(configPath);
  }

  public static async writeNpmConfigAsync(packageKey: string, npmConfig: INpmConfig): Promise<void> {
    const configPath = SdProjectBuilderUtil.getNpmConfigPath(packageKey);
    await fs.writeJson(configPath, npmConfig, {spaces: 2, EOL: os.EOL});
  }

  public static getProjectNpmConfigPath(): string {
    return SdProjectBuilderUtil.getProjectPath("package.json");
  }

  public static async readProjectNpmConfig(): Promise<INpmConfig> {
    const configPath = SdProjectBuilderUtil.getProjectNpmConfigPath();
    return await fs.readJson(configPath);
  }

  public static getTsLintPath(packageKey: string): string {
    return SdProjectBuilderUtil.getPackagesPath(packageKey, "tslint.json");
  }
}
