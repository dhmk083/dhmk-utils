import { signal } from "./signal";

export class CustomError extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, new.target.prototype); // a key to successful extending
    Error.captureStackTrace?.(this, new.target);
  }
}

type Context<T> = Exclude<T, Error | number | string>;

export class DomainError<T, M> extends CustomError {
  readonly context: T;
  readonly error: Error | undefined;
  readonly code: number;
  readonly meta: M | undefined;

  constructor(context: Context<T>);
  constructor(context: Context<T>, error: Error);
  constructor(context: Context<T>, errorCode: number, meta?: M);
  constructor(context: Context<T>, error: Error, errorCode: number, meta?: M);
  constructor(a1, a2?, a3?, a4?) {
    super();

    this.context = a1;
    this.error = a2 instanceof Error ? a2 : undefined;
    this.code = (this.error ? a3 : a2) || 0;
    this.meta = this.error ? a4 : a3;

    if (this.error) {
      this.message = this.error.message;
      this.toString = this.error.toString.bind(this.error);
    }
  }
}

export function errorSignal() {
  const s = signal<Error>();

  return {
    subscribe: s.subscribe,
    emit: (e: Error) => {
      if (s.getListenersCount() === 0) throw e;

      s.emit(e);
    },
  };
}

export function handleGlobalError(
  fn: (error: Error, event: ErrorEvent | PromiseRejectionEvent) => void
) {
  const handleError = (ev) => fn(ev.error, ev);
  const handleRejection = (ev) => fn(ev.reason, ev);

  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);

  return () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
  };
}
