import * as path from "path";
import { FsUtil, Logger, SdProcess } from "@simplysm/sd-core-node";
import xml2js from "xml2js";
import JSZip from "jszip";
import { INpmConfig } from "../types/common-configs.type";
import { ISdClientBuilderCordovaConfig } from "../types/sd-configs.type";

const BIN_PATH = path.resolve(process.cwd(), "node_modules/.bin/cordova.cmd");

export class SdCliCordova {
  private _logger = Logger.get(["simplysm", "sd-cli", "SdCliCordova"]);

  private _platforms: string[];
  private _npmConfig: INpmConfig;

  constructor(private readonly _opt: { pkgPath: string; config: ISdClientBuilderCordovaConfig }) {
    this._platforms = Object.keys(this._opt.config.platform ?? { browser: {} });
    this._npmConfig = FsUtil.readJson(path.resolve(this._opt.pkgPath, "package.json"));
    // this._logger = Logger.get(["simplysm", "sd-cli", this.constructor.name, this._npmConfig.name]);
  }

  private async _execAsync(cmd: string, cwd: string): Promise<void> {
    this._logger.debug(cmd);
    const msg = await SdProcess.spawnAsync(cmd, { cwd });
    this._logger.debug(msg);
  }

  public async initializeAsync(): Promise<void> {
    const cordovaPath = path.resolve(this._opt.pkgPath, ".cordova");

    if (FsUtil.exists(cordovaPath)) {
      this._logger.log("이미 생성되어있는 '.cordova'를 사용합니다.");
    } else {
      await this._execAsync(`${BIN_PATH} telemetry on`, this._opt.pkgPath);

      // 프로젝트 생성
      await this._execAsync(
        `${BIN_PATH} create "${cordovaPath}" "${this._opt.config.appId}" "${this._opt.config.appName}"`,
        process.cwd(),
      );
    }

    // platforms 폴더 혹시 없으면 생성
    FsUtil.mkdirs(path.resolve(cordovaPath, "platforms"));

    // www 폴더 혹시 없으면 생성
    FsUtil.mkdirs(path.resolve(cordovaPath, "www"));

    // 미설치 빌드 플랫폼 신규 생성
    const alreadyPlatforms = FsUtil.readdir(path.resolve(cordovaPath, "platforms"));
    for (const platform of this._platforms) {
      if (!alreadyPlatforms.includes(platform)) {
        if (platform === "android") {
          await this._execAsync(`${BIN_PATH} platform add ${platform}@12.0.0`, cordovaPath);
        } else {
          await this._execAsync(`${BIN_PATH} platform add ${platform}`, cordovaPath);
        }
      }
    }

    // 설치 미빌드 플랫폼 삭제
    for (const alreadyPlatform of alreadyPlatforms) {
      if (!this._platforms.includes(alreadyPlatform)) {
        await this._execAsync(`${BIN_PATH} platform remove ${alreadyPlatform}`, cordovaPath);
      }
    }

    // 설치된 미사용 플러그인 삭제
    const pluginsFetch = FsUtil.exists(path.resolve(cordovaPath, "plugins/fetch.json"))
      ? FsUtil.readJson(path.resolve(cordovaPath, "plugins/fetch.json"))
      : undefined;
    const alreadyPluginIds =
      pluginsFetch != undefined
        ? Object.keys(pluginsFetch)
        : // Object.values(pluginsFetch).map((item: any) => item.source.id ?? item.source.url ?? item.source.path)
          [];
    const usePlugins = ["cordova-plugin-ionic-webview", ...(this._opt.config.plugins ?? [])].distinct();

    for (const alreadyPluginId of alreadyPluginIds) {
      let hasPlugin = false;
      for (const usePlugin of usePlugins) {
        if (alreadyPluginId === usePlugin) {
          hasPlugin = true;
          break;
        }
        /*if (
          (usePlugin.includes("@") && alreadyPluginId === usePlugin) ||
          (!usePlugin.includes("@") && alreadyPluginId.replace(/@.*$/, "") === usePlugin)
        ) {
          hasPlugin = true;
          break;
        }*/
      }

      if (!hasPlugin) {
        await this._execAsync(`${BIN_PATH} plugin remove ${alreadyPluginId}`, cordovaPath);
      }
    }

    // 미설치 플러그인들 설치
    for (const usePlugin of usePlugins) {
      if (
        (usePlugin.includes("@") && !alreadyPluginIds.includes(usePlugin)) ||
        (!usePlugin.includes("@") &&
          !alreadyPluginIds.map((alreadyPluginId) => alreadyPluginId.replace(/@.*$/, "")).includes(usePlugin))
      ) {
        await this._execAsync(`${BIN_PATH} plugin add ${usePlugin}`, cordovaPath);
      }
    }

    // ANDROID SIGN 파일 복사
    if (this._opt.config.platform?.android?.sign) {
      FsUtil.copy(
        path.resolve(this._opt.pkgPath, this._opt.config.platform.android.sign.keystore),
        path.resolve(cordovaPath, "android.keystore"),
      );
    } else {
      FsUtil.remove(path.resolve(cordovaPath, "android.keystore"));
      // SIGN을 안쓸경우 아래 파일이 생성되어 있으면 오류남
      FsUtil.remove(path.resolve(cordovaPath, "platforms/android/release-signing.properties"));
    }

    // 빌드 옵션 파일 생성
    FsUtil.writeJson(path.resolve(cordovaPath, "build.json"), {
      ...(this._opt.config.platform?.android
        ? {
            android: {
              release: {
                packageType: this._opt.config.platform.android.bundle ? "bundle" : "apk",
                ...(this._opt.config.platform.android.sign
                  ? {
                      keystore: path.resolve(cordovaPath, "android.keystore"),
                      storePassword: this._opt.config.platform.android.sign.storePassword,
                      alias: this._opt.config.platform.android.sign.alias,
                      password: this._opt.config.platform.android.sign.password,
                      keystoreType: this._opt.config.platform.android.sign.keystoreType,
                    }
                  : {}),
              },
            },
          }
        : {}),
    });

    // ICON 파일 복사
    if (this._opt.config.icon != null) {
      FsUtil.copy(
        path.resolve(this._opt.pkgPath, this._opt.config.icon),
        path.resolve(cordovaPath, "res/icons", path.basename(this._opt.config.icon)),
      );
    } else {
      FsUtil.remove(path.resolve(cordovaPath, "res/icons"));
    }

    // SplashScreen 파일 생성
    if (this._opt.config.platform?.android && this._opt.config.icon != null) {
      FsUtil.writeFile(
        path.resolve(cordovaPath, "res/screen/android/splashscreen.xml"),
        `
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item
    android:width="48dp"
    android:height="48dp"
    android:drawable="@mipmap/ic_launcher"
    android:gravity="center" />
</layer-list>`.trim(),
      );
    }

    // CONFIG: 초기값 백업
    const configFilePath = path.resolve(cordovaPath, "config.xml");
    const configBackFilePath = path.resolve(cordovaPath, "config.xml.bak");
    if (!FsUtil.exists(configBackFilePath)) {
      FsUtil.copy(configFilePath, configBackFilePath);
    }

    // CONFIG: 초기값 읽기
    const configFileContent = FsUtil.readFile(configBackFilePath);
    const configXml = await xml2js.parseStringPromise(configFileContent);

    // CONFIG: 버전 설정
    configXml.widget.$.version = this._npmConfig.version;

    // CONFIG: ICON 설정
    if (this._opt.config.icon != null) {
      configXml["widget"]["icon"] = [{ $: { src: "res/icons/" + path.basename(this._opt.config.icon) } }];
    }

    // CONFIG: 접근허용 세팅
    configXml["widget"]["access"] = [{ $: { origin: "*" } }];
    configXml["widget"]["allow-navigation"] = [{ $: { href: "*" } }];
    configXml["widget"]["allow-intent"] = [{ $: { href: "*" } }];
    configXml["widget"]["preference"] = [{ $: { name: "MixedContentMode", value: "0" } }];

    // CONFIG: ANDROID usesCleartextTraffic 설정 및 splashscreen 파일 설정
    if (this._opt.config.platform?.android) {
      configXml.widget.$["xmlns:android"] = "http://schemas.android.com/apk/res/android";

      configXml["widget"]["platform"] = configXml["widget"]["platform"] ?? [];

      const androidPlatform = {
        "$": {
          name: "android",
        },
        "preference": [
          {
            $: {
              name: "AndroidWindowSplashScreenAnimatedIcon",
              value: "res/screen/android/splashscreen.xml",
            },
          },
        ],
        "edit-config": [
          {
            $: {
              file: "app/src/main/AndroidManifest.xml",
              mode: "merge",
              target: "/manifest/application",
            },
            application: [
              {
                $: {
                  "android:usesCleartextTraffic": "true",
                },
              },
            ],
          },
        ],
      };

      if (this._opt.config.platform.android.sdkVersion != null) {
        androidPlatform.preference.push(
          ...[
            {
              $: {
                name: "android-maxSdkVersion",
                value: `${this._opt.config.platform.android.sdkVersion}`,
              },
            },
            {
              $: {
                name: "android-minSdkVersion",
                value: `${this._opt.config.platform.android.sdkVersion}`,
              },
            },
            {
              $: {
                name: "android-targetSdkVersion",
                value: `${this._opt.config.platform.android.sdkVersion}`,
              },
            },
            {
              $: {
                name: "android-compileSdkVersion",
                value: `33`,
              },
            },
          ],
        );
      }

      if (this._opt.config.platform.android.permissions) {
        androidPlatform["config-file"] = androidPlatform["config-file"] ?? [];
        androidPlatform["config-file"].push({
          "$": {
            target: "AndroidManifest.xml",
            parent: "/*",
          },
          "uses-permission": this._opt.config.platform.android.permissions.map((perm) => ({
            $: {
              "android:name": `android.permission.${perm.name}`,
              ...(perm.maxSdkVersion != null
                ? {
                    "android:maxSdkVersion": `${perm.maxSdkVersion}`,
                  }
                : {}),
            },
          })),
        });
      }

      configXml["widget"]["platform"].push(androidPlatform);
    }

    // CONFIG: 파일 새로 쓰기
    const configResultContent = new xml2js.Builder().buildObject(configXml);
    FsUtil.writeFile(configFilePath, configResultContent);

    // 각 플랫폼 www 준비
    await this._execAsync(`${BIN_PATH} prepare`, cordovaPath);
  }

