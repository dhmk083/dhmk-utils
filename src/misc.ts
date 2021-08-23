import { objectMap } from "./std";

export function createCaseConverter(mapKey: any) {
  return function convertCase(obj: any) {
    if (obj && Object.getPrototypeOf(obj) === Object.prototype) {
      return objectMap(obj, convertCase, mapKey);
    } else if (Array.isArray(obj)) return obj.map(convertCase);
    else return obj;
  };
}

export const snakeToCamelCase = createCaseConverter((k) =>
  k.replace(/_(\w)/, (_: any, x: any) => x.toUpperCase())
);

export const camelToSnakeCase = createCaseConverter((k) =>
  k.replace(/([A-Z])/, (_: any, x: any) => "_" + x.toLowerCase())
);
