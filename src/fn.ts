import { AnyFunction, UnwrapPromise } from "./types";
import { noop } from "./std";

export const toPromise = <T>(fn: () => Promise<T>) => {
  try {
    return Promise.resolve(fn());
  } catch (e) {
    return Promise.reject(e);
  }
};

export type Deferred<T> = Promise<T> & {
  resolve(x: T): Promise<T>;
  reject(error: any): Promise<T>;
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

export function* g<T>(x: T): Generator<unknown, UnwrapPromise<T>> {
  return (yield x) as any;
}

type Cancellable = {
  readonly isCancelled: boolean;
  cancel(): void;
};

export type Flow<T> = Promise<T> & { cancel(): void };

export const runStep = (g: Generator, arg: any, isError: boolean) =>
  isError ? g.throw(arg) : g.next(arg);

export function flow<T>(
  this: any,
  fn: (ctx: Cancellable) => Generator<any, T>,
  run = runStep
): Flow<T> {
  const ctx = {
    _g: undefined as any as Generator,
    isCancelled: false,
    cancel: () => {
      ctx.isCancelled = true;
      ctx._g.return(undefined);
    },
  };

  const p: any = new Promise((res, rej) => {
    function step(arg, isError) {
      try {
        const { value, done } = run(ctx._g, arg, isError);

        if (done) res(value);
        else
          Promise.resolve(value).then(
            (x) => step(x, false),
            (e) => step(e, true)
          );
      } catch (e) {
        rej(e);
      }
    }

    ctx._g = fn.call(this, ctx as any);
    step(undefined, false);
  });

  p.cancel = ctx.cancel;
  return p;
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
