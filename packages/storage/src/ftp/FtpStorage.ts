import * as fs from "fs";
import {IStorage} from "../common/IStorage";
import {IFtpConnectionConfig} from "./IFtpConnectionConfig";
import * as JSFtp from "jsftp";
import {Logger} from "@simplysm/common";

export class FtpStorage implements IStorage {
  private readonly _logger = new Logger("@simplysm/storage");
  private _ftp?: JSFtp;

  public async connectAsync(connectionConfig: IFtpConnectionConfig): Promise<void> {
    this._ftp = new JSFtp({
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.user,
      pass: connectionConfig.password
    });
    this._ftp.keepAlive(30000);

    await new Promise<void>((resolve, reject) => {
      if (!this._ftp) {
        throw new Error("FTP 서버에 연결되어있지 않습니다.");
      }

      this._ftp.raw("OPTS UTF8 ON", (err: Error) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  public async mkdirAsync(storageDirPath: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (!this._ftp) {
        throw new Error("FTP 서버에 연결되어있지 않습니다.");
      }

      this._ftp.raw("MKD", storageDirPath, (err: Error) => {
        if (err && err["code"] !== 550) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  public async putAsync(localPathOrBuffer: string | Buffer, storageFilePath: string): Promise<void> {
    const buffer = typeof localPathOrBuffer === "string"
      ? fs.readFileSync(localPathOrBuffer)
      : localPathOrBuffer;

    await new Promise<void>((resolve, reject) => {
      if (!this._ftp) {
        throw new Error("FTP 서버에 연결되어있지 않습니다.");
      }

      this._ftp.put(buffer, storageFilePath, (err: Error) => {
        if (err) {
          if (err["code"] === 550) {
            this._logger.warn(`${storageFilePath}: ${err.message}`);
          }
          else {
            reject(err);
            return;
          }
        }
        resolve();
      });
    });
  }

  public async closeAsync(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (!this._ftp) {
        reject(new Error("FTP 서버에 연결되어있지 않습니다."));
        return;
      }

      this._ftp!.destroy();
      resolve();
    });
  }
}
