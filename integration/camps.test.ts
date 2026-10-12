import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { Camp, Club, LoggedQuery } from "../src/index.js";
import { fake, signInAsAdmin } from "./support.js";

const feature = await loadFeature("./camps.feature");

describeFeature(feature, ({ Scenario }) => {
  Scenario("Discovery skips archived camps", ({ Given, And, When, Then }) => {
    const clubs = new Map<string, Club>();
    let found: Camp[];

    async function club(name: string): Promise<Club> {
      const existing = clubs.get(name);
      if (existing) {
        return existing;
      }
      const created = await fake.club(name);
      clubs.set(name, created);
      return created;
    }

    Given("the club {string} has a camp {string}", async (_, clubName: string, campName: string) => {
      await fake.camp(await club(clubName), campName);
    });

    And("the club {string} has an archived camp {string}", async (_, clubName: string, campName: string) => {
      await fake.camp(await club(clubName), campName, { archived: true });
    });

    When("an admin discovers the camps of {string}", async (_, clubName: string) => {
      await signInAsAdmin();
      found = await new LoggedQuery(Camp)
        .equalTo("clubObject", await club(clubName))
        .equalTo("archived", false)
        .find();
    });

    Then("the camps found are only {string}", (_, campName: string) => {
      expect(found.map((camp) => camp.get("name"))).toEqual([fake.named(campName)]);
    });
  });
});
