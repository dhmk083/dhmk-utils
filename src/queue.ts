import {
  deferred,
  toPromise,
  cancellable,
  flow,
  CancellableContext,
} from "./fn";
import { Cancelled, CancellablePromise } from "./types";

export function queue() {
  let head = Promise.resolve();

  return function <T>(fn: () => Promise<T>): Promise<T> {
    const h = head;
    const d = (head = deferred());

    return h.then(() => fn()).finally(() => d.resolve(undefined));
  };
}

export function createChain(
  create: (arg: unknown) => [task: Promise<unknown>, cancel: () => any]
) {
  const q = queue();
  let p;
  let cancel;
  let prev = { cancelled: false };

  return function (arg: unknown) {
    prev.cancelled = true;
    cancel?.();
    const cc = (prev = { cancelled: false });

    return q<unknown | Cancelled>(() => {
      if (cc.cancelled) return Promise.resolve(Cancelled);

      [p, cancel] = create(arg);
      return p;
    });
  };
}

// const canChain = createChain((fn: any) => {
//   const f = fn();
//   return [f, f.cancel.bind(f)];
// });

export function asyncChain(): <T>(
  fn: (ctx: CancellableContext) => Promise<T>
) => CancellablePromise<T> {
  return createChain((fn: any) => {
    const c = cancellable(fn);
    return [c, c.cancel.bind(c)];
  }) as any;
}

export function flowChain(): <T>(
  fn: () => Generator<unknown, T>
) => CancellablePromise<T> {
  return createChain((fn: any) => {
    const f = flow(fn);
    return [f, f.cancel.bind(f)];
  }) as any;
}

export function priorityQueue(q = queue()) {
  const fns: any[] = [];

  return function <T>(fn: () => Promise<T>, priority = 0): Promise<T> {
    const entry = { fn, priority, p: deferred<T>() };
    fns.push(entry);
    fns.sort((a, b) => b.priority - a.priority);

    q(async () => {
      const _entry = fns.shift();
      _entry.p.resolve(toPromise(_entry.fn));
    });

    return entry.p;
  };
}
