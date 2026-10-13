/**
 * Builders for tests against the Clubspot fake (`fake/` in this repo). Each creates one
 * scenario's objects through the fake's master key, named with a run ID so that runs never read or
 * break each other's data.
 */
import { Parse } from "../parse.js";
import {
  BillingRegistration,
  Camp,
  CampClass,
  CampSession,
  Club,
  CustomField,
  EntryCap,
  Participant,
  Registration,
  RegistrationCampSession,
  UserClub,
} from "../types.js";

export const FAKE_SERVER_URL = "http://127.0.0.1:1337/parse";
export const FAKE_APP_ID = "myclubspot2017";
/** Test-only. It guards nothing but the fake's synthetic data. */
export const FAKE_MASTER_KEY = "fake-master-key-for-tests-only";
/** The password of every user in the seed and every user a builder creates. */
export const FAKE_PASSWORD = "fake-password";

/** The seed's admin, whose username isn't their email. */
export const SEED_ADMIN_EMAIL = "dockmaster@example.test";

type Fields<A> = { [P in keyof A]?: A[P] | undefined };
type ParticipantFields = Fields<ConstructorParameters<typeof Participant>[0]>;
type BillingFields = Omit<Fields<ConstructorParameters<typeof BillingRegistration>[0]>, "clubObject">;

export interface FakeClubspotOptions {
  runId: string;
  /** Defaults to CLUBSPOT_SERVER_URL, then the fake's local URL. */
  serverUrl?: string;
  applicationId?: string;
  masterKey?: string;
}

export interface FakeUser {
  user: Parse.User;
  email: string;
  password: string;
}

export interface SessionOptions {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  archived?: boolean;
  /** The classes it offers. Without them, a session offers every class in the camp. */
  classes?: CampClass[];
}

export interface CapOptions {
  cap: number;
  /** Without a session, the cap covers the class across the whole camp. */
  session?: CampSession;
}

export interface Entry {
  session: CampSession;
  campClass: CampClass;
}

export interface RegistrationOptions {
  participant: ParticipantFields;
  entries: Entry[];
  billing?: BillingFields;
  confirmedAt?: Date;
  status?: string;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
}

// The SDK's attribute types require server-set fields like `objectId`, so a new object takes a
// partial set. Undefined fields are dropped rather than sent.
function build<K extends new (attributes: never) => Parse.Object>(
  Klass: K,
  fields: Fields<ConstructorParameters<K>[0]>,
): InstanceType<K> {
  const attributes = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
  return new Klass(attributes as never) as InstanceType<K>;
}

const SCOPED_CONFIG = ["APPLICATION_ID", "SERVER_URL", "MASTER_KEY"] as const;
let turn: Promise<unknown> = Promise.resolve();

export class FakeClubspot {
  public readonly runId: string;
  private readonly serverUrl: string;
  private readonly applicationId: string;
  private readonly masterKey: string;

  constructor(options: FakeClubspotOptions) {
    this.runId = options.runId;
    this.serverUrl = options.serverUrl ?? (process.env["CLUBSPOT_SERVER_URL"] || FAKE_SERVER_URL);
    this.applicationId = options.applicationId ?? FAKE_APP_ID;
    this.masterKey = options.masterKey ?? FAKE_MASTER_KEY;
  }

  /** The name a builder gives an object, so a test can find it again. */
  public named(name: string): string {
    return `${name} [${this.runId}]`;
  }

  /** A user who signs in with an email that differs from their username. */
  public async user(name: string): Promise<FakeUser> {
    const id = `${slug(name)}.${this.runId}`;
    const email = `${id}@example.test`;
    const user = new Parse.User();
    user.setUsername(id.replace(/\./g, "-"));
    user.setEmail(email);
    user.setPassword(FAKE_PASSWORD);
    await this.save(user);
    return { user, email, password: FAKE_PASSWORD };
  }

  public async club(name: string, admins: Parse.User[] = []): Promise<Club> {
    const club = await this.save(build(Club, { name: this.named(name) }));
    await Promise.all(
      admins.map((userObject) =>
        this.save(build(UserClub, { clubObject: club, userObject, accepted: true, admin: true, manager: false })),
      ),
    );
    return club;
  }

