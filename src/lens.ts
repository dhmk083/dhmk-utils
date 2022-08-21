export type PropType<T, Path extends string[]> = Path extends [infer K]
  ? K extends keyof T
    ? T[K]
    : T extends ReadonlyArray<any>
    ? K extends `${number}`
      ? T[number]
      : unknown
    : unknown
  : Path extends [infer K, ...infer R]
  ? R extends string[]
    ? K extends keyof T
      ? PropType<T[K], R>
      : T extends ReadonlyArray<any>
      ? K extends `${number}`
        ? PropType<T[number], R>
        : unknown
      : unknown
    : unknown
  : unknown;

export const getIn = <T, P extends string[]>(
  x: T,
  path: readonly [...P]
): PropType<T, P> => path.reduce((src: any, k) => src[k], x) as any;

export const updateIn = <T, P extends string[]>(
  x: T,
  path: readonly [...P],
  updater: (value: PropType<T, P>) => PropType<T, P>
): T => {
  if (path.length === 0) {
    return updater(x as any) as any;
  }

  const [k, ...rest] = path;
  const value = updateIn((x as any)[k], rest as any, updater);

  return Array.isArray(x)
    ? arraySet(x, Number(k), value)
    : objectSet(x, k, value);
};

export const setIn = <T, P extends string[]>(
  x: T,
  path: readonly [...P],
  v: PropType<T, P>
): T => updateIn(x, path, () => v);

const arraySet = (x, k, v) => x.map((_v, i) => (i === k ? v : _v));

const objectSet = (x, k, v) => ({ ...x, [k]: v });
