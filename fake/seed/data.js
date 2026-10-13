// The fake's fixed data set. Every person and address is synthetic, and every objectId is fixed,
// so a test can rely on the same rows on every `up`.

// Matches FAKE_PASSWORD in src/fake/index.ts, which tests sign in with.
const PASSWORD = "fake-password";

const records = [];

const pointer = (className, objectId) => ({ __type: "Pointer", className, objectId });
const date = (iso) => ({ __type: "Date", iso: new Date(iso).toISOString() });

function add(className, objectId, fields) {
  records.push({ className, objectId, fields });
  return pointer(className, objectId);
}

// One club, administered by a user who signs in with an email that isn't their username.
const club = add("clubs", "seedClub01", { name: "Cascade Community Sailing" });
const admin = add("_User", "seedUser01", {
  username: "dockmaster",
  email: "dockmaster@example.test",
  password: PASSWORD,
});
add("user_club", "seedUcl001", { clubObject: club, userObject: admin, accepted: true, admin: true, manager: false });

const youthAccount = add("chartOfAccounts", "seedCoa001", {
  clubObject: club,
  name: "Youth Programs",
  code: "4100",
});

function camp(objectId, fields) {
  return add("camps", objectId, { clubObject: club, ...fields });
}

function session(objectId, campPointer, fields) {
  return add("campSessions", objectId, { clubObject: club, campObject: campPointer, ...fields });
}

function campClass(objectId, campPointer, name, caps) {
  const entryCapsArray = caps.map(([capId, sessionPointer, cap]) =>
    add("entryCaps", capId, {
      campClassObject: pointer("campClasses", objectId),
      ...(sessionPointer ? { campSessionObject: sessionPointer } : {}),
      cap,
    }),
  );
  return add("campClasses", objectId, { clubObject: club, campObject: campPointer, name, entryCapsArray });
}

/**
 * One registration, with its participant, a join object per entry, and optional billing. `key`
 * makes the objectIds, so it must be unique and short enough to keep them readable.
 */
function register(key, { camp: campPointer, participant, entries, billing, confirmedAt }) {
  const registrationId = `seedReg${key}`;
  const registration = pointer("registrations", registrationId);
  const confirmed_at = date(confirmedAt);

  const participantPointer = add("participants", `seedPar${key}`, participant);
  const joins = entries.map(([sessionPointer, classPointer], index) =>
    add("registration_campSession", `seedJn${key}${index}`, {
      campObject: campPointer,
      campSessionObject: sessionPointer,
      campClassObject: classPointer,
      registrationObject: registration,
      confirmed_at,
      status: "confirmed",
      priority: index + 1,
      waitlist: false,
    }),
  );
  const billingPointer = billing && add("billing_registration", `seedBil${key}`, { clubObject: club, ...billing });

  const unique = (pointers) => [...new Map(pointers.map((p) => [p.objectId, p])).values()];
  add("registrations", registrationId, {
    clubObject: club,
    campObject: campPointer,
    confirmed_at,
    status: "confirmed",
    waiver_status: "fully_signed",
    participantsArray: [participantPointer],
    sessions: unique(entries.map(([sessionPointer]) => sessionPointer)),
    classes: unique(entries.map(([, classPointer]) => classPointer)),
    sessionJoinObjects: joins,
    ...(billingPointer ? { billing_registration: billingPointer } : {}),
  });
}

const paid = (amount) => ({ amount, amount_received: amount, amountPending: 0, discount: 0, tax: 0, currency: "usd" });

