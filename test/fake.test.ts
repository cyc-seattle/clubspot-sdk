import { afterEach, describe, expect, it, vi } from "vitest";
import { Parse } from "../src/parse.js";
import { FAKE_MASTER_KEY, FakeClubspot } from "../src/fake/index.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FakeClubspot", () => {
  it("saves through the fake's master key, then puts back the consumer's configuration", async () => {
    Parse.initialize("consumer-app");
    Parse.serverURL = "https://example.com/parse";
    let duringSave: unknown[] = [];
    vi.spyOn(Parse.Object.prototype, "save").mockImplementation(async function (this: Parse.Object) {
      duringSave = ["APPLICATION_ID", "SERVER_URL", "MASTER_KEY"].map((key) => Parse.CoreManager.get(key));
      return this;
    });

    await new FakeClubspot({ runId: "run1", serverUrl: "http://127.0.0.1:1/parse" }).camp(
      new Parse.Object("clubs") as never,
      "Summer Optis",
    );

    expect(duringSave).toEqual(["myclubspot2017", "http://127.0.0.1:1/parse", FAKE_MASTER_KEY]);
    expect(Parse.CoreManager.get("APPLICATION_ID")).toBe("consumer-app");
    expect(Parse.CoreManager.get("SERVER_URL")).toBe("https://example.com/parse");
    expect(Parse.CoreManager.get("MASTER_KEY")).toBeUndefined();
  });

  it("puts back the consumer's configuration when a save fails", async () => {
    Parse.initialize("consumer-app");
    vi.spyOn(Parse.Object.prototype, "save").mockRejectedValue(new Error("refused"));

    await expect(new FakeClubspot({ runId: "run1" }).club("Puget Youth Sailing")).rejects.toThrow("refused");

    expect(Parse.CoreManager.get("APPLICATION_ID")).toBe("consumer-app");
    expect(Parse.CoreManager.get("MASTER_KEY")).toBeUndefined();
  });
});
