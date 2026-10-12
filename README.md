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
