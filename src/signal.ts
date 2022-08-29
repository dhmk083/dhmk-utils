export type Listener<T> = (x: T) => void;

export function signal<T = void>() {
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

// todo: signal improvement (multi args + customizable)

// export type Listener<A extends any[]> = (...args: A) => void;

// export type Signal<A extends any[]> = {
//   subscribe(fn: Listener<A>): () => void;
// };

// export function signal<A extends any[] = []>({
//   listeners = new Set<any>(),
//   emit = (fn: (...args: A) => void) => fn,
//   subscribe = (fn: (fn: Listener<A>) => () => void) => fn,
// } = {}) {
//   const self: any = emit((...args: A) =>
//     listeners.forEach((s) => s(...args))
//   );

//   self.subscribe = subscribe((fn: Listener<A>) => {
//     listeners.add(fn);
//     return () => {
//       listeners.delete(fn);
//     };
//   });

//   return self as ((...args: A) => void) & Signal<A>;
// }
