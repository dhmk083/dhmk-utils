import { ValueOrFunction } from "./types";

export type PropType<T, Path extends string[]> = Path extends [infer K]
  ? K extends keyof T
    ? T[K]
    : unknown
  : Path extends [infer K, ...infer R]
  ? K extends keyof T
    ? R extends string[]
      ? PropType<T[K], R>
      : unknown
    : unknown
  : unknown;

export const getIn = <T, P extends string[]>(
  x: T,
  path: [...P]
): PropType<T, P> => path.reduce((src: any, k) => src[k], x) as any;

export const setIn = <T, P extends string[]>(
  x: T,
  path: [...P],
  v: ValueOrFunction<PropType<T, P>>
): T => {
  if (path.length === 0) {
    return typeof v === "function" ? v(x) : v;
  }

  const [k, ...rest] = path;
  const value = setIn((x as any)[k], rest, v);

  return Array.isArray(x)
    ? arraySet(x, Number(k), value)
    : objectSet(x, k, value);
};

const arraySet = (x, k, v) => x.map((_v, i) => (i === k ? v : _v));

const objectSet = (x, k, v) => ({ ...x, [k]: v });
