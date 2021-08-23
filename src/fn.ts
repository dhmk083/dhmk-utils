import { AnyFunction } from "./types";

export type Deferred<T> = Promise<T> & {
  reject(error: Error): Deferred<T>;
} & (T extends void
    ? {
        resolve(): Deferred<T>;
      }
    : {
        resolve(x: T): Deferred<T>;
      });

export const deferred = <T = void>(): Deferred<T> => {
  let resolve: any;
  let reject: any;

  const self: any = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  self.resolve = (x: any) => (resolve(x), self);
  self.reject = (e: any) => (reject(e), self);
  return self;
};

export const debounced = <T extends AnyFunction>(fn: T, ms: number) => {
  let tid: any;

  return (...args: Parameters<T>) => {
    clearTimeout(tid);
    tid = setTimeout(() => fn(...args), ms);
  };
};

export const throttled = <T extends AnyFunction>(fn: T, ms: number) => {
  let muted = false;

  return (...args: Parameters<T>) => {
    if (muted) return;

    fn(...args);
    muted = true;
    setTimeout(() => (muted = false), ms);
  };
};

export const sleep = (ms: number) =>
  new Promise<void>((res) => setTimeout(res, ms));

export function delayed<A extends unknown[], T>(
  fn: (...args: A) => T,
  ms: number
) {
  return function (...args: A) {
    return sleep(ms).then(() => fn(...args));
  };
}

export function immediate<T extends Function>(fn: T) {
  fn();
  return fn;
}

export const disposable = (...fns: Function[]) => {
  let isDisposed = false;

  return () => {
    if (isDisposed) return;
    isDisposed = true;

    const errors: any[] = [];

    fns.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        errors.push(e);
      }
    });

    if (errors.length) throw new AggregateError(errors);
  };
};
