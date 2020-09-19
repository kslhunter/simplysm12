import {
  TEntity,
  TEntityValue,
  TEntityValueOrQueryable,
  TEntityValueOrQueryableArray,
  TQueryValue,
  TQueryValueOrSelect,
  TQueryValueOrSelectArray
} from "../common";
import {QueryUnit} from "../query/QueryUnit";
import {DateOnly, DateTime, JsonConvert, Time, Type, Uuid} from "@simplysm/sd-core-common";
import {Queryable} from "../query/Queryable";
import {IQueryResultParseOption} from "../query-definition";

export class QueryUtils {
  public static getQueryValue(value: TEntityValueOrQueryable): TQueryValueOrSelect | TQueryValueOrSelectArray {
    // TODO: MSSQL/MYSQL 달라짐
    if (value instanceof QueryUnit) {
      if (value.query instanceof Array) {
        return QueryUtils.getQueryValueArray(value.query);
      }
      else if (value.query instanceof QueryUnit) {
        return QueryUtils.getQueryValue(value.query);
      }
      else if (value.query instanceof Queryable) {
        return QueryUtils.getQueryValue(value.query);
      }
      else {
        return value.query;
      }
    }
    else if (typeof value === "string") {
      return `N'${value.replace(/'/g, "''")}'`;
    }
    else if (value instanceof Queryable) {
      const selectDef = value.getSelectDef();
      if (selectDef.top !== 1) {
        throw new Error("하나의 필드를 추출하기 위한 내부쿼리에서는 반드시 TOP 1 이 지정 되야 합니다.");
      }
      if (!selectDef.select || Object.keys(selectDef.select).length > 1) {
        throw new Error("하나의 필드를 추출하기 위한 내부쿼리에서는 반드시 하나의 컬럼만 SELECT 되야 합니다.");
      }

      return selectDef;
    }
    else if (value === undefined) {
      return "NULL";
    }
    else {
      return value;
    }
  }

  public static getQueryValueArray(arr: TEntityValueOrQueryableArray): TQueryValueOrSelectArray {
    return arr.map(item => {
      if (item instanceof Array) {
        return QueryUtils.getQueryValueArray(item);
      }
      else if (item instanceof QueryUnit) {
        return QueryUtils.getQueryValue(item);
      }
      else if (item instanceof Queryable) {
        return QueryUtils.getQueryValue(item);
      }
      else {
        return item;
      }
    });
  }

  public static canGetQueryValue(value: any): boolean {
    return ["undefined", "boolean", "number", "string"].includes(typeof value) ||
      value instanceof QueryUnit ||
      value instanceof Number ||
      value instanceof String ||
      value instanceof Boolean ||
      value instanceof DateOnly ||
      value instanceof DateTime ||
      value instanceof Time ||
      value instanceof Uuid ||
      value instanceof Buffer;
  }

  public static getQueryValueType<T extends TQueryValue>(value: QueryUnit<T, any> | T): Type<T> | undefined {
    if (value instanceof QueryUnit) {
      return value.type as any;
    }
    else if (value instanceof Number || typeof value === "number") {
      return Number as any;
    }
    else if (value instanceof String || typeof value === "string") {
      return String as any;
    }
    else if (value instanceof Boolean || typeof value === "boolean") {
      return Boolean as any;
    }
    else if (value instanceof DateOnly) {
      return DateOnly as any;
    }
    else if (value instanceof DateTime) {
      return DateTime as any;
    }
    else if (value instanceof Time) {
      return Time as any;
    }
    else if (value instanceof Uuid) {
      return Uuid as any;
    }
    else if (value instanceof Buffer) {
      return Buffer as any;
    }
    else if (value === undefined) {
      return undefined;
    }
    else {
      throw new Error(`QueryValue 를 추출할 수 있는 타입이 아닙니다: ${value}`);
    }
  }

