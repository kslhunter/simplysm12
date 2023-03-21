import { TClassDecoratorReturn, TPropertyDecoratorReturn, Type } from "@simplysm/sd-core-common";
import { DbDefinitionUtil } from "./utils/DbDefinitionUtil";
import { TSdOrmDataType } from "./SdOrmDataType";
import { DbContext } from "./DbContext";
import { Queryable } from "./Queryable";

export function Table<T>(def: {
  description: string;
  database?: string;
  schema?: string;
  name?: string;
  view?: (db: any) => Queryable<DbContext, any>;
}): TClassDecoratorReturn<T> {
  return (classType: Type<T>): void => {
    DbDefinitionUtil.mergeTableDef(classType, {
      name: classType.name,
      ...def
    });
  };
}

export function Column<T extends object>(columnDef: {
  description: string;
  name?: string;
  dataType?: TSdOrmDataType;
  nullable?: boolean;
  autoIncrement?: boolean;
  primaryKey?: number;
}): TPropertyDecoratorReturn<T> {
  return (object: T, propertyKey: string): void => {
    const classType = object.constructor as Type<T>;

    DbDefinitionUtil.addColumnDef(classType, {
      propertyKey,
      name: columnDef.name ?? propertyKey,
      dataType: columnDef.dataType,
      nullable: columnDef.nullable,
      autoIncrement: columnDef.autoIncrement,
      primaryKey: columnDef.primaryKey,
      description: columnDef.description,

      typeFwd: () => Reflect.getMetadata("design:type", object, propertyKey)
    });
  };
}

export function ForeignKey<T>(
  columnNames: (keyof T)[],
  targetTypeFwd: () => Type<any>,
  description: string
): TPropertyDecoratorReturn<Partial<T>> {
  return (object: Partial<T>, propertyKey: string): void => {
    const classType = object.constructor as Type<T>;

    DbDefinitionUtil.addForeignKeyDef(classType, {
      propertyKey,
      name: propertyKey,
      columnPropertyKeys: columnNames as string[],
      description,
      targetTypeFwd
    });
  };
}

export function ForeignKeyTarget<T extends object, P>(
  sourceTypeFwd: () => Type<P>,
  foreignKeyPropertyKey: keyof P,
  description: string
): TPropertyDecoratorReturn<T> {
  return (object: T, propertyKey: string): void => {
    const classType = object.constructor as Type<T>;

    DbDefinitionUtil.addForeignKeyTargetDef(classType, {
      propertyKey,
      name: propertyKey,
      sourceTypeFwd,
      description,
      sourceKeyPropertyKey: foreignKeyPropertyKey as string
    });
  };
}

export function Index<T extends object>(def?: {
  name?: string;
  order?: number;
  orderBy?: "ASC" | "DESC";
}): TPropertyDecoratorReturn<T> {
  return (object, propertyKey) => {
    const classType = object.constructor as Type<T>;

    DbDefinitionUtil.addIndexDef(classType, {
      name: def?.name ?? propertyKey,
      columns: [
        {
          columnPropertyKey: propertyKey,
          order: def?.order ?? 1,
          orderBy: def?.orderBy ?? "ASC"
        }
      ]
    });
  };
}

export function ReferenceKey<T>(
  columnNames: (keyof T)[],
  targetTypeFwd: () => Type<any>,
  description: string
): TPropertyDecoratorReturn<Partial<T>> {
  return (object: Partial<T>, propertyKey: string): void => {
    const classType = object.constructor as Type<T>;

    DbDefinitionUtil.addReferenceKeyDef(classType, {
      propertyKey,
      name: propertyKey,
      columnPropertyKeys: columnNames as string[],
      description,
      targetTypeFwd
    });
  };
}

export function ReferenceKeyTarget<T extends object, P>(
  sourceTypeFwd: () => Type<P>,
  referenceKeyPropertyKey: keyof P,
  description: string
): TPropertyDecoratorReturn<T> {
  return (object: T, propertyKey: string): void => {
    const classType = object.constructor as Type<T>;

    DbDefinitionUtil.addReferenceKeyTargetDef(classType, {
      propertyKey,
      name: propertyKey,
      sourceTypeFwd,
      description,
      sourceKeyPropertyKey: referenceKeyPropertyKey as string
    });
  };
}
