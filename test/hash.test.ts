import { describe, expect, it } from "vitest";
import { hashJson, stableJson } from "../src/hash.js";

describe("stableJson", () => {
  it("sorts object keys deterministically", () => {
    expect(stableJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(hashJson({ b: 2, a: 1 })).toBe(hashJson({ a: 1, b: 2 }));
  });
});
