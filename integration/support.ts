import { Camp, Clubspot, LoggedQuery } from "../src/index.js";
import { FAKE_PASSWORD, FakeClubspot, SEED_ADMIN_EMAIL } from "../src/fake/index.js";

const runId = process.env["RUN_ID"];
if (!runId) {
  throw new Error("RUN_ID is unset; run the integration tests with vitest.integration.config.ts");
}

export const fake = new FakeClubspot({ runId });

export async function signIn(email: string, password = FAKE_PASSWORD): Promise<Clubspot> {
  const clubspot = new Clubspot();
  await clubspot.initialize(email, password);
  return clubspot;
}

/** Any signed-in user can read the fake, so the seed's admin stands in for every admin. */
export function signInAsAdmin(): Promise<Clubspot> {
  return signIn(SEED_ADMIN_EMAIL);
}

export async function findSeededCamp(name: string): Promise<Camp> {
  await signInAsAdmin();
  const camp = await new LoggedQuery(Camp).equalTo("name", name).first();
  if (!camp) {
    throw new Error(`The seed has no camp "${name}"`);
  }
  return camp;
}
