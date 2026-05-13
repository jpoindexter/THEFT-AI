# Quickstart: Paperclip Engine Adoption

## Verify The First Adoption Slice

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

4. Create and onboard a local company, then verify:

   - 8 departments exist
   - 8 agents exist
   - a Business Plan artifact exists
   - starter tasks exist
   - at least one task can run through the local/offline harness

5. Inspect company package generation in tests to confirm teams, agents, tasks, and skill references are represented with Paperclip-compatible semantics.
