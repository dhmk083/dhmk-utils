import { array } from "./imm";

describe("array", () => {
  const arr = [1, 2, 3, 4, 5];

  test("insert", () => {
    expect(array.insert(arr, 0, 9, 8, 7)).toEqual([9, 8, 7, 1, 2, 3, 4, 5]);
  });

  test("append", () => {
    expect(array.append(arr, 1, 2, 3)).toEqual([1, 2, 3, 4, 5, 1, 2, 3]);
  });

  test("remove", () => {
    expect(array.remove(arr, (x) => x % 2 === 0)).toEqual([1, 3, 5]);
  });

  test("set", () => {
    expect(array.set(arr, 0, 9)).toEqual([9, 2, 3, 4, 5]);
    expect(array.set(arr, arr.length - 1, (x) => x + 1)).toEqual([
      1, 2, 3, 4, 6,
    ]);
  });
});