  public async camp(
    club: Club,
    name: string,
    options: { startDate?: Date; endDate?: Date; archived?: boolean } = {},
  ): Promise<Camp> {
    return this.save(build(Camp, { clubObject: club, name: this.named(name), ...options }));
  }

  public async session(camp: Camp, options: SessionOptions = {}): Promise<CampSession> {
    const { name, classes, ...rest } = options;
    return this.save(
      build(CampSession, {
        clubObject: camp.get("clubObject"),
        campObject: camp,
        name: name === undefined ? undefined : this.named(name),
        campClassesArray: classes,
        ...rest,
      }),
    );
  }

  public async campClass(camp: Camp, name: string, caps: CapOptions[] = []): Promise<CampClass> {
    const campClass = await this.save(
      build(CampClass, { clubObject: camp.get("clubObject"), campObject: camp, name: this.named(name) }),
    );
    if (caps.length > 0) {
      const entryCaps = await Promise.all(
        caps.map(({ cap, session }) =>
          this.save(build(EntryCap, { campClassObject: campClass, campSessionObject: session, cap })),
        ),
      );
      campClass.set("entryCapsArray", entryCaps);
      await this.save(campClass);
    }
    return campClass;
  }

  public async customField(camp: Camp, name: string, type = "text"): Promise<CustomField> {
    const field = await this.save(
      build(CustomField, {
        clubObject: camp.get("clubObject"),
        campObject: camp,
        name: this.named(name),
        type,
        required: false,
        hide_from_member: false,
        allClasses: true,
      }),
    );
    camp.add("customFieldsArray", field);
    await this.save(camp);
    return field;
  }

  /** A confirmed registration, with its participant, a join object per entry, and any billing. */
  public async register(camp: Camp, options: RegistrationOptions): Promise<Registration> {
    const clubObject = camp.get("clubObject");
    const confirmedAt = options.confirmedAt ?? new Date();
    const status = options.status ?? "confirmed";

    const participant = await this.save(build(Participant, options.participant));
    const billing =
      options.billing && (await this.save(build(BillingRegistration, { clubObject, ...options.billing })));
    const unique = <T extends Parse.Object>(objects: T[]) => [...new Map(objects.map((o) => [o.id, o])).values()];

    const registration = await this.save(
      build(Registration, {
        clubObject,
        campObject: camp,
        confirmed_at: confirmedAt,
        status,
        participantsArray: [participant],
        sessions: unique(options.entries.map((entry) => entry.session)),
        classes: unique(options.entries.map((entry) => entry.campClass)),
        billing_registration: billing,
      }),
    );
    // A join points back at its registration, so it can only be saved once the registration has an id.
    const joins = await Promise.all(
      options.entries.map((entry, index) =>
        this.save(
          build(RegistrationCampSession, {
            campObject: camp,
            campSessionObject: entry.session,
            campClassObject: entry.campClass,
            registrationObject: registration,
            confirmed_at: confirmedAt,
            status,
            priority: index + 1,
            waitlist: false,
          }),
        ),
      ),
    );
    registration.set("sessionJoinObjects", joins);
    return this.save(registration);
  }

  // The SDK's configuration is global, so saves take turns, and each puts back what it found. A
  // consumer's later calls then never reach the fake or carry its master key.
  private save<T extends Parse.Object>(object: T): Promise<T> {
    const saved = turn.then(() => this.saveWithMasterKey(object));
    turn = saved.catch(() => undefined);
    return saved;
  }

  private async saveWithMasterKey<T extends Parse.Object>(object: T): Promise<T> {
    if (!Parse.applicationId) {
      Parse.initialize(this.applicationId);
    }
    const previous = SCOPED_CONFIG.map((key) => [key, Parse.CoreManager.get(key)] as const);
    try {
      Parse.CoreManager.set("APPLICATION_ID", this.applicationId);
      Parse.CoreManager.set("SERVER_URL", this.serverUrl);
      Parse.CoreManager.set("MASTER_KEY", this.masterKey);
      return await object.save(null, { useMasterKey: true });
    } finally {
      for (const [key, value] of previous) {
        Parse.CoreManager.set(key, value);
      }
    }
  }
}
