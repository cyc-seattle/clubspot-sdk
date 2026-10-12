import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { Camp, CampClass, CampSession, queryCampEntries, Registration } from "../src/index.js";
import { fake, signInAsAdmin } from "./support.js";

const feature = await loadFeature("./entries.feature");

describeFeature(feature, ({ Scenario }) => {
  Scenario("An entry arrives with its participant, sessions, classes, and billing", ({ Given, And, When, Then }) => {
    let camp: Camp;
    const sessions = new Map<string, CampSession>();
    const classes = new Map<string, CampClass>();
    let entries: Registration[];

    function entryFor(name: string): Registration {
      const entry = entries.find((registration) => {
        const participant = registration.get("participantsArray")?.[0];
        return `${participant?.get("firstName")} ${participant?.get("lastName")}` === name;
      });
      if (!entry) {
        throw new Error(`No entry for "${name}"`);
      }
      return entry;
    }

    Given(
      "the camp {string} has a session {string} and a class {string}",
      async (_, campName: string, sessionName: string, className: string) => {
        camp = await fake.camp(await fake.club("Puget Youth Sailing"), campName);
        sessions.set(sessionName, await fake.session(camp, { name: sessionName }));
        classes.set(className, await fake.campClass(camp, className));
      },
    );

    And(
      "{string} registers for {string} in {string} and pays {number}",
      async (_, name: string, sessionName: string, className: string, dollars: number) => {
        const [firstName, lastName] = name.split(" ");
        const cents = Math.round(dollars * 100);
        await fake.register(camp, {
          participant: { firstName, lastName },
          entries: [{ session: sessions.get(sessionName)!, campClass: classes.get(className)! }],
          billing: { amount: cents, amount_received: cents, currency: "usd" },
        });
      },
    );

    When("an admin reads the entries of {string}", async () => {
      await signInAsAdmin();
      entries = await queryCampEntries(camp).find();
    });

    Then(
      "the entry for {string} is in the session {string} and the class {string}",
      (_, name: string, sessionName: string, className: string) => {
        const entry = entryFor(name);
        const join = entry.get("sessionJoinObjects")?.[0];

        expect(entry.get("sessions")?.map((session) => session.get("name"))).toEqual([fake.named(sessionName)]);
        expect(entry.get("classes")?.map((campClass) => campClass.get("name"))).toEqual([fake.named(className)]);
        expect(join?.get("campSessionObject").get("name")).toBe(fake.named(sessionName));
        expect(join?.get("campClassObject").get("name")).toBe(fake.named(className));
      },
    );

    And("the entry for {string} shows {number} paid", (_, name: string, dollars: number) => {
      expect(entryFor(name).get("billing_registration")?.get("amount_received")).toBe(Math.round(dollars * 100));
    });
  });
});
