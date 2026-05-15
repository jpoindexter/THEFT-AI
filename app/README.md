# Archived THEFT Prototype

This directory is historical migration/reference material.

The active product runtime is `../paperclip/`. Do not add new product features, routes, API handlers, or runtime state here. If a useful prototype pattern remains in this folder, port it into `paperclip/` and document the port in `BUILD-FROM-THIS/STATUS.md`.

## Why This Exists

The old Next.js app proved early THEFT concepts:

- company onboarding;
- 8 department layout;
- Operator/chat language;
- Tech Tree/roadmap sketches;
- local JSON task/artifact state;
- visual references for later Paperclip-hosted surfaces.

Those concepts have been promoted into the Paperclip host. The JSON store and duplicated app routes are no longer the architecture.

## Current Run Path

From the repo root:

```sh
pnpm dev:once
```

Then open `http://127.0.0.1:3100`.

Do not use `pnpm -C app dev` for active product verification.
