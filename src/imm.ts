export const array = {
  insert<T>(src: ReadonlyArray<T>, i: number, ...values: T[]) {
    return src.slice(0, i).concat(values).concat(src.slice(i, src.length));
  },

  append<T>(src: ReadonlyArray<T>, ...values: T[]) {
    return array.insert(src, src.length, ...values);
  },

  remove<T>(
    src: ReadonlyArray<T>,
    pred: (v: T, i: number, a: ReadonlyArray<T>) => boolean
  ) {
    return src.filter((v, i, a) => !pred(v, i, a));
  },

  set<T>(
    src: ReadonlyArray<T>,
    i: number,
    what: T extends Function
      ? (v: T, i: number) => T
      : T | ((v: T, i: number) => T)
  ) {
    return src.map((x, k) => {
      if (i === k) {
        return typeof what === "function" ? what(x, k) : what;
      } else return x;
    });
  },
} as const;

export const set = {
  add<T>(src: ReadonlySet<T>, v: T) {
    const set = new Set(src);
    return set.add(v);
  },

  delete<T>(src: ReadonlySet<T>, v: T) {
    const set = new Set(src);
    set.delete(v);
    return set;
  },
} as const;

export const map = {
  set<K, V>(src: ReadonlyMap<K, V>, k: K, v: V) {
    const map = new Map(src);
    return map.set(k, v);
  },

  delete<K, V>(src: ReadonlyMap<K, V>, k: K) {
    const map = new Map(src);
    map.delete(k);
    return map;
  },
} as const;

export const object = {
  set<T extends object, K extends keyof T = keyof T>(
    obj: T,
    key: K,
    what: T[K] extends Function
      ? (v: T[K], k: K) => T[K]
      : T[K] | ((v: T[K], k: K) => T[K])
  ) {
    return Object.assign({}, obj, {
      [key]: typeof what === "function" ? what(obj[key], key) : what,
    });
  },

  delete<T extends object, K extends keyof T = keyof T>(obj: T, key: K) {
    const { [key]: _, ...rest } = obj;
    return rest;
  },
} as const;
