export const noop = () => {};

class _Signal {
  private readonly fns = new Set<any>();

  emit(value: any) {
    for (const fn of this.fns) fn(value);
  }

  observe(onValue: any, onDispose: any = noop) {
    this.fns.add(onValue);
    return () => {
      this.fns.delete(onValue) && onDispose();
    };
  }
}

export interface Signal<T> {
  emit(value: T): void;
  observe(onValue: (value: T) => void, onDispose?: () => void): () => void;
}

export const signal = <T>(): Signal<T> => new _Signal();

export class AggregateError extends Error {
  constructor(readonly errors: ReadonlyArray<Error>) {
    super(`One or more errors have occurred: ${errors}`);
    this.name = "AggregateError";
  }
}

export const disposable = (...fns: Function[]) => {
  let isDisposed = false;

  return () => {
    if (isDisposed) return;
    isDisposed = true;

    const errors = [];

    for (const fn of fns) {
      try {
        fn();
      } catch (e) {
        errors.push(e);
      }
    }

    if (errors.length) {
      throw new AggregateError(errors);
    }
  };
};

export type Deferred<T> = Promise<T> & {
  resolve(value: T): void;
  reject(error: Error): void;
};

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const deferred = <T>(): Deferred<T> => {
  const self: any = {};
  const p = new Promise((res, rej) => {
    self.resolve = res;
    self.reject = rej;
  });
  self.then = p.then.bind(p);
  self.catch = p.catch.bind(p);
  self.finally = p.finally.bind(p);
  return self;
};

export const debounced = <T>(fn: (...args: T[]) => void, ms: number) => {
  let tid: NodeJS.Timeout;

  return (...args: T[]) => {
    clearTimeout(tid);
    tid = setTimeout(() => fn(...args), ms);
  };
};

export const throttled = <T>(fn: (...args: T[]) => void, ms: number) => {
  let muted = false;

  return (...args: T[]) => {
    if (muted) return;

    fn(...args);
    muted = true;
    setTimeout(() => (muted = false), ms);
  };
};
