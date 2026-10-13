# AGENTS.md

Guidance for coding agents working in this repository.

## Project overview

`@cyc-seattle/clubspot-sdk` is a TypeScript SDK and CLI for Clubspot, which runs on Parse. It also ships a Clubspot fake for tests: a Parse Server in `fake/`, and builders exported as `@cyc-seattle/clubspot-sdk/fake`.

## Development environment

mise provides the tools in `mise.toml`. Run `mise trust`, then `mise run install`.

- `mise run check` — typecheck, then check formatting and lint
- `mise run test` — the unit tests in `test/`, apart from `test/features/`. No Docker needed.
- `mise run integration` — the features in `features/`, against the fake. Needs Docker.
- `mise run ci` — `check`, `test`, and `integration`, as CI runs them

## The Clubspot fake

- `fake/config.js` holds the Parse Server options and the Defined Schema. The schema declares only the classes and fields that consumers query: this SDK's queries and `clubspot-sync`. Add a class or field when a consumer starts reading it.
- `fake/cloud/main.js` holds the Cloud Code. It implements only the functions consumers call.
- `fake/seed/data.js` is the fixed seed, with fixed object IDs. Every person in it is synthetic. The container loads it before it reports healthy, so `docker compose --file fake/compose.yaml up --wait` returns a seeded server.
- `src/fake/` holds the builders. They create objects through the master key and need only the Parse SDK.
- Everything in `fake/` runs inside Parse Server, which loads it with `require()`, so it's CommonJS.
- Only `dist/` is published. The Docker files and the seed stay in the repo.

## Testing

- Unit tests live in `test/**/*.test.ts`, outside `test/features/`. They mock Parse and need no server.
- Integration features live in `features/*.feature`, with their steps in `test/features/*.test.ts`. Write them with the `write-feature` skill from [`cyc-seattle/agent-skills`](https://github.com/cyc-seattle/agent-skills).
- A scenario that needs its own data creates it with the builders, which name it with the run ID. A scenario that only reads uses the seed.

## Code style

- TypeScript with `@tsconfig/strictest`, ESM, and `.js` extensions on import paths
- ESLint with Prettier
- Comments explain why, not what. Record the outcome, not the path to it. No personal identifiers.

## Working in this repo

- PR titles are conventional commits. PRs merge by squash, and the title sets the release.
- Never push to `main`.
