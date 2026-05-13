# Quickstart: Paperclip-First Engine Adoption

## Start Paperclip Baseline

1. Start Paperclip unchanged:

   ```sh
   pnpm -C paperclip dev
   ```

2. Verify the engine is alive:

   ```sh
   curl -fsS http://127.0.0.1:3100/api/health
   ```

3. Open Paperclip:

   ```text
   http://127.0.0.1:3100
   ```

## Verify THEFT App

1. Run tests:

   ```sh
   pnpm -C app test
   ```

2. Run a production build:

   ```sh
   pnpm -C app build
   ```

3. Start the app:

   ```sh
   pnpm -C app dev
   ```

4. Create and onboard a local company, then verify in Paperclip:

   - company exists in `/api/companies`
   - company goal exists
   - Operator and department agents exist
   - starter tasks exist as Paperclip issues
   - at least one issue can be claimed by heartbeat or completed by the board

5. Inspect skill wiring:

   - agent skill references resolve from `skills/`
   - missing skill packets are surfaced without blocking local company creation
