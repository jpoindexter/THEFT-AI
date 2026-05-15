# MagicPath Reference Inventory

Source inspected: `/Applications/MagicPath.app/Contents`

Inspection date: 2026-05-15

## Handling

- The app was inspected and extracted without launching it.
- Extracted third-party contents are kept out of git via `.gitignore`.
- This repo should track only inventory notes and product learnings, not MagicPath packaged source or assets.

## What It Is

MagicPath is an Electron desktop wrapper around a hosted web app, not a bundled local UI.

- Bundle id: `ai.magicpath.desktop`
- Version: `0.1.5`
- App category: productivity
- License in extracted `package.json`: `UNLICENSED`
- Main executable: Mach-O arm64 Electron app
- Main app archive: `Resources/app.asar`

The extracted archive contains only:

- `package.json`
- `dist/main.js`
- `dist/main.js.map`
- `node_modules/`

There are no embedded renderer routes, React bundles, screen assets, or local app UI flows in the extracted archive.

## Runtime Behavior

The desktop app loads MagicPath from the network:

- Stable web URL: `https://magicpath.ai/?desktopApp=1`
- Stable app home: `https://magicpath.ai/files?desktopApp=1`
- Stable API: `https://api.magicpath.ai`
- Stable updates: `https://releases.magicpath.ai/electron/stable`

It also has preview and ngrok channels controlled by environment variables.

The desktop auth flow uses:

- URL scheme: `magicpath://auth?token=...`
- Token redemption endpoint: `/auth/desktop/tokens`
- Cookies: `x-user-access-token`, `x-user-refresh-token`

The main window is configured as:

- `1440x960` default size
- `1000x700` minimum size
- White background
- Auto-hidden menu bar
- Sandboxed renderer
- `MagicPathDesktop` appended to the user agent

## Product Learnings For THEFT

Useful patterns to consider:

- Treat desktop as a polished shell around a web product, not a forked UI.
- Route desktop users directly into the primary work surface after auth.
- Use a clear app-home concept. MagicPath uses `/files`; THEFT likely wants a Library, Company OS, or Mission Control home.
- Support a desktop-specific user-agent flag so the web app can tune dense layouts, safe areas, and command shortcuts.
- Keep deep-link auth separate from the web sign-in path.
- Make the default window large enough for real work and set a meaningful minimum size.
- Maintain stable/preview/local channels from the beginning if THEFT will ship as desktop.

Not useful from this binary alone:

- It does not expose MagicPath's hosted UI.
- It does not contain reusable screens, onboarding flows, components, or CSS.
- It should not be treated as source material to copy.

## Next Reference Options

1. Inspect the live hosted web app in a browser and capture screenshots of the visible unauthenticated flow.
2. Manually run MagicPath and provide screenshots of any authenticated screens worth studying.
3. Inspect local Electron cache directories only with explicit approval, because they may contain private session data.

