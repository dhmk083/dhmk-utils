import { objectMap, isPlainObject } from "./std";

export function createCaseConverter(mapKey: (key: string) => string) {
  return function convertCase(obj: any) {
    if (isPlainObject(obj)) {
      return objectMap(obj, convertCase, mapKey);
    } else if (Array.isArray(obj)) return obj.map(convertCase);
    else return obj;
  };
}

export type SnakeToCamelString<T extends string> =
  T extends `${infer C0}_${infer C1}${infer C2}`
    ? `${C0}${Uppercase<C1>}${SnakeToCamelString<C2>}`
    : T;

export type SnakeToCamel<T> = T extends readonly any[]
  ? { [K in keyof T]: SnakeToCamel<T[K]> }
  : T extends object
  ? {
      [K in keyof T as SnakeToCamelString<K & string>]: SnakeToCamel<T[K]>;
    }
  : T;

export const snakeToCamelCase: <T>(x: T) => SnakeToCamel<T> =
  createCaseConverter((k) =>
    k.replace(/_(\w)/g, (_: any, x: any) => x.toUpperCase())
  );

export type CamelToSnakeString<
  T extends string,
  PrevC extends string = "",
  P extends string = ""
> = T extends `${infer C0}${infer R}`
  ? CamelToSnakeString<
      R,
      C0,
      `${P}${C0 extends Lowercase<C0>
        ? ""
        : R extends `${infer R1}${infer R2}`
        ? R1 extends Lowercase<R1>
          ? "_"
          : PrevC extends Lowercase<PrevC>
          ? "_"
          : ""
        : ""}${Lowercase<C0>}`
    >
  : P;

export type CamelToSnake<T> = T extends readonly any[]
  ? { [K in keyof T]: CamelToSnake<T[K]> }
  : T extends object
  ? {
      [K in keyof T as CamelToSnakeString<K & string>]: CamelToSnake<T[K]>;
    }
  : T;

export const camelToSnakeCase: <T>(x: T) => CamelToSnake<T> =
  createCaseConverter((k) =>
    k
      .replace(/([A-Z])([a-z0-9])/g, (_, x1, x2) => "_" + x1.toLowerCase() + x2)
      .replace(/([A-Z]+)/g, (_: any, x: any) => "_" + x.toLowerCase())
  );
