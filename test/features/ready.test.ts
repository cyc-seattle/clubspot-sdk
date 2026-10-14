import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";

const feature = await loadFeature("features/ready.feature");

// `/ready` sits beside `/parse`, outside the SDK's server URL.
const readyUrl = new URL("../ready", `${process.env["CLUBSPOT_SERVER_URL"]}/`).href;

describeFeature(feature, ({ Scenario }) => {
  Scenario("A seeded fake is ready", ({ When, Then }) => {
    let response: Response;

    When("the fake's readiness is checked", async () => {
      response = await fetch(readyUrl);
    });

    Then("the fake is ready", () => {
      expect(response.status).toBe(200);
    });
  });
});
