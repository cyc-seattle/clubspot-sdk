// Runs Parse Server beside `/ready`, which Parse Server has no route for: the CLI can't add one.
const express = require("express");
const fs = require("node:fs");
const { ParseServer } = require("./lib/index.js");
const config = require("./config.js");

const PORT = 1337;
// entrypoint.sh creates this once the seed finishes.
const SEEDED = "/tmp/seeded";

async function main() {
  // The CLI reads this variable itself, but the ParseServer constructor doesn't.
  const databaseURI = process.env.PARSE_SERVER_DATABASE_URI;
  if (!databaseURI) {
    throw new Error("PARSE_SERVER_DATABASE_URI is required");
  }
  const parse = new ParseServer({ ...config, databaseURI });
  await parse.start();

  const app = express();
  // Kubernetes ignores the image's HEALTHCHECK, so it probes this for a seeded server.
  app.get("/ready", (_req, res) => res.sendStatus(fs.existsSync(SEEDED) ? 200 : 503));
  app.use(new URL(config.serverURL).pathname, parse.app);
  app.listen(PORT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
