import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import * as path from "path";
import {EventEmitter} from "events";
import {ISdServerRequest, ISdServerResponse, JsonConvert, Logger} from "@simplysm/common";
import {SdServerConnection} from "./SdServerConnection";
import {SdServiceBase} from "./SdServiceBase";
import * as net from "net";

interface IEventListener {
  id: number;
  eventName: string;
  info: object;
  conn: SdServerConnection;
}

export class SdServer extends EventEmitter {
  private readonly _logger = new Logger("@simplysm/ws-server", "SdServer");

  public expressServer?: express.Application;
  private _httpServer?: http.Server;
  private _wsServer?: WebSocket.Server;
  private _wsConnections: SdServerConnection[] = [];
  private _httpConnections: net.Socket[] = [];
  private _eventListeners: IEventListener[] = [];

  public get isListening(): boolean {
    return !!this._httpServer && !!this._httpServer.listening;
  }

  public constructor() {
    super();
  }

  public async listenAsync(port?: number): Promise<void> {
    if (this.isListening) {
      await this.closeAsync();
    }

    await new Promise<void>((resolve, reject) => {
      this.expressServer = express();
      this.expressServer.use(express.static("www"));
      this._httpServer = http.createServer(this.expressServer);
      this._wsServer = new WebSocket.Server({server: this._httpServer});
      this._wsConnections = [];
      this._eventListeners = [];

      this._wsServer.on("connection", async (conn, connReq) => {
        this._logger.log(`클라이언트의 연결 요청을 받았습니다 : ${connReq.headers.origin}`);
        const wsConnection = new SdServerConnection(conn, connReq);
        this._wsConnections.push(wsConnection);

        wsConnection.on("request", async req => {
          this._logger.log(`요청을 받았습니다 : ${connReq.headers.origin} - ${JsonConvert.stringify(req, {hideBuffer: true})}`);
          let res: ISdServerResponse;
          try {
            res = await this._onRequestAsync(wsConnection, req);
          }
          catch (err) {
            this._logger.error(`에러가 발생했습니다 : ${connReq.headers.origin}`, err);
            res = {
              requestId: req.id,
              type: "error",
              body: err.message
            };
          }
          this._logger.log(`결과를 반환합니다. : ${connReq.headers.origin} - ${JsonConvert.stringify(res, {hideBuffer: true})}`);
          await wsConnection.sendAsync(res);
        });

        wsConnection.on("close", () => {
          this._eventListeners.remove(item => item.conn === wsConnection);
          this._wsConnections.remove(wsConnection);
        });
      });

      this._httpServer.listen(port || 80, (err: Error) => {
        if (err) {
          reject(err);
          return;
        }
        this._httpServer!.on("connection", conn => {
          this._httpConnections.push(conn);

          conn.on("close", () => {
            this._httpConnections.remove(conn);
          });
        });

        this._httpServer!.on("close", () => {
          this.emit("close");
          delete this.expressServer;
          delete this._httpServer;
          delete this._wsServer;
          this._wsConnections = [];
          this._httpConnections = [];
          this._eventListeners = [];
        });

        resolve();
      });
    });
  }

  public async closeAsync(): Promise<void> {
    await Promise.all(this._wsConnections.map(async wsConnection => {
      await wsConnection.closeAsync();
    }));

    await new Promise<void>((resolve, reject) => {
      this._wsServer!.close(err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    for (const httpConnection of this._httpConnections) {
      httpConnection.end();
    }

    await new Promise<void>((resolve, reject) => {
      this._httpServer!.close((err: Error) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  public async emitAsync(id: number, data: any): Promise<void> {
    const eventListener = this._eventListeners.single(item => item.id === id);
    if (!eventListener) return;

    await eventListener.conn.sendAsync({
      eventListenerId: eventListener.id,
      data
    });
  }

  private async _onRequestAsync(conn: SdServerConnection, req: ISdServerRequest): Promise<ISdServerResponse> {
    if (req.command === "addEventListener") {
      const eventListenerId = (this._eventListeners.max(item => item.id) || 0) + 1;

      this._eventListeners.push({
        id: eventListenerId,
        eventName: req.params[0],
        info: req.params[1],
        conn
      });

      return {
        requestId: req.id,
        type: "response",
        body: eventListenerId
      };
    }
    else if (req.command === "getEventListeners") {
      const eventName = req.params[0];

      return {
        requestId: req.id,
        type: "response",
        body: this._eventListeners.filter(item => item.eventName === eventName).map(item => ({
          id: item.id,
          info: item.info
        }))
      };
    }
    else if (req.command === "emitEvent") {
      const ids: number[] = req.params[0];
      const data = req.params[1];

      for (const id of ids) {
        await this.emitAsync(id, data);
      }

      return {
        requestId: req.id,
        type: "response"
      };
    }
    else {
      // COMMAND 분할
      const cmdSplit = req.command.split(".");
      const serviceName = cmdSplit[0];
      const methodName = cmdSplit[1];

      // 서비스 가져오기
      const serviceFileAddr = path.resolve(__dirname, "services", `${serviceName}`);
      const serviceClass = require(serviceFileAddr)[serviceName];

      const service = new serviceClass() as SdServiceBase;
      service.request = req;
      service.server = this;
      service.conn = conn;

      // 메소드 가져오기
      const method = service[methodName];
      if (!method) {
        throw new Error(`메소드[${serviceName}.${methodName}]를 찾을 수 없습니다.`);
      }

      // 실행
      const result = await method.apply(service, req.params);

      // 반환
      return {
        requestId: req.id,
        type: "response",
        body: result
      };
    }
  }
}
