import { deferred, toPromise } from "./fn";
import { Tagged } from "./types";

export function queue() {
  let head = Promise.resolve();

  return function <T>(fn: () => Promise<T>): Promise<T> {
    const h = head;
    const d = (head = deferred());

    return h.then(() => fn()).finally(() => d.resolve(undefined));
  };
}

export type Cancelled = Tagged<{}, "Cancelled">;
export const Cancelled = {} as Cancelled;

export function createChain(
  create: (arg: unknown) => [task: Promise<unknown>, abort: Function]
) {
  const q = queue();
  let p;
  let abort;
  let prev = { cancelled: false };

  return function (arg: unknown) {
    prev.cancelled = true;
    abort?.();
    const cc = (prev = { cancelled: false });

    return q<unknown | Cancelled>(() => {
      if (cc.cancelled) return Promise.resolve(Cancelled);

      [p, abort] = create(arg);
      return p;
    });
  };
}

export function chain(): <T>(
  fn: (as: AbortSignal) => Promise<T>
) => Promise<T | Cancelled> {
  return createChain((fn: any) => {
    const ac = new AbortController();
    return [fn(ac.signal), ac.abort.bind(ac)];
  }) as any;
}

export function flowChain(): <T>(
  fn: () => Promise<T> & { cancel() }
) => Promise<T | Cancelled> {
  return createChain((fn: any) => {
    const flow = fn();
    return [flow, flow.cancel.bind(flow)];
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
