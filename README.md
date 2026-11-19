# EIP Review

A client-side IDE for authoring, validating, and reviewing Ethereum proposals (EIPs, ERCs, and RIPs). Built with love from EIPsInsight.

## What it does

- **Guided drafting**: a structured preamble and section editor that generates correct EIP Markdown, with a live preview and a downloadable draft.
- **Validation**: checks aligned with the rules the editors enforce in CI (the eipw validator, Markdown lint, section and copyright rules), tagged `CI` (blocks a PR) vs `guide` (EIPsInsight authoring guidance). Every finding links to its line.
- **Import and review**: pull in a published proposal by number, or an open pull request, and run the same checks against it.
- **Repo-aware**: applies the correct EIP / ERC / RIP rule set.
- Light and dark mode, responsive to any screen.

## Tech stack

Vite + React + TypeScript + Tailwind CSS v4. Single static bundle, deployable to any static host (including a sub-path on a Jekyll site).

## Develop

```bash
bun install
bun run dev
```

Then open the printed local URL.

## Build

```bash
bun run build      # type-checks, then emits a static bundle in dist/
bun run preview    # serve the build locally
```

## Architecture notes

- Validation lives in `src/lib/validation.ts`: a pure, dependency-free engine, structured so it can be swapped for `eipw` compiled to WebAssembly later for literal parity with CI.
- GitHub access (`src/lib/github.ts`) goes straight from the browser to `raw.githubusercontent.com` and `api.github.com`, both of which send permissive CORS headers.
- Rules are tagged `ci` (a check CI enforces) or `authoring` (our own guidance, never blocking). See `src/lib/types.ts`.

## Roadmap

- Swap the TypeScript validator for `eipw-lint-js` (WASM) built with a browser target, pinned to the version CI uses.
- Add the other CI gates that have JS implementations: `markdownlint` and `markdown-link-check`, reading the repo's own config files.
- A build-time `eip-index.json` (existing numbers + statuses) for the requires-exist / status-ordering checks and internal link resolution, so the whole core works offline.
