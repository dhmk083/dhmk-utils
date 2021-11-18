type F<P, R> = (p: P) => R;

type Refine<S, T> = {
  <R = T>(fb?: F<T, R>): F<S, R>;
  refine<R = T>(fb?: F<T, R>): Refine<S, R>;
};

export function selector<S, T, R>(fa: F<S, T>, fb: F<T, R>): F<S, R>;
export function selector<S, T>(fa: F<S, T>): Refine<S, T>;
export function selector(fa, fb?) {
  if (fb) return (s) => fb(fa(s));
  else {
    const ff =
      (fb = (x) => x) =>
      (s) =>
        fb(fa(s));

    ff.refine = (fb = (x) => x) => selector((s) => fb(fa(s)));

    return ff;
  }
}
