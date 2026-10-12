import { afterEach, describe, expect, it, vi } from "vitest";
import { Clubspot } from "../src/clubspot.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Clubspot", () => {
  it("defaults to the main Clubspot API", () => {
    vi.stubEnv("CLUBSPOT_SERVER_URL", undefined);
    vi.stubEnv("CLUBSPOT_APP_ID", undefined);
    const clubspot = new Clubspot();

    expect(clubspot.serverUrl).toBe("https://theclubspot.com/parse");
    expect(clubspot.applicationId).toBe("myclubspot2017");
  });

  it("reads the server URL and app ID from the environment", () => {
    vi.stubEnv("CLUBSPOT_SERVER_URL", "http://localhost:1337/parse");
    vi.stubEnv("CLUBSPOT_APP_ID", "test-app");
    const clubspot = new Clubspot();

    expect(clubspot.serverUrl).toBe("http://localhost:1337/parse");
    expect(clubspot.applicationId).toBe("test-app");
  });

  it("prefers constructor options over the environment", () => {
    vi.stubEnv("CLUBSPOT_SERVER_URL", "http://localhost:1337/parse");
    vi.stubEnv("CLUBSPOT_APP_ID", "test-app");
    const clubspot = new Clubspot({ serverUrl: "https://example.com/parse", applicationId: "other-app" });

    expect(clubspot.serverUrl).toBe("https://example.com/parse");
    expect(clubspot.applicationId).toBe("other-app");
  });
});
