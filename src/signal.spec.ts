import { signal } from "./signal";

test("signal", () => {
  const s = signal<number>();
  const spyValue = jest.fn();
  const sub = s.subscribe(spyValue);

  s.emit(1);
  expect(spyValue).toBeCalledTimes(1);
  expect(spyValue).toBeCalledWith(1);

  sub();

  s.emit(2);
  expect(spyValue).toBeCalledTimes(1);

  const spy2 = jest.fn();
  const spy3 = jest.fn();

  const sub2 = s.subscribe(spy2);
  s.subscribe(spy3);
  s.emit(3);
  sub2();
  s.emit(4);

  expect(spy2).toBeCalledTimes(1);
  expect(spy3).toBeCalledTimes(2);
});
