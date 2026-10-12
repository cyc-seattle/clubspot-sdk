import { describe, it, expect } from "vitest";
import { Parse, schemas } from "../src/parse.js";
import { Club, InvoiceMembership } from "../src/types.js";

describe("register", () => {
  it("registers every class in types.ts under its JavaScript class name", () => {
    expect(schemas).toHaveLength(46);
    expect(schemas[0]).toEqual({ objectClass: "clubs", className: "Club", clazz: Club });
    expect(schemas.at(-1)).toEqual({
      objectClass: "invoices_membership",
      className: "InvoiceMembership",
      clazz: InvoiceMembership,
    });
  });

  it("makes Parse deserialize each objectClass into its subclass", () => {
    for (const { objectClass, clazz } of schemas) {
      expect(Parse.Object.fromJSON({ className: objectClass })).toBeInstanceOf(clazz);
    }
  });
});