// Summer: the everyday camp, with families, custom fields, and caps.
const summer = camp("seedCampSu", {
  name: "Summer Sailing 2026",
  startDate: date("2026-06-22"),
  endDate: date("2026-08-14"),
  chartOfAccounts: youthAccount,
  customFieldsArray: [pointer("customFields", "seedFldSch"), pointer("customFields", "seedFldTee")],
});
add("customFields", "seedFldSch", {
  clubObject: club,
  campObject: summer,
  name: "School",
  type: "text",
  required: true,
  hide_from_member: false,
  allClasses: true,
});
add("customFields", "seedFldTee", {
  clubObject: club,
  campObject: summer,
  name: "T-shirt size",
  type: "select",
  required: false,
  hide_from_member: false,
  allClasses: true,
});
const week1 = session("seedSesSu1", summer, {
  name: "Week 1",
  startDate: date("2026-06-22"),
  endDate: date("2026-06-26"),
  campClassesArray: [pointer("campClasses", "seedClsGrn"), pointer("campClasses", "seedClsRed")],
});
// No campClassesArray: the session offers every class.
const week2 = session("seedSesSu2", summer, {
  name: "Week 2",
  startDate: date("2026-06-29"),
  endDate: date("2026-07-03"),
});
const green = campClass("seedClsGrn", summer, "Opti Green", [
  ["seedCapGr1", week1, 12],
  ["seedCapGr2", week2, 12],
]);
const red = campClass("seedClsRed", summer, "Opti Red", [["seedCapRed", null, 20]]);

const school = (response) => ({ customFieldID: "seedFldSch", response });
const tee = (response) => ({ customFieldID: "seedFldTee", response });

// Siblings whose two guardians share one email address.
const lindqvist = {
  lastName: "Lindqvist",
  parentGuardianName: "Erik Lindqvist",
  parentGuardianEmail: "lindqvist.family@example.test",
  parentGuardianMobile: "206-555-0141",
  parentGuardianName_secondary: "Anna Lindqvist",
  parentGuardianEmail_secondary: "lindqvist.family@example.test",
  parentGuardianMobile_secondary: "206-555-0142",
  street: "100 Harbor Way",
  city: "Seattle",
  state: "WA",
  zip: "98101",
};
register("Lq1", {
  camp: summer,
  participant: {
    ...lindqvist,
    firstName: "Theo",
    DOB: date("2015-04-02"),
    gender: "male",
    customFieldsArray: [school("Whittier Elementary"), tee("Youth M")],
  },
  entries: [[week1, green]],
  billing: paid(45000),
  confirmedAt: "2026-02-01T17:00:00Z",
});
register("Lq2", {
  camp: summer,
  participant: {
    ...lindqvist,
    firstName: "Nora",
    DOB: date("2017-09-15"),
    gender: "female",
    customFieldsArray: [school("Whittier Elem."), tee("Youth S")],
  },
  entries: [[week1, red]],
  billing: paid(45000),
  confirmedAt: "2026-02-01T17:05:00Z",
});

// One person registered twice. Clubspot gives each registration its own participant row.
const okafor = {
  firstName: "Iris",
  lastName: "Okafor",
  DOB: date("2014-11-20"),
  gender: "female",
  parentGuardianName: "Chidi Okafor",
  parentGuardianEmail: "chidi.okafor@example.test",
  parentGuardianMobile: "206-555-0153",
};
register("Ok1", {
  camp: summer,
  participant: { ...okafor, customFieldsArray: [school("whittier elementary school")] },
  entries: [[week1, green]],
  billing: paid(45000),
  confirmedAt: "2026-02-03T09:30:00Z",
});
register("Ok2", {
  camp: summer,
  participant: { ...okafor, customFieldsArray: [school("Whittier Elementary")] },
  entries: [[week2, green]],
  billing: paid(45000),
  confirmedAt: "2026-03-10T12:00:00Z",
});

