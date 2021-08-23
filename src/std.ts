import { StrKeyOf, DeepReadonly } from "./types";

export const noop = () => {};

export const id = <T>(x: T) => x;

export const range = (count: number, start = 0) =>
  Array.from(Array(count).keys()).map((i) => start + i);

export const arraysEqual = <T>(a: ReadonlyArray<T>, b: ReadonlyArray<T>) =>
  a.length === b.length && a.every((av, i) => av === b[i]);

export function objectFrom<V, K extends keyof any = keyof any>(
  entries: Iterable<[K, V]>
): Record<K, V> {
  return Array.from(entries).reduce((res, [k, v]) => {
    res[k] = v;
    return res;
  }, {} as any);
}

type ValueMapper<T, R = any> = (v: T[StrKeyOf<T>], k: StrKeyOf<T>, src: T) => R;
type KeyMapper<T, R = any> = (k: StrKeyOf<T>, v: T[StrKeyOf<T>], src: T) => R;

export function objectMap<T extends object, V extends ValueMapper<T>>(
  src: T,
  mapValue: V
): Record<StrKeyOf<T>, ReturnType<V>>;
export function objectMap<T extends object>(
  src: T,
  mapValue: ValueMapper<T>,
  mapKey?: KeyMapper<T>
): any;
export function objectMap(src: any, mapValue: any, mapKey = id as any): any {
  return objectFrom(
    Object.keys(src).map((k) => [
      mapKey(k, src[k], src),
      mapValue(src[k], k, src),
    ])
  );
}

export function objectTransform<
  T,
  K extends keyof any = keyof T,
  V = T[keyof T]
>(
  src: T,
  mapEntry: (v: T[keyof T], k: keyof T, src: T) => readonly [K, V] | null
): Record<K, V> {
  return objectFrom(
    Object.keys(src)
      .map((k) => mapEntry(src[k], k as any, src))
      .filter(Boolean) as any
  );
}

export function getter<T>(t: T, k: keyof T): Readonly<{ use<R>(value: R): R }>;
export function getter<T, R>(t: T, k: keyof T, value: R): R;
export function getter<T, R>(t: T, k: keyof T, value?: R) {
  if (arguments.length === 2) {
    return { use: (value) => getter(t, k, value) };
  } else {
    Object.defineProperty(t, k, { value, enumerable: true });
    return value;
  }
}

export function createFactory<T extends abstract new (...args: any[]) => any>(
  c: T
) {
  return (...args: ConstructorParameters<T>): InstanceType<T> => {
    // @ts-ignore
    return new c(...args);
  };
}

export function createFactoryAs<A>() {
  return function <T extends abstract new (...args: any[]) => any>(
    c: T
  ): (...args: ConstructorParameters<T>) => A {
    return (...args: ConstructorParameters<T>) => {
      // @ts-ignore
      return new c(...args);
    };
  };
}

export const call = <T>(fn: () => T) => fn();

export const deepReadonly = <T>(x: T) => x as DeepReadonly<T>;
