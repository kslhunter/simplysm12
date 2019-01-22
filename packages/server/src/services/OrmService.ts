import {SdServiceBase} from "../SdServiceBase";
import {DateOnly, DateTime, ISdOrmConnectionConfig, ISdOrmQueryDef, Logger, Time} from "@simplysm/common";
import {SdOrmConnection} from "../libs/orm/SdOrmConnection";

export class OrmService extends SdServiceBase {
  private readonly _logger = new Logger("@simplysm/server", "OrmService");
  private static readonly _connections = new Map<number, SdOrmConnection>();

  public async connectAsync(config: ISdOrmConnectionConfig): Promise<number> {
    const conn = new SdOrmConnection(config);

    const lastConnId = Array.from(OrmService._connections.keys()).max() || 0;
    const connId = lastConnId + 1;
    OrmService._connections.set(connId, conn);

    await conn.connectAsync();
    this.conn.addCloseListener("orm-service." + connId, async () => {
      await conn.closeAsync();
      this._logger.warn("소켓연결이 끊어져, DB 연결이 중지되었습니다.");
    });

    conn.addCloseListener("orm-service." + connId, async () => {
      OrmService._connections.delete(connId);
    });

    return connId;
  }

  public async closeAsync(connId: number): Promise<void> {
    this.conn.removeCloseListener("orm-service." + connId);

    const conn = OrmService._connections.get(connId);
    if (!conn) {
      throw new Error("DB에 연결되어있지 않습니다.");
    }

    await conn.closeAsync();
  }

  public async beginTransactionAsync(connId: number): Promise<void> {
    const conn = OrmService._connections.get(connId);
    if (!conn) {
      throw new Error("DB에 연결되어있지 않습니다.");
    }

    await conn.beginTransactionAsync();
  }

  public async commitTransactionAsync(connId: number): Promise<void> {
    const conn = OrmService._connections.get(connId);
    if (!conn) {
      throw new Error("DB에 연결되어있지 않습니다.");
    }

    await conn.commitTransactionAsync();
  }

  public async rollbackTransactionAsync(connId: number): Promise<void> {
    const conn = OrmService._connections.get(connId);
    if (!conn) {
      throw new Error("DB에 연결되어있지 않습니다.");
    }

    await conn.rollbackTransactionAsync();
  }

  public async executeAsync(connId: number, queries: (string | ISdOrmQueryDef)[], colDefs?: { name: string; dataType: string | undefined }[], joinDefs?: { as: string; isSingle: boolean }[]): Promise<any[][]> {
    const conn = OrmService._connections.get(connId);
    if (!conn) {
      throw new Error("DB에 연결되어있지 않습니다.");
    }

    const result = await conn.executeAsync(queries);
    return (colDefs && joinDefs) ? this._generateResult(result[0], colDefs, joinDefs) : result;
  }

  private _generateResult(arr: any[] | undefined, colDefs: { name: string; dataType: string | undefined }[], joinDefs: { as: string; isSingle: boolean }[]): any[] {
    if (!arr) return [];

    let result: any[] = arr;

    for (const item of result) {
      for (const key of Object.keys(item)) {
        const colDef = colDefs.single(item1 => item1.name === key)!;
        if (item[key] && colDef.dataType === "DateTime") {
          item[key] = DateTime.parse(item[key]);
        }
        else if (item[key] && colDef.dataType === "DateOnly") {
          item[key] = DateOnly.parse(item[key]);
        }
        else if (item[key] && colDef.dataType === "Time") {
          item[key] = Time.parse(item[key]);
        }
      }
    }

    for (const joinDef of joinDefs) {
      const grouped: { key: any; values: any[] }[] = [];
      for (const item of result) {
        const keys = Object.keys(item)
          .filter(key => !key.startsWith(joinDef.as + "."));

        const valueKeys = Object.keys(item)
          .filter(valueKey => valueKey.startsWith(joinDef.as + "."))
          .distinct();

        const keyObj = {};
        for (const key of keys) {
          keyObj[key] = item[key];
        }

        const valueObj = {};
        for (const valueKey of valueKeys) {
          valueObj[valueKey.slice(joinDef.as.length + 1)] = item[valueKey];
        }

        const exists = grouped.single(g => Object.equal(g.key, keyObj));
        if (exists) {
          exists.values.push(valueObj);
        }
        else {
          grouped.push({
            key: keyObj,
            values: [valueObj]
          });
        }
      }

      result = grouped.map(item => ({
        ...item.key,
        [joinDef.as]: item.values
      }));

      if (joinDef.isSingle) {
        result = result.map(item => ({
          ...item,
          [joinDef.as]: item[joinDef.as][0]
        }));
      }
    }

    const clearEmpty = (item: any) => {
      if (item instanceof DateTime || item instanceof DateOnly || item instanceof Time) {
        return item;
      }
      if (item instanceof Array) {
        for (let i = 0; i < item.length; i++) {
          item[i] = clearEmpty(item[i]);
        }

        if (item.every(itemItem => itemItem == undefined)) {
          return undefined;
        }
      }
      else if (item instanceof Object) {
        for (const key of Object.keys(item)) {
          item[key] = clearEmpty(item[key]);
        }

        if (Object.keys(item).every(key => item[key] == undefined)) {
          return undefined;
        }
      }

      return item;
    };

    return clearEmpty(result) || [];
  }
}
