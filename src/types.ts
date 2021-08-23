export type StrKeyOf<T> = Extract<keyof T, string>;

export type AnyFunction = (...args: any) => any;

export type Initializer<T> = T extends Function ? never : T | (() => T);

export type Initializer1<A, T = A> = T extends Function
  ? never
  : T | ((arg: A) => T);

export type UnwrapPromise<T> = T extends PromiseLike<infer R>
  ? UnwrapPromise<R>
  : T;

export type Overwrite<A, B> = Omit<A, keyof B> & B;

type Primitive = undefined | null | boolean | string | number | Function;

export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer T>
  ? ReadonlySet<DeepReadonly<T>>
  : {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    };
