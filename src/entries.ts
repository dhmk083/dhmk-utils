import { array, object } from "./imm";

type Setter<T> = T extends Function ? (x: T) => T : T | ((x: T) => T);

// prettier-ignore
interface Entries<T, K extends keyof any> extends Iterable<T> {
  readonly ids: ReadonlyArray<K>
  readonly byId: Readonly<Record<K, T>>
  readonly array: ReadonlyArray<T>

  readonly length: number

  map<R>(fn: (x: T, i: number, a: ReadonlyArray<T>) => R): ReadonlyArray<R>

  setById(id: K, x_f: Setter<T>): Entries<T, K>
  setAt(i: number, x_f: Setter<T>): Entries<T, K>

  replace(a: ReadonlyArray<T>): Entries<T, K>
  insert(i: number, ...values: T[]): Entries<T, K>
  append(...values: T[]): Entries<T, K>
  remove(pred: (x: T, i: number, a: ReadonlyArray<T>) => boolean): Entries<T, K>
}

// prettier-ignore
export function entries<T, K extends keyof any>(value?: ReadonlyArray<T>, mapKey?: (x: T, i: number, a: ReadonlyArray<T>) => K): Entries<T, K>
// prettier-ignore
export function entries<T, K extends keyof any>(value: ReadonlyArray<T> = [], mapKey = (x, i, a) => x.id, ids?: ReadonlyArray<K>, byId?: Readonly<Record<K, T>>) {
  const self: Entries<T, K> = {
    get ids() { return ids ??= self.array.map(mapKey) },
    get byId() { return byId ??= Object.fromEntries(self.array.map((x, i, a) => [mapKey(x, i, a), x])) as any },
    get array() { return value ??= self.ids.map(i => self.byId[i]) },

    get length() { return self.array.length },

    [Symbol.iterator]() { return self.array[Symbol.iterator]() },

    map(fn) { return self.array.map(fn) },

    setById(id, x_f) { return (entries as any)(undefined, mapKey, self.ids, object.set(self.byId, id, x_f)) },
    setAt(i, x_f) { return self.setById(self.ids[i], x_f) },

    replace(a) { return entries(a, mapKey) },
    insert(i, ...values) { return entries(array.insert(self.array, i, ...values), mapKey) },
    append(...values) { return self.insert(self.length, ...values) },
    remove(pred) { return entries(array.remove(self.array, pred), mapKey) },
  }

  return self;
}
