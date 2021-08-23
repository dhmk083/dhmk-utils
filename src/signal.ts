export type Listener<T = void> = (value: T) => void;

export interface Signal<T = void> {
  subscribe(onValue: Listener<T>): Function;
}

export interface Emitter<T = void> extends Signal<T> {
  emit(value: T): void;
  getListenersCount(): number;
}

export function signal<T = void>(): Emitter<T> {
  const listeners = new Set<any>();

  return {
    subscribe(onValue) {
      const sub = { onValue }; // to allow multiple calls with same `onValue` function
      listeners.add(sub);
      return () => listeners.delete(sub);
    },

    emit(value) {
      const errors: Error[] = [];

      listeners.forEach((sub) => {
        try {
          sub.onValue(value);
        } catch (e) {
          errors.push(e);
        }
      });

      if (errors.length) throw new AggregateError(errors);
    },

    getListenersCount: () => listeners.size,
  };
}

export function once<T>(s: Signal<T>, onValue?: Listener<T>) {
  return new Promise<T>((res) => {
    const dispose = s.subscribe((x) => {
      onValue?.(x);
      res(x);
      dispose?.();
    });
  });
}
