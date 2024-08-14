import { PromiseType } from "./types";
import { noop } from "./std";

export const toPromise = <T>(fn: () => PromiseType<T>): Promise<T> => {
  try {
    return Promise.resolve(fn());
  } catch (e) {
    return Promise.reject(e);
  }
};

export type Deferred<T> = Promise<T> & {
  resolve(x: PromiseType<T>): Promise<T>;
  reject(error: any): Promise<never>;
};

export const deferred = <T = void>(): Deferred<T> => {
  let resolve;
  let reject;

  const self: any = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  self.resolve = (x) => (resolve(x), self);
  self.reject = (e) => (reject(e), self);
  return self;
};

export const debounced = <T, A extends any[] = []>(
  fn: (...args: A) => PromiseType<T>,
  ms: number
) => {
  let tid: any;
  let p = deferred<T>();

  return (...args: A): Promise<T> => {
    clearTimeout(tid);
    tid = setTimeout(() => {
      p.resolve(toPromise(() => fn(...args)));
      p = deferred();
    }, ms);

    return p;
  };
};

export const throttled = <T, A extends any[] = []>(
  fn: (...args: A) => PromiseType<T>,
  ms: number
) => {
  let p: Promise<T> | undefined;

  return (...args: A): Promise<T> => {
    if (!p) {
      p = toPromise(() => fn(...args));
      setTimeout(() => (p = undefined), ms);
    }

    return p;
  };
};

export const throttledAsync = <T, A extends any[] = []>(
  fn: (...args: A) => PromiseType<T>
) => {
  let p: Promise<T> | undefined;

  return (...args: A): Promise<T> => {
    if (!p) {
      p = toPromise(() => fn(...args)).finally(() => (p = undefined));
    }

    return p;
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

export function* g<T>(x: PromiseType<T>): Generator<unknown, T> {
  return (yield x) as any;
}

export function pLimited<A extends unknown[] = any, T = any>(
  fn: (...args: A) => Promise<T>,
  limit: number
): (...args: A) => Promise<T> {
  const stack: any[] = [];
  let i = limit;

  function run() {
    if (i > 0) {
      const entry = stack.shift();
      if (!entry) return;

      --i;

      entry.p
        .resolve(toPromise(() => fn(...entry.args)))
        .catch(noop)
        .finally(() => {
          i = Math.min(limit, i + 1);
          run();
        });
    }
  }

  return (...args): any => {
    const p = deferred();
    stack.push({ p, args });

    run();
    return p;
  };
}