  public async buildAsync(outPath: string): Promise<void> {
    const cordovaPath = path.resolve(this._opt.pkgPath, ".cordova");

    // 실행
    const buildType = this._opt.config.debug ? "debug" : "release";
    for (const platform of this._platforms) {
      await this._execAsync(`${BIN_PATH} build ${platform} --${buildType}`, cordovaPath);
    }

    for (const platform of Object.keys(this._opt.config.platform ?? {})) {
      const targetOutPath = path.resolve(outPath, platform);

      // 결과물 복사: ANDROID
      if (platform === "android") {
        const apkFileName = this._opt.config.platform!.android!.sign
          ? `app-${buildType}.apk`
          : `app-${buildType}-unsigned.apk`;
        const latestDistApkFileName = path.basename(
          `${this._opt.config.appName}${this._opt.config.platform!.android!.sign ? "" : "-unsigned"}-latest.apk`,
        );
        FsUtil.mkdirs(targetOutPath);
        FsUtil.copy(
          path.resolve(cordovaPath, "platforms/android/app/build/outputs/apk", buildType, apkFileName),
          path.resolve(targetOutPath, latestDistApkFileName),
        );
      }

      // 자동업데이트를 위한 파일 쓰기 (ZIP)
      const zip = new JSZip();
      const wwwFiles = FsUtil.glob(path.resolve(cordovaPath, "www/**/*"), { nodir: true });
      for (const wwwFile of wwwFiles) {
        const relFilePath = path.relative(path.resolve(cordovaPath, "www"), wwwFile);
        const fileBuffer = FsUtil.readFileBuffer(wwwFile);
        zip.file(relFilePath, fileBuffer);
      }
      const platformWwwFiles = FsUtil.glob(path.resolve(cordovaPath, "platforms", platform, "platform_www/**/*"), {
        nodir: true,
      });
      for (const platformWwwFile of platformWwwFiles) {
        const relFilePath = path.relative(
          path.resolve(cordovaPath, "platforms", platform, "platform_www"),
          platformWwwFile,
        );
        const fileBuffer = FsUtil.readFileBuffer(platformWwwFile);
        zip.file(relFilePath, fileBuffer);
      }

      FsUtil.writeFile(
        path.resolve(path.resolve(outPath, platform, "updates"), this._npmConfig.version + ".zip"),
        await zip.generateAsync({ type: "nodebuffer" }),
      );
    }
  }

  public static async runWebviewOnDeviceAsync(opt: { platform: string; pkgName: string; url?: string }): Promise<void> {
    const cordovaPath = path.resolve(process.cwd(), `packages/${opt.pkgName}/.cordova/`);

    if (opt.url !== undefined) {
      FsUtil.remove(path.resolve(cordovaPath, "www"));
      FsUtil.mkdirs(path.resolve(cordovaPath, "www"));
      FsUtil.writeFile(
        path.resolve(cordovaPath, "www/index.html"),
        `'${opt.url}'로 이동중... <script>setTimeout(function () {window.location.href = "${opt.url.replace(/\/$/, "")}/${opt.pkgName}/cordova/"}, 3000);</script>`.trim(),
      );
    }

    const binPath = path.resolve(process.cwd(), "node_modules/.bin/cordova.cmd");
    await SdProcess.spawnAsync(`${binPath} run ${opt.platform} --device`, { cwd: cordovaPath }, true);
  }
}
