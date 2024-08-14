import { deferred, toPromise } from "./fn";

export function queue() {
  let lock = Promise.resolve();

  return <T>(fn: () => Promise<T>): Promise<T> => {
    const prevLock = lock;
    const nextLock = (lock = deferred());

    return prevLock.then(() => fn()).finally(nextLock.resolve);
  };
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
