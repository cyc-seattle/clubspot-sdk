import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { Clubspot } from "../src/index.js";
import { FakeUser } from "../src/fake/index.js";
import { fake, signIn } from "./support.js";

const feature = await loadFeature("./sign-in.feature");

describeFeature(feature, ({ Scenario }) => {
  Scenario("A user whose username isn't their email signs in with their email", ({ Given, When, Then }) => {
    let robin: FakeUser;
    let clubspot: Clubspot;

    Given("a user {string} whose username isn't their email", async (_, name: string) => {
      robin = await fake.user(name);
      expect(robin.user.getUsername()).not.toBe(robin.email);
    });

    When("{string} signs in with their email", async () => {
      clubspot = await signIn(robin.email, robin.password);
    });

    Then("{string} is signed in", () => {
      expect(clubspot.user.id).toBe(robin.user.id);
    });
  });

  Scenario("An email that belongs to no one can't sign in", ({ When, Then }) => {
    let signingIn: Promise<Clubspot>;

    When("someone signs in with an email that belongs to no one", () => {
      signingIn = signIn(`no.one.${fake.runId}@example.test`);
      signingIn.catch(() => {});
    });

    Then("they are told no user has that email", async () => {
      await expect(signingIn).rejects.toThrow("No user found with email address");
    });
  });
});
