import { CustomError } from "./error";
import { Emitter, signal, Signal } from "./signal";

export class CancelledError extends CustomError {}

export interface CToken extends Signal {
  cancelled: boolean;
  throwIfCancelled(): void;
}

export interface Cancellable extends CToken {
  cancel(): void;
}

export function cancellable(): Cancellable {
  let s: Emitter | undefined = signal();

  return {
    subscribe(onValue) {
      if (s) return s.subscribe(onValue);

      onValue();
      return () => {};
    },

    get cancelled() {
      return s === undefined;
    },

    cancel() {
      if (!s) return;

      s.emit();
      s = undefined;
    },

    throwIfCancelled() {
      if (!s) throw new CancelledError();
    },
  };
}
