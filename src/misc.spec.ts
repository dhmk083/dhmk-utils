import { camelToSnakeCase, snakeToCamelCase } from "./misc";

test("camel to snake", () => {
  expect(
    camelToSnakeCase({
      helloThere: 1,
      someURLString: 1,
    })
  ).toEqual({
    hello_there: 1,
    some_url_string: 1,
  });
});

test("snake to camel", () => {
  expect(
    snakeToCamelCase({
      hello_there: 1,
      some_url_string: 1,
    })
  ).toEqual({
    helloThere: 1,
    someUrlString: 1,
  });
});
