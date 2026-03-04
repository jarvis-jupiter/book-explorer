import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseRequest } from "../parse-request.js";

const TestSchema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().int().positive(),
});

describe("parseRequest", () => {
  it("returns ok result when input is valid", () => {
    const result = parseRequest(TestSchema, { name: "Alice", age: "30" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ name: "Alice", age: 30 });
    }
  });

  it("returns err result with ValidationError when input is invalid", () => {
    const result = parseRequest(TestSchema, { name: "", age: "abc" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("ValidationError");
    }
  });

  it("includes zod issues in error fields", () => {
    const result = parseRequest(TestSchema, { name: "", age: "-1" });
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === "ValidationError") {
      expect(result.error.fields).toBeDefined();
    }
  });
});
