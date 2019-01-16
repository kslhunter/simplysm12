import {CompilerOptions} from "typescript";

type SdConfigFileJsonPackageConfigOfType<T> = T & {
  extends?: string[];
  development?: T;
  production?: T;
};
export type SdConfigFileJsonPackageConfigTypes = SdConfigFileJsonPackageConfigOfType<ISdPackageConfig>;


export interface ISdConfigFileJson {
  packages: { [key: string]: SdConfigFileJsonPackageConfigTypes };
  extends?: { [key: string]: SdConfigFileJsonPackageConfigTypes };
  localUpdates?: { [key: string]: string };
}

export interface ISdProjectConfig {
  packages: { [key: string]: ISdPackageConfig };
  localUpdates?: { [key: string]: string };
}

export interface ISdPackageConfig {
  type?: "none" | "dom" | "node" | "web" | "cordova.android" | "cordova.browser" | "electron.windows";
  publish?: ISdPublishConfig;
  env?: { [key: string]: any };
  vhost?: string;
  server?: {
    host?: string;
    port?: number;
  };
}

export interface ISdPublishConfig {
  protocol?: "npm" | "ftp" | "WebDAV";
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  rootPath?: string;
}


export interface ITsConfig {
  extends?: string;
  compilerOptions?: CompilerOptions & { paths?: { [key: string]: string[] } };
  files?: string[];
}

export interface INpmConfig {
  name: string;
  version: string;
  dependencies?: { [key: string]: string }[];
  devDependencies?: { [key: string]: string }[];
  peerDependencies?: { [key: string]: string }[];
}
