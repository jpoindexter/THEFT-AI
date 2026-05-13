# PAPERCLIP HOST PROMOTION

> Created 2026-05-13. This records the repo operation that turns Paperclip from ignored reference clone into tracked runtime host.

## Decision

Use `paperclip/` as a tracked source directory inside this repo.

This keeps THEFT work, product docs, skills, and the Paperclip runtime in one branch while we port THEFT surfaces into the Paperclip app.

## Upstream Baseline

| Field | Value |
|---|---|
| Upstream remote | `https://github.com/paperclipai/paperclip.git` |
| Upstream branch | `master` |
| Baseline commit | `d0e9cc76f2eb114ed63d398ee0a0185d64bff852` |

The local nested git metadata was moved from `paperclip/.git` to `paperclip/.git-upstream` and is ignored by the parent repo. The parent repo now owns tracked changes under `paperclip/`.

## Git Operation

Executed:

```sh
mv paperclip/.git paperclip/.git-upstream
```

Updated root `.gitignore`:

- removed the blanket `paperclip/` ignore;
- ignored `paperclip/.git-upstream/`;
- ignored Paperclip dependency folders, build outputs, runtime data, and test reports;
- preserved example env files.

Then staged `paperclip/` into the parent repository.

## Rules From Here

- Do product/runtime work in tracked `paperclip/`.
- Treat current `app/` as migration reference until parity is proven.
- Do not rebuild a parallel JSON runtime in `app/`.
- Keep `BUILD-FROM-THIS/` as planning/source authority during the merge.
- Keep `skills/` as THEFT product data until imported into Paperclip company skills.

## Next Work

1. Add THEFT skill import into Paperclip.
2. Add THEFT department/Operator templates.
3. Replace Paperclip generic company creation with THEFT staged onboarding.
4. Render THEFT canvas over Paperclip company/agent/issue data.
5. Archive temporary bridge code after the Paperclip host reaches parity.
