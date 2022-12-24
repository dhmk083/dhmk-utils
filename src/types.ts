export declare class Tag<T> {
  private __$$unique_name$$__: T;
}

export type Tagged<T, U> = T & Tag<U>;

export type StrKeyOf<T> = Extract<keyof T, string>;

export type AnyFunction = (...args: any) => any;

export type Initializer<T> = T extends Function ? never : T | (() => T);

export type Initializer1<A, T = A> = T extends Function
  ? never
  : T | ((arg: A) => T);

export type ValueOrFunction<T> = T extends Function
  ? (value: T) => T
  : T | ((value: T) => T);

export type PromiseType<T> = T | PromiseLike<T>;

export type UnwrapPromise<T> = T extends PromiseLike<infer R>
  ? UnwrapPromise<R>
  : T;

export type Overwrite<A, B> = Omit<A, keyof B> & B;

export type Primitive = undefined | boolean | string | number | symbol | bigint;

export type NotPlainObject =
  | Primitive
  | null
  | Function
  | Date
  | RegExp
  | Error
  | ReadonlyArray<any>
  | ReadonlySet<any>
  | ReadonlyMap<any, any>;

export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer T>
  ? ReadonlySet<DeepReadonly<T>>
  : {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    };

export type ArrayItem<T> = T extends ReadonlyArray<infer U> ? U : never;

export type DeepPartial<T> = T extends NotPlainObject
  ? T
  : {
      [P in keyof T]?: T[P] extends NotPlainObject ? T[P] : DeepPartial<T[P]>;
    };

class CancelledResult {}
export type Cancelled = CancelledResult;
export const Cancelled = new CancelledResult();

export type CancellablePromise<T> = Promise<T | Cancelled> & { cancel() };
