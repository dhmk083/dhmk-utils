import { objectFrom, flatMap as _flatMap } from "./std";

const defaultEntitiesKey = "byId";
const defaultIdsKey = "ids";

type DefaultEntitiesKey = typeof defaultEntitiesKey;
type DefaultIdsKey = typeof defaultIdsKey;

export type NormalizedData<
  T,
  EntitiesKey extends string = DefaultEntitiesKey,
  IdsKey extends string = DefaultIdsKey
> = Record<EntitiesKey, Record<string, T>> &
  Record<IdsKey, ReadonlyArray<string>>;

type WithId = {
  [p: string]: any;
  id: string;
};

type DataAdapter<T, E extends string, I extends string> = {
  getId(item: T): string;

  from(data: ReadonlyArray<T>): NormalizedData<T, E, I>;

  from(
    ids: ReadonlyArray<string>,
    byId: Record<string, T>
  ): NormalizedData<T, E, I>;

  flatMap(
    context: NormalizedData<T, E, I>,
    fn: (item: T, index: number, id: string) => ReadonlyArray<T>
  ): NormalizedData<T, E, I>;

  insert(
    context: NormalizedData<T, E, I>,
    index: number,
    ...items: ReadonlyArray<T>
  ): NormalizedData<T, E, I>;

  append(
    context: NormalizedData<T, E, I>,
    ...items: ReadonlyArray<T>
  ): NormalizedData<T, E, I>;

  remove(
    context: NormalizedData<T, E, I>,
    what: string | ((item: T, index: number, id: string) => boolean)
  ): NormalizedData<T, E, I>;

  update(
    context: NormalizedData<T, E, I>,
    where: string | ((item: T, index: number, id: string) => boolean),
    what: (item: T, index: number, id: string) => T
  ): NormalizedData<T, E, I>;
};

const defaultId = <T extends WithId>(x: T) => x.id;

type ById = {
  <T extends { id: K }, K extends string | number>(arr: T[]): Record<K, T>;
  <T, K extends string | number>(arr: T[], getId: (x: T) => K): Record<K, T>;
};

export const byId: ById = (arr, getId = (x) => x.id) =>
  objectFrom(arr.map((x) => [getId(x), x]));

export const fromIds = <T>(
  ids: ReadonlyArray<string>,
  byId: Record<string, T>
) => ids.map((id) => byId[id]);

export function dataAdapter<T extends WithId>(): DataAdapter<
  T,
  DefaultEntitiesKey,
  DefaultIdsKey
>;
export function dataAdapter<
  T,
  EntitiesKey extends string = DefaultEntitiesKey,
  IdsKey extends string = DefaultIdsKey
>(
  getId: (item: T) => string,
  entitiesKey?: EntitiesKey,
  idsKey?: IdsKey
): DataAdapter<T, EntitiesKey, IdsKey>;
export function dataAdapter(
  getId = defaultId,
  entitiesKey = defaultEntitiesKey,
  idsKey = defaultIdsKey
) {
  function from(dataOrIds, cacheById?) {
    const data = cacheById ? fromIds(dataOrIds, cacheById) : dataOrIds;
    const ids = cacheById ? dataOrIds : data.map(getId);

    return {
      [entitiesKey]: byId(data, getId as any),
      [idsKey]: ids,
    };
  }

  function flatMap(context, fn) {
    const entities = context[entitiesKey];
    const ids = context[idsKey];

    return from(_flatMap(ids, (id: any, i) => fn(entities[id], i, id)));
  }

  function insert(context, index, ...items) {
    const { length } = context[idsKey];
    if (!length) return from(items);

    const atEnd = index === length;
    if (atEnd) index--;

    return flatMap(context, (x, i) =>
      i === index ? (atEnd ? [x, ...items] : [...items, x]) : [x]
    );
  }

  function append(context, ...items) {
    return insert(context, context[idsKey].length, ...items);
  }

  function remove(context, what) {
    if (typeof what === "string") {
      const _id = what;
      what = (_, __, id) => id === _id;
    }

    return flatMap(context, (x, i, id) => (what(x, i, id) ? [] : [x]));
  }

  function update(context, where, what) {
    if (typeof where === "string") {
      const _id = where;
      where = (_, __, id) => id === _id;
    }

    const entities = context[entitiesKey];
    const ids = context[idsKey];

    let isChanged;

    const nextEntities = objectFrom(
      ids.map((id, i) => {
        const v = entities[id];

        if (where(v, i, id)) {
          const nextV = what(v, i, id);
          if (nextV !== v) isChanged = true;
          return [id, nextV];
        } else return [id, v];
      })
    );

    if (!isChanged) return context;

    return {
      [entitiesKey]: nextEntities,
      [idsKey]: ids,
    };
  }

  return {
    getId,
    from,
    flatMap,
    insert,
    append,
    remove,
    update,
  };
}
