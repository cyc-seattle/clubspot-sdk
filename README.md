# @cyc-seattle/clubspot-sdk

[Clubspot](https://theclubspot.com/) is a SaaS product that manages golf and sailing clubs. It uses the [Parse](https://parseplatform.org/) application framework. This package is a community-supported TypeScript SDK for Clubspot, built on the Parse JavaScript SDK.

The package has two parts:

- a library of Parse classes for the Clubspot backend
- a `clubspot` CLI that uses the library

## Configuration

| Variable              | Default                         | Purpose                         |
| --------------------- | ------------------------------- | ------------------------------- |
| `CLUBSPOT_SERVER_URL` | `https://theclubspot.com/parse` | The Parse server to connect to. |
| `CLUBSPOT_APP_ID`     | `myclubspot2017`                | The Parse application ID.       |

The `Clubspot` constructor takes `serverUrl` and `applicationId` options. They override the variables.

## CLI usage

```sh
pnpm add -g @cyc-seattle/clubspot-sdk

clubspot --help

# Print the clubs that you admin
CLUBSPOT_PASSWORD=hunter2 clubspot --username you@example.com whoami
```

## Library usage

```sh
pnpm add @cyc-seattle/clubspot-sdk
```

```ts
import { Clubspot, Parse, UserClub } from "@cyc-seattle/clubspot-sdk";

const clubspot = new Clubspot();
await clubspot.initialize("you@example.com", process.env["CLUBSPOT_PASSWORD"]!);

const results = await new Parse.Query(UserClub)
  .include("clubObject")
  .equalTo("userObject", clubspot.user)
  .limit(10)
  .find();

console.log("Clubs that I admin:");
console.table(results.map((result) => result.get("clubObject").get("name")));
```

## Testing against the Clubspot fake

`fake/` holds a Clubspot fake: Parse Server 9.10.4 on Postgres 16, with the Clubspot classes that consumers query, the `retrieveUsersByEmailOrMobileNumber` cloud function, and a seed of synthetic data. It needs Docker. Any Docker works, colima included.

```sh
# Start the fake. It's seeded by the time this returns.
docker compose --file fake/compose.yaml up --build --wait

# Point the SDK or the CLI at it, and sign in as the seed's admin.
export CLUBSPOT_SERVER_URL=http://localhost:1337/parse
CLUBSPOT_PASSWORD=fake-password clubspot --username dockmaster@example.test whoami

# Stop it and delete its data.
docker compose --file fake/compose.yaml down --volumes
```

The seed's admin signs in as `dockmaster@example.test`, which isn't their username. Every user's password is `fake-password`. The master key is in `fake/config.js`, and it's for tests only.

### Builders

`@cyc-seattle/clubspot-sdk/fake` exports builders that create a scenario's objects in the fake through the master key. Each name gets the run ID, so runs don't see each other's data.

```ts
import { FakeClubspot } from "@cyc-seattle/clubspot-sdk/fake";

const fake = new FakeClubspot({ runId: "a1b2c3d4" });
const club = await fake.club("Puget Youth Sailing");
const camp = await fake.camp(club, "Summer Optis"); // named "Summer Optis [a1b2c3d4]"
```

### Tasks

| Task                   | Needs Docker | Runs                                                                    |
| ---------------------- | ------------ | ----------------------------------------------------------------------- |
| `mise run test`        | No           | The unit tests in `test/`                                               |
| `mise run integration` | Yes          | The features in `integration/`, against a fake that it starts and stops |
| `mise run ci`          | Yes          | `check`, `test`, and `integration`                                      |

`mise run integration` uses port 1337 and the compose project `clubspot-fake`, so it stops a fake you started by hand.

## Release

Every merge to `main` releases from the PR title. The title must be a conventional commit.

| Title                                          | Release |
| ---------------------------------------------- | ------- |
| `fix:`                                         | Patch   |
| `feat:`                                        | Minor   |
| `!` after the type, or `BREAKING CHANGE`       | Major   |
| `chore:`, `docs:`, `ci:`, `test:`, `refactor:` | None    |

The release publishes to npm over OIDC, with provenance. Release notes are on the repo's GitHub releases.

## License

[Apache-2.0](https://github.com/cyc-seattle/clubspot-sdk/blob/main/LICENSE)
