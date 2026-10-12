// Parse Server options for the Clubspot fake. Loaded with require(), so it stays CommonJS.

const string = { type: "String" };
const number = { type: "Number" };
const boolean = { type: "Boolean" };
const date = { type: "Date" };
const array = { type: "Array" };
// Clubspot omits `archived` rather than storing false, but `equalTo("archived", false)` skips a
// row with no value, so the fake stores the default that real rows behave as.
const archived = { type: "Boolean", defaultValue: false };
const pointer = (targetClass) => ({ type: "Pointer", targetClass });

// Parse treats an operation missing from a CLP as open to everyone, so each one is listed.
const authenticatedRead = {
  get: { requiresAuthentication: true },
  find: { requiresAuthentication: true },
  count: {},
  create: {},
  update: {},
  delete: {},
  addField: {},
  protectedFields: {},
};

const classes = {
  _User: {},
  clubs: {
    name: string,
  },
  user_club: {
    clubObject: pointer("clubs"),
    userObject: pointer("_User"),
    accepted: boolean,
    admin: boolean,
    manager: boolean,
    permissions: array,
  },
  chartOfAccounts: {
    clubObject: pointer("clubs"),
    name: string,
    code: string,
  },
  camps: {
    clubObject: pointer("clubs"),
    name: string,
    startDate: date,
    endDate: date,
    archived,
    chartOfAccounts: pointer("chartOfAccounts"),
    customFieldsArray: array,
  },
  campSessions: {
    clubObject: pointer("clubs"),
    campObject: pointer("camps"),
    name: string,
    startDate: date,
    endDate: date,
    archived,
    campClassesArray: array,
  },
  campClasses: {
    clubObject: pointer("clubs"),
    campObject: pointer("camps"),
    name: string,
    entryCapsArray: array,
  },
  entryCaps: {
    campClassObject: pointer("campClasses"),
    campSessionObject: pointer("campSessions"),
    cap: number,
  },
  customFields: {
    clubObject: pointer("clubs"),
    campObject: pointer("camps"),
    name: string,
    type: string,
    required: boolean,
    hide_from_member: boolean,
    allClasses: boolean,
  },
  participants: {
    firstName: string,
    lastName: string,
    email: string,
    DOB: date,
    gender: string,
    mobile: string,
    weight: string,
    medical: string,
    medical_allergies: string,
    medical_meds: string,
    medical_tetanus: string,
    pcpName: string,
    pcpNumber: string,
    emergencyContact: string,
    emergencyMobile: string,
    emergencyRelationship: string,
    emergencyEmail: string,
    emergencyContact_secondary: string,
    emergencyMobile_secondary: string,
    emergencyRelationship_secondary: string,
    emergencyEmail_secondary: string,
    parentGuardianName: string,
    parentGuardianEmail: string,
    parentGuardianMobile: string,
    parentGuardianName_secondary: string,
    parentGuardianEmail_secondary: string,
    parentGuardianMobile_secondary: string,
    street: string,
    city: string,
    state: string,
    zip: string,
    customFieldsArray: array,
  },
  registrations: {
    clubObject: pointer("clubs"),
    campObject: pointer("camps"),
    confirmed_at: date,
    status: string,
    waiver_status: string,
    archived,
    participantsArray: array,
    classes: array,
    sessions: array,
    sessionJoinObjects: array,
    billing_registration: pointer("billing_registration"),
  },
  registration_campSession: {
    campObject: pointer("camps"),
    campSessionObject: pointer("campSessions"),
    campClassObject: pointer("campClasses"),
    registrationObject: pointer("registrations"),
    confirmed_at: date,
    status: string,
    priority: number,
    waitlist: boolean,
    waitlistNumber: number,
    acceptedFromWaitlist: boolean,
  },
  billing_registration: {
    clubObject: pointer("clubs"),
    amount: number,
    amountPending: number,
    amountRefunded: number,
    amount_capturable: number,
    amount_deferred: number,
    amount_received: number,
    application_fee_amount: number,
    deferredAmountBilled: number,
    discount: number,
    processingFee: number,
    processing_passed_on: number,
    tax: number,
    currency: string,
  },
};

module.exports = {
  appId: "myclubspot2017",
  // Test-only. The fake holds only synthetic data, and this key must never guard anything real.
  masterKey: "fake-master-key-for-tests-only",
  // Parse allows the master key only from localhost by default, but builders and the seed's
  // checks call in from the Docker host.
  masterKeyIps: ["0.0.0.0/0", "::/0"],
  serverURL: "http://127.0.0.1:1337/parse",
  cloud: "./cloud/main.js",
  allowCustomObjectId: true,
  schema: {
    definitions: Object.entries(classes).map(([className, fields]) => ({
      className,
      fields,
      classLevelPermissions: authenticatedRead,
    })),
    lockSchemas: true,
  },
};
