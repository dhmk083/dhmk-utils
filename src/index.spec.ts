import * as index from "./index";

jest.useFakeTimers();

test("signal", () => {
  const s = index.signal<number>();
  const spyValue = jest.fn();
  const spyDispose = jest.fn();
  const sub = s.observe(spyValue, spyDispose);

  s.emit(1);
  expect(spyValue).toBeCalledTimes(1);
  expect(spyValue).toBeCalledWith(1);

  sub();
  sub();
  expect(spyDispose).toBeCalledTimes(1);

  s.emit(2);
  expect(spyValue).toBeCalledTimes(1);

  const spy2 = jest.fn();
  const spy3 = jest.fn();

  const sub2 = s.observe(spy2);
  s.observe(spy3);
  s.emit(3);
  sub2();
  s.emit(4);

  expect(spy2).toBeCalledTimes(1);
  expect(spy3).toBeCalledTimes(2);
});

test("disposable", () => {
  const spy1 = jest.fn(() => {
    throw new Error();
  });
  const spy2 = jest.fn();
  const d = index.disposable(spy1, spy2);

  expect(d).toThrowError(index.AggregateError);
  expect(spy1).toBeCalledTimes(1);
  expect(spy2).toBeCalledTimes(1);
});

describe("deferred", () => {
  test("resolve", async () => {
    const spyThen = jest.fn();
    const spyCatch = jest.fn();
    const spyFinally = jest.fn();
    const d = index.deferred<number>();

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
    const d = index.deferred();

    const p = d.then(spyThen).catch(spyCatch).finally(spyFinally);
    d.reject(new Error());
    await p.catch();

    expect(spyThen).toBeCalledTimes(0);
    expect(spyCatch).toBeCalledTimes(1);
    expect(spyFinally).toBeCalledTimes(1);
  });
});

test("debounced", async () => {
  const spy = jest.fn();
  const d = index.debounced(spy, 10);

  d(1, 2, 3);
  d(4, 5, 6);
  d(7, 8, 9);

  const res = index.sleep(10).then(() => {
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(7, 8, 9);
  });

  jest.runAllTimers();
  return res;
});

test("throttled", async () => {
  const spy = jest.fn();
  const t = index.throttled(spy, 10);

  t(1, 2, 3);
  t(4, 5, 6);

  const res = index.sleep(5).then(() => {
    t(7, 8, 9);

    expect(spy).toBeCalledTimes(1);

    const _res = index.sleep(5).then(() => {
      t(10, 11, 12);

      expect(spy).toBeCalledTimes(2);
      expect(spy).nthCalledWith(1, 1, 2, 3);
      expect(spy).nthCalledWith(2, 10, 11, 12);
    });
    jest.advanceTimersByTime(5);
    return _res;
  });

  jest.advanceTimersByTime(5);
  return res;
});