  public static getValueFields<T>(entity: TEntity<T>, excludes?: string[]): TEntityValue<any>[] {
    const result: TEntityValue<any>[] = [];
    for (const key of Object.keys(entity)) {
      if (excludes?.includes(key)) continue;

      if (QueryUtils.canGetQueryValue(entity[key])) {
        result.push(entity[key]);
      }
      else if (entity[key] instanceof Array) {
        for (const itemItem of entity[key]) {
          result.push(...QueryUtils.getValueFields(itemItem));
        }
      }
      else if (entity[key] != undefined && typeof entity[key] === "object") {
        for (const itemItem of Object.values(entity[key] as object)) {
          result.push(...QueryUtils.getValueFields(itemItem));
        }
      }
    }

    return result;
  }

  public static parseQueryResult<T>(orgResults: any[], option?: IQueryResultParseOption): T[] {
    // 타입 변환
    let result: any[] = orgResults.map(item => {
      const obj: any = {};
      for (const key of Object.keys(item)) {
        if (item[key] == undefined) {
        }
        else if (option?.columns?.[key]?.dataType === "DateTime") {
          obj[key] = DateTime.parse(item[key]);
        }
        else if (option?.columns?.[key]?.dataType === "DateOnly") {
          obj[key] = DateOnly.parse(item[key]);
        }
        else if (option?.columns?.[key]?.dataType === "Time") {
          obj[key] = Time.parse(item[key]);
        }
        else if (option?.columns?.[key]?.dataType === "Uuid") {
          obj[key] = new Uuid(item[key]);
        }
        else if (option?.columns?.[key]?.dataType === "Boolean") {
          obj[key] = Boolean(item[key]);
        }
        else if (option?.columns?.[key]?.dataType === "Number") {
          obj[key] = Number.parseInt(item[key], 10);
        }
        else {
          obj[key] = item[key];
        }
      }
      return obj;
    });

    // JOIN 에 따른 데이터 구조 설정
    if (option?.joins && Object.keys(option.joins).length > 0) {
      const joinKeys = Object.keys(option.joins).orderByDesc(key => key.length);
      for (const joinKey of joinKeys) {
        // const grouped = new Map<string, any | any[]>();
        const grouped: { key: any; values: any | any[] }[] = [];
        const groupedMultiMapObj: { [key: string]: any | any[] } = {}; // new Map<string, any | any[]>();

        for (const item of result) {
          const keyObjKeys = Object.keys(item).filter(key => !key.startsWith(joinKey + "."));
          const keyObj = {};
          for (const keyObjKey of keyObjKeys) {
            keyObj[keyObjKey] = item[keyObjKey];
          }

          const valueObjKeys = Object.keys(item).filter(key => key.startsWith(joinKey + "."));
          const valueObj: any = {};
          for (const valueObjKey of valueObjKeys) {
            valueObj[valueObjKey.slice(joinKey.length + 1)] = item[valueObjKey];
          }

          if (option.joins[joinKey].isSingle) {
            grouped.push({key: keyObj, values: valueObj});
          }
          else {
            const keyJson = JsonConvert.stringify(keyObj);
            if (groupedMultiMapObj[keyJson] !== undefined) {
              groupedMultiMapObj[keyJson]!.push(valueObj);
            }
            else {
              const valueArr = [valueObj];
              grouped.push({key: keyObj, values: valueArr});
              groupedMultiMapObj[keyJson] = valueArr;
            }
          }
        }

        result = grouped.map(groupedItem => {
          if (groupedItem.values instanceof Array) {
            return {
              ...groupedItem.key,
              [joinKey]: groupedItem.values
                .filter(item1 => (
                  Object.keys(item1)
                    .filter(key => !(item1[key] instanceof Array) || item1[key].length > 0)
                    .length > 0
                ))
            };
          }
          else {
            return {
              ...groupedItem.key,
              ...Object.keys(groupedItem.values).length > 0 ? {
                [joinKey]: groupedItem.values
              } : {}
            };
          }
        });
      }
    }

    return result;
  }
}