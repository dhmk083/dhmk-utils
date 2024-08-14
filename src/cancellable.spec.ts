import {
  flow,
  Cancelled,
  cancellable,
  cancellableChain,
  makeCancellable,
  makeCancellableFactory,
} from "./cancellable";
import { deferred } from "./fn";
import { queue } from "./queue";

const flushPromises = () => new Promise(process.nextTick);

test("queue", async () => {
  const d = deferred<string>();
  const cb1 = jest.fn();
  const cb2 = jest.fn().mockResolvedValue("p2");

  const q = queue();
  const p1 = q(() => {
    cb1();
    return d;
  });
  const p2 = q(cb2);

  await flushPromises();

  expect(cb1).toBeCalledTimes(1);
  expect(cb2).toBeCalledTimes(0);

  d.resolve("p1");
  await flushPromises();

  expect(cb2).toBeCalledTimes(1);

  await expect(p1).resolves.toBe("p1");
  await expect(p2).resolves.toBe("p2");

  const cb4 = jest.fn().mockResolvedValue("p4");

  const p3 = q(() => {
    throw new Error();
  });
  const p4 = q(cb4);

  await flushPromises();

  await expect(p3).rejects.toBeInstanceOf(Error);
  await expect(p4).resolves.toBe("p4");
});

test("cancellable", async () => {
  // 1. cancelation

  const d1 = deferred();
  const cb1 = jest.fn();

  const p1 = cancellable(async (checkCancel) => {
    checkCancel.onCancel(() => {
      expect(checkCancel.isCancelled).toBe(true);
      cb1();
    });

    expect(checkCancel.isCancelled).toBe(false);
    expect(cb1).toBeCalledTimes(0);

    await d1.then(checkCancel);

    // these should not be called
    cb1();
    return 1;
  });

  p1.cancel();
  p1.cancel();
  p1.cancel();
  d1.resolve();
  await flushPromises();

  expect(cb1).toBeCalledTimes(1);
  await expect(p1).resolves.toBeInstanceOf(Cancelled);

  // 2. normal return

  const p2 = cancellable((checkCancel) => {
    return Promise.resolve(1).then(checkCancel);
  });

  await expect(p2).resolves.toBe(1);

  // 3. sync throw

  const p3 = cancellable(() => {
    throw new Error();
  });

  await expect(p3).rejects.toBeInstanceOf(Error);

  // 4. calls `cancel` on given promise

  const neverSettled = deferred();

  const p4 = cancellable(
    flow(function* () {
      yield neverSettled;
    })
  );

  p4.cancel();
  await expect(p4).resolves.toBeInstanceOf(Cancelled);
});

test("cancellableChain", async () => {
  const chain = cancellableChain();

  const p1 = chain(() => Promise.resolve(1));

  await flushPromises();
  await expect(p1).resolves.toBe(1);

  const p2 = chain(() => Promise.resolve(2));
  const p3 = chain(() => Promise.resolve(3));

  await expect(p2).resolves.toBeInstanceOf(Cancelled);
  await expect(p3).resolves.toBe(3);
});

test("makeCancellable", async () => {
  const f = makeCancellable((a: number) => async (ctx) => a);

  await expect(f(1)).resolves.toBe(1);

  const p2 = f(2);
  const p3 = f(3);

  await expect(p2).resolves.toBeInstanceOf(Cancelled);
  await expect(p3).resolves.toBe(3);
});

test("makeCancellableFactory", async () => {
  const makeCancellable = makeCancellableFactory();

  const f1 = makeCancellable((a: number) => async (ctx) => a);
  const f2 = makeCancellable((a: number) => async (ctx) => a);

  await expect(f1(1)).resolves.toBe(1);

  const p2 = f2(2);
  const p3 = f1(3);

  await expect(p2).resolves.toBeInstanceOf(Cancelled);
  await expect(p3).resolves.toBe(3);
});

test("flow", async () => {
  // 1. normal return

  const p1 = cancellable(
    flow(function* () {
      return yield Promise.resolve(1);
    })
  );

  await expect(p1).resolves.toBe(1);

  // 2. cancel

  const neverSettled = deferred();

  const p2 = cancellable(
    flow(function* () {
      yield neverSettled;
    })
  );

  p2.cancel();
  await expect(p2).resolves.toBeInstanceOf(Cancelled);

  // 3. throw

  // eslint-disable-next-line require-yield
  const p3 = cancellable(
    flow(function* () {
      throw new Error();
    })
  );

  await expect(p3).rejects.toBeInstanceOf(Error);
});