// Multi-word surnames (#178). Splitting the free-text guardian name at its first space gets the
// first right and the second wrong.
register("Dc1", {
  camp: summer,
  participant: {
    firstName: "Mateo",
    lastName: "de la Cruz",
    DOB: date("2016-01-08"),
    gender: "male",
    parentGuardianName: "Lucia de la Cruz",
    parentGuardianEmail: "lucia.delacruz@example.test",
    customFieldsArray: [school("Bryant Elementary")],
  },
  entries: [
    [week1, green],
    [week2, green],
  ],
  // Billing with no currency.
  billing: { amount: 90000, amount_received: 90000, amountPending: 0, discount: 0, tax: 0 },
  confirmedAt: "2026-02-10T20:15:00Z",
});
register("Vb1", {
  camp: summer,
  participant: {
    firstName: "Olive",
    lastName: "Van Der Berg",
    DOB: date("2015-07-30"),
    gender: "female",
    parentGuardianName: "Mary Ann Van Der Berg",
    parentGuardianEmail: "vanderberg@example.test",
    customFieldsArray: [school("Bryant Elementary School")],
  },
  entries: [[week2, red]],
  billing: paid(45000),
  confirmedAt: "2026-02-11T08:45:00Z",
});

// An archived camp, which discovery skips.
const frostbite = camp("seedCampWi", {
  name: "Winter Frostbite 2025",
  startDate: date("2025-12-06"),
  endDate: date("2026-02-28"),
  archived: true,
});
session("seedSesWi1", frostbite, {
  name: "Saturdays",
  startDate: date("2025-12-06"),
  endDate: date("2026-02-28"),
});

// Legacy sessions (#131): one with no dates, one with no dates or name, and an archived session
// that a cap and a join object still point at.
const keelboat = camp("seedCampKb", {
  name: "Fall Keelboat 2025",
  startDate: date("2025-09-13"),
  endDate: date("2025-10-26"),
});
const weekend1 = session("seedSesKb1", keelboat, {
  name: "Weekend 1",
  startDate: date("2025-09-13"),
  endDate: date("2025-09-14"),
});
session("seedSesTbd", keelboat, { name: "Open Water (dates TBD)" });
session("seedSesNon", keelboat, {});
const weekend0 = session("seedSesKb0", keelboat, {
  name: "Weekend 0",
  startDate: date("2025-09-06"),
  endDate: date("2025-09-07"),
  archived: true,
});
const keel = campClass("seedClsKel", keelboat, "Keelboat Basics", [
  ["seedCapKb1", weekend1, 6],
  ["seedCapKb0", weekend0, 6],
]);
register("Ab1", {
  camp: keelboat,
  participant: {
    firstName: "Ruth",
    lastName: "Achterberg",
    DOB: date("1988-05-19"),
    email: "ruth.achterberg@example.test",
    mobile: "206-555-0177",
  },
  entries: [
    [weekend0, keel],
    [weekend1, keel],
  ],
  billing: paid(32000),
  confirmedAt: "2025-08-20T15:00:00Z",
});

// More entries than one 1000-row page holds.
const BIG_CAMP_ENTRIES = 1001;
const fleet = camp("seedCampLs", {
  name: "Learn to Sail Fleet 2026",
  startDate: date("2026-04-04"),
  endDate: date("2026-09-26"),
});
const season = session("seedSesLs1", fleet, {
  name: "Season",
  startDate: date("2026-04-04"),
  endDate: date("2026-09-26"),
});
const fleetClass = campClass("seedClsLs1", fleet, "Fleet", [["seedCapLs1", season, BIG_CAMP_ENTRIES + 99]]);
const firstNames = ["Avery", "Blake", "Casey", "Devon", "Emery", "Finley", "Harper", "Jordan", "Kai", "Logan"];
const lastNames = ["Alder", "Birch", "Cedar", "Dogwood", "Elm", "Fir", "Ginkgo", "Hawthorn", "Juniper", "Larch"];
for (let i = 0; i < BIG_CAMP_ENTRIES; i++) {
  register(`Ls${String(i).padStart(4, "0")}`, {
    camp: fleet,
    participant: {
      firstName: firstNames[i % 10],
      lastName: `${lastNames[Math.floor(i / 10) % 10]}-${Math.floor(i / 100)}`,
      DOB: date(`2014-01-01T00:00:00Z`),
    },
    entries: [[season, fleetClass]],
    confirmedAt: new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString(),
  });
}

module.exports = { records };
