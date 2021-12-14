import * as fn from "./fn";

jest.useFakeTimers();

test("disposable", () => {
  const spy1 = jest.fn(() => {
    throw new Error();
  });
  const spy2 = jest.fn();
  const d = fn.disposable(spy1, spy2);

  expect(d).toThrowError(AggregateError);
  expect(spy1).toBeCalledTimes(1);
  expect(spy2).toBeCalledTimes(1);
});

describe("deferred", () => {
  test("resolve", async () => {
    const spyThen = jest.fn();
    const spyCatch = jest.fn();
    const spyFinally = jest.fn();
    const d = fn.deferred<number>();

    const p = d.then(spyThen).catch(spyCatch).finally(spyFinally);
    d.resolve(1);
    await p;

    expect(spyThen).toBeCalledWith(1);
    expect(spyCatch).toBeCalledTimes(0);
    expect(spyFinally).toBeCalledTimes(1);
  });

  test("reject", async () => {
    const spyThen = jest.fn();
    const spyCatch = jest.fn();
    const spyFinally = jest.fn();
    const d = fn.deferred();

    const p = d.then(spyThen).catch(spyCatch).finally(spyFinally);
    d.reject(new Error());
    await p.catch();

    expect(spyThen).toBeCalledTimes(0);
    expect(spyCatch).toBeCalledTimes(1);
    expect(spyFinally).toBeCalledTimes(1);
  });
});

test("debounced", async () => {
  const spy = jest.fn((a, b, c) => a + b + c);
  const d = fn.debounced(spy, 10);

  const r1 = d(1, 2, 3);
  const r2 = d(4, 5, 6);
  const r3 = d(7, 8, 9);

  const res = fn.sleep(10).then(async () => {
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(7, 8, 9);

    expect(await r1).toEqual(7 + 8 + 9);
    expect(await r1).toEqual(await r2);
    expect(await r1).toEqual(await r3);
  });

  jest.runAllTimers();
  return res;
});

test("throttled", async () => {
  const spy = jest.fn((a, b, c) => a + b + c);
  const t = fn.throttled(spy, 10);

  const r1 = t(1, 2, 3);
  const r2 = t(4, 5, 6);

  const res = fn.sleep(5).then(() => {
    const r3 = t(7, 8, 9);

    expect(spy).toBeCalledTimes(1);

    const _res = fn.sleep(5).then(async () => {
      const r4 = t(10, 11, 12);

      expect(spy).toBeCalledTimes(2);
      expect(spy).nthCalledWith(1, 1, 2, 3);
      expect(spy).nthCalledWith(2, 10, 11, 12);

      expect(await r1).toEqual(1 + 2 + 3);
      expect(await r1).toEqual(await r2);
      expect(await r1).toEqual(await r3);
      expect(await r4).toEqual(10 + 11 + 12);
    });
    jest.advanceTimersByTime(5);
    return _res;
  });

  jest.advanceTimersByTime(5);
  return res;
});
