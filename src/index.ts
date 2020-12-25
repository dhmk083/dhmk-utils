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

export type Signal<T> = T extends void
  ? {
      emit(): void;
      observe(onValue: () => void, onDispose?: () => void): () => void;
    }
  : {
      emit(value: T): void;
      observe(onValue: (value: T) => void, onDispose?: () => void): () => void;
    };

export const signal = <T = void>(): Signal<T> => new (_Signal as any)();

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

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

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
  const self: any = {};
  const p = new Promise((res, rej) => {
    self.resolve = (x: any) => {
      res(x);
      return self;
    };
    self.reject = (e: any) => {
      rej(e);
      return self;
    };
  });
  self.then = p.then.bind(p);
  self.catch = p.catch.bind(p);
  self.finally = p.finally.bind(p);
  return self;
};

export type Action = (...args: any[]) => void;

export const debounced = <T extends Action>(fn: T, ms: number) => {
  let tid: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(tid);
    tid = setTimeout(() => fn(...args), ms);
  };
};

export const throttled = <T extends Action>(fn: T, ms: number) => {
  let muted = false;

  return (...args: Parameters<T>) => {
    if (muted) return;

    fn(...args);
    muted = true;
    setTimeout(() => (muted = false), ms);
  };
};
