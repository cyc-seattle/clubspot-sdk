import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { Camp, queryCampEntries, Registration } from "../../src/index.js";
import { findSeededCamp } from "./support.js";

const feature = await loadFeature("features/paging.feature");

describeFeature(feature, ({ Scenario }) => {
  Scenario("Paging reads every entry of a camp with more than 1000 entries", ({ Given, When, Then }) => {
    let camp: Camp;
    const entries: Registration[] = [];

    Given("the seeded camp {string}", async (_, name: string) => {
      camp = await findSeededCamp(name);
    });

    When("an admin reads the entries of {string} {int} at a time", async (_, _name: string, pageSize: number) => {
      for (let skip = 0; ; skip += pageSize) {
        const page = await queryCampEntries(camp).limit(pageSize).skip(skip).find();
        entries.push(...page);
        if (page.length < pageSize) {
          return;
        }
      }
    });

    Then("they read {int} different entries", (_, count: number) => {
      expect(new Set(entries.map((entry) => entry.id)).size).toBe(count);
      expect(entries).toHaveLength(count);
    });
  });
});
