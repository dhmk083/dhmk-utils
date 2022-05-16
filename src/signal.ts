export type Listener<T> = (x: T) => void;

export default function signal<T = void>() {
  const subs = new Set<any>();
  const self = (x: T) => subs.forEach((s) => s(x));

  self.subscribe = (fn: Listener<T>) => {
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  };

  return self;
}
