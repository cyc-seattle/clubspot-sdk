// Loads data.js into a running fake through the master key. Safe to run again on a seeded database.

const { appId, masterKey, serverURL } = require("../config.js");
const { records } = require("./data.js");

// Parse Server plans to cap a batch at 100 sub-requests by default.
const BATCH_SIZE = 100;
// The last record, so a half-finished seed runs again and fails loudly on the duplicates.
const SENTINEL = records.at(-1);

const headers = {
  "X-Parse-Application-Id": appId,
  "X-Parse-Master-Key": masterKey,
  "Content-Type": "application/json",
};

const mountPath = new URL(serverURL).pathname;
const pathFor = (className) => (className === "_User" ? "users" : `classes/${className}`);

async function isSeeded() {
  const response = await fetch(`${serverURL}/${pathFor(SENTINEL.className)}/${SENTINEL.objectId}`, { headers });
  return response.ok;
}

async function postBatch(batch) {
  const requests = batch.map(({ className, objectId, fields }) => ({
    method: "POST",
    path: `${mountPath}/${pathFor(className)}`,
    body: { objectId, ...fields },
  }));
  const response = await fetch(`${serverURL}/batch`, { method: "POST", headers, body: JSON.stringify({ requests }) });
  if (!response.ok) {
    throw new Error(`Seed batch failed: ${response.status} ${await response.text()}`);
  }
  const failures = (await response.json()).filter((result) => result.error);
  if (failures.length > 0) {
    throw new Error(`Seed batch failed: ${JSON.stringify(failures.slice(0, 5))}`);
  }
}

async function main() {
  if (await isSeeded()) {
    console.log("Seed already loaded");
    return;
  }
  for (let start = 0; start < records.length; start += BATCH_SIZE) {
    await postBatch(records.slice(start, start + BATCH_SIZE));
  }
  console.log(`Seeded ${records.length} objects`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
