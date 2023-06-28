export type Unsubscribe = () => void;

export type Listener<T> = (x: T) => void;

export interface Event<T> {
  subscribe(fn: Listener<T>): Unsubscribe;
}

export interface Signal<T> extends Event<T> {
  (x: T): void;
  event(): Event<T>;
}

export function signal<T = void>({
  listeners = new Set<Listener<T>>(),
  emit = (fn: (x: T) => void) => fn,
  subscribe = (fn: (x: Listener<T>) => Unsubscribe) => fn,
} = {}): Signal<T> {
  const self: any = emit((x: T) => {
    const errors: any[] = [];

    listeners.forEach((fn) => {
      try {
        fn(x);
      } catch (e) {
        errors.push(e);
      }
    });

    if (errors.length) throw new AggregateError(errors);
  });

  self.subscribe = subscribe((fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  });

  self.event = () => self;

  return self;
}

type Signals<T> = {
  [P in keyof T]: T[P] extends Signal<infer S> ? Signal<S> : Signals<T[P]>;
};

type Events<T> = {
  [P in keyof T]: T[P] extends Signal<infer S> ? Event<S> : Events<T[P]>;
};

export function asEvents<T extends Signals<T>>(x: T): Events<T> {
  return x as any;
}

export function once<T>(ev: Event<T>, onValue?: Listener<T>) {
  return new Promise<T>((res, rej) => {
    const unsub = ev.subscribe((x) => {
      try {
        onValue?.(x);
        res(x);
      } catch (e) {
        rej(e);
      } finally {
        unsub();
      }
    });
  });
}
