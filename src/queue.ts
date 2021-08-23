import { deferred } from "./fn";
import { cancellable, CancelledError, Cancellable } from "./cancellable";
import { UnwrapPromise } from "./types";

export function queue() {
  let head: any = Promise.resolve();

  return function <T>(fn: () => Promise<T>): Promise<UnwrapPromise<T>> {
    head = new Promise<void>(async (headRes) => {
      await head;

      let p;

      try {
        p = fn();
      } catch (e) {
        p = Promise.reject(e);
      }

      p.then(
        (x) => {
          def.resolve(x);
          headRes();
        },
        (x) => {
          def.reject(x);
          headRes();
        }
      );
    });

    const def = deferred<T>();
    return def as any;
  };
}

export function chain(create: (fn: any) => [Promise<any>, Function]) {
  const q = queue();
  let p;
  let cancel;
  let prev = { cancelled: false };

  return function <T>(fn: () => Promise<T>) {
    prev.cancelled = true;
    cancel?.();
    const cc = (prev = { cancelled: false });

    return q<CancelledError | T>(() => {
      if (cc.cancelled) return Promise.resolve(new CancelledError());

      [p, cancel] = create(fn);
      return p;
    });
  };
}

export function ctokenChain(): <T>(
  fn: (ct: Cancellable) => Promise<T>
) => Promise<T> {
  return chain((fn) => {
    const ctoken = cancellable();
    return [fn(ctoken), ctoken.cancel];
  }) as any;
}

export function flowChain() {
  return chain(function (this: any, fn) {
    const flow = fn();
    return [flow, flow.cancel];
  });
}

export function priorityQueue(q = queue()) {
  const fns: any[] = [];

  return function <T>(
    fn: () => Promise<T>,
    priority = 0
  ): Promise<UnwrapPromise<T>> {
    const entry = { fn, priority, p: deferred<UnwrapPromise<T>>() };
    fns.push(entry);
    fns.sort((a, b) => a.priority - b.priority);

    q(() => {
      const _entry = fns.pop();
      return _entry.p.resolve(_entry.fn());
    });

    return entry.p;
  };
}

export function pLimit<A extends unknown[] = any, T = any>(
  fn: (...args: A) => Promise<T>,
  limit: number
): (...args: A) => Promise<UnwrapPromise<T>> {
  const stack: any[] = [];

  function run() {
    if (limit > 0) {
      const entry = stack.shift();
      if (!entry) return;

      --limit;
      entry.p.resolve(fn(...entry.args)).finally(() => {
        ++limit;
        run();
      });
    }
  }

  return function (...args: A): any {
    const p = deferred();
    stack.push({ p, args });

    run();
    return p;
  };
}
