export type ISimpackConfig = ISimpackClientConfig | ISimpackServerConfig | ISimpackModelConfig;

export interface ISimpackClientConfig {
    type: "client";
    title: string;
    host: string;
    port: number;
    defaultRoute: string;
    server: {
        host: string;
        port: number;
    };
    env: { [key: string]: string };
}

export interface ISimpackServerConfig {
    type: "server";
    host: string;
    port: number;
    clients: string[];
    env: { [key: string]: string };
}

export interface ISimpackModelConfig {
    type: "model";
    dist: string;
    useCamelCase?: boolean;
}
