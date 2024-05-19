export function lazy<A extends any[], R>(
  getFn: () => (...args: A) => R
): (...args: A) => R {
  return (...args) => getFn()(...args);
}

export type Setter<T> = (
  fn: ((x: T) => Partial<T>) | /* for immer */ ((x: T) => T)
) => void;

export type Getter<T> = () => T;

type StoreCreator<T, R = T> = (set: Setter<T>, get: Getter<T>) => R;

type Check1<T, Ref> = {
  [P in keyof T]: P extends keyof Ref ? Ref[P] : T[P];
};

type Check2<T, Ref> = {
  [P in keyof T as P extends keyof Ref ? P : never]: P extends keyof Ref
    ? Ref[P]
    : never;
};

export function combine<A, B = A, C = B>(
  a: StoreCreator<A> | A,
  b: (set: Setter<Check1<B, A>>, get: Getter<B>) => C & Check2<C, A>
): StoreCreator<A & C> {
  return (...args) => {
    return {
      ...(typeof a === "function" ? (a as any)(...args) : a),
      ...(typeof b === "function" ? (b as any)(...args) : b),
    };
  };
}

export function infer<T, A extends unknown[]>(
  fn: (create: <U>(x: () => U) => [s: Setter<U>, g: Getter<U>, ...args: A]) => T
): (s: Setter<T>, g: Getter<T>, ...args: A) => T {
  return (set, get, ...rest) => {
    let _init;
    let created;

    const create = (init) => {
      _init = init;

      return [
        set,
        () => {
          return created ? get() : _init();
        },
        ...rest,
      ];
    };

    const res = fn(create as any);
    created = true;
    return res;
  };
}
