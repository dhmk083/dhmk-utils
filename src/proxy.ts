export function staticProxy<T extends object, R>(
  src: T,
  overrides: R | ((src: T) => R)
): T & R;
export function staticProxy(src: any, overrides: any) {
  if (typeof overrides === "function") overrides = overrides(src);

  const proxy = {};

  const keys = new Set(Object.getOwnPropertyNames(src).concat(Object.getOwnPropertyNames(overrides)))

  keys.forEach((k) => {
    Object.defineProperty(proxy, k, {
      enumerable: true,

      get() {
        if (overrides.hasOwnProperty(k)) return overrides[k];
        return src[k];
      },

      set(v) {
        if (overrides.hasOwnProperty(k)) return (overrides[k] = v)
        return (src[k] = v);
      },
    });
  });

  Object.seal(src);
  return proxy;
}
