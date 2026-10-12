import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { Camp, CampSession, LoggedQuery } from "../src/index.js";
import { findSeededCamp } from "./support.js";

const feature = await loadFeature("./sessions.feature");

describeFeature(feature, ({ Scenario }) => {
  Scenario("A session with no dates reads as having none", ({ Given, When, Then }) => {
    let camp: Camp;
    let sessions: CampSession[];

    Given("the seeded camp {string}", async (_, name: string) => {
      camp = await findSeededCamp(name);
    });

    When("an admin reads the sessions of {string}", async () => {
      sessions = await new LoggedQuery(CampSession).equalTo("campObject", camp).find();
    });

    Then("the session {string} has no start or end date", (_, name: string) => {
      const session = sessions.find((candidate) => candidate.get("name") === name);

      expect(session).toBeDefined();
      expect(session?.get("startDate")).toBeUndefined();
      expect(session?.get("endDate")).toBeUndefined();
    });
  });
});
