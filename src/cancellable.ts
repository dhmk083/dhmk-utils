import { deferred, toPromise } from "./fn";
import { queue } from "./queue";

export type CancellablePromise<T> = Promise<T> & { cancel(): void };

export class Cancelled {}

export type CancellableContext = {
  <T>(x: T): Promise<T>;
  isCancelled: boolean;
  onCancel(fn: Function);
  cancel();
};

export function cancellable<T>(
  fn: (ctx: CancellableContext) => Promise<T>
): CancellablePromise<T | Cancelled> {
  const checkCancel = (x) =>
    checkCancel.isCancelled
      ? Promise.reject(new Cancelled())
      : Promise.resolve(x);

  let onCancel;

  const cancel = () => {
    if (!checkCancel.isCancelled) {
      checkCancel.isCancelled = true;
      onCancel?.();
    }
  };

  checkCancel.isCancelled = false;
  checkCancel.cancel = cancel;
  checkCancel.onCancel = (fn) => (onCancel = fn);

  const p: any = toPromise(() => fn(checkCancel));

  const cp = p
    .finally(() => {
      onCancel = undefined;
    })
    .catch((e) => {
      if (e instanceof Cancelled) return e;
      throw e;
    });
  cp.cancel = cancel;
  return cp;
}

function runGen(g) {
  const p = deferred();

  async function run(finalize) {
    let nextArg;

    try {
      while (true) {
        const { value, done } = finalize
          ? g.return(new Cancelled())
          : g.next(nextArg);

        if (done) {
          p.resolve(value);
          return;
        }

        finalize = false;

        if (typeof value?.then === "function") {
          nextArg = await value;
        }
      }
    } catch (e) {
      p.reject(e);
    }
  }

  run(false);
  return [p, () => run(true)];
}

export function* result<T>(x: T): Generator<any, Awaited<T>> {
  return (yield x) as any;
}

export function flow<R>(fn: () => Generator<any, R, any>) {
  return (ctx: CancellableContext): Promise<R | Cancelled> => {
    const [p, stop]: any = runGen(fn());
    ctx.onCancel(stop);
    return p;
  };
}

export function makeCancellableFactory(chain = cancellableChain()) {
  return <A extends any[], R>(
    fn: (...args: A) => (ctx: CancellableContext) => Promise<R>
  ) => makeCancellable(fn, chain);
}

export function makeCancellable<A extends any[], R>(
  fn: (...args: A) => (ctx: CancellableContext) => Promise<R>,
  chain = cancellableChain()
) {
  return (...args: A): CancellablePromise<R | Cancelled> =>
    chain((ctx) => fn(...args)(ctx));
}

export function cancellableChainAsync() {
  let prev = {
    cancel() {},
  };

  return <T>(
    fn: (ctx: CancellableContext) => Promise<T>
  ): CancellablePromise<T | Cancelled> => {
    prev.cancel();

    return (prev = cancellable(fn));
  };
}

export function cancellableChain() {
  const q = queue();
  let prev = { cancel: () => {} };

  return <T>(
    fn: (ctx: CancellableContext) => Promise<T>
  ): CancellablePromise<T | Cancelled> => {
    prev.cancel();

    return (prev = cancellable<T>((checkCancel) =>
      q(() =>
        checkCancel.isCancelled
          ? checkCancel(undefined as unknown as T /* will be ignored */)
          : fn(checkCancel)
      )
    ));
  };
}

export const cancellableEffect = (fn: (ctx: CancellableContext) => any) =>
  cancellable(fn).cancel;
