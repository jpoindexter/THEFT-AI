# Engineer Agent

## What The Engineer Is For

The Engineer owns product and app implementation work.

Use it when the task needs code changes, repository investigation, debugging, tests, migrations, previews, or a pull request.

Good Engineer tasks include:

- fixing bugs in app or backend flows
- building product features
- changing UI, routing, APIs, jobs, or data flows
- adding or updating database migrations
- debugging failed previews, builds, tests, or deploys
- implementing Stripe, billing, checkout, subscriptions, or webhooks
- making technical SEO or site changes that require repository edits

For campaign strategy, naming, content, or creative assets, use the **Marketing Agent**. For brand systems, decks, email templates, or UI kits, use the **Design Agent**. For ICP, outbound, customer development, or pipeline work, use the **Sales Agent**.

## How To Start

Open **Canvas**, choose **Engineer**, and describe the product or code outcome you want.

Strong requests include the expected behavior, affected area, repo context, constraints, and verification you want:

- `Fix the checkout error when a user changes plans. Add tests and open a PR.`
- `Add a settings toggle for workspace notifications and verify it locally.`
- `Debug why the preview build is failing and send the smallest safe fix.`
- `Add the Supabase migration for saved reports, then update the app UI.`
- `Implement Stripe checkout for the new plan and verify the happy path.`

## What It Does

The Engineer can inspect the repository, change files, run commands, run tests, start the app locally, use local Supabase, and open a PR when the work is ready.

For user-facing changes, ask it to verify the affected flow in the sandbox before handing the work back. The Engineer should report what it tested, what passed, and any remaining manual review needed.

## Testing Changes Locally

The Engineer can test app changes in a sandbox before you review a PR.

That means it can make a change, run the app locally, open the app in a browser, and check the affected flow before handing the work back to you.

This is especially useful for:

- product flows that need clicking through
- UI changes that should be checked visually
- forms, dashboards, and authenticated screens
- database-backed features
- Supabase migrations or schema changes

For browser testing, the Engineer opens the local version of the app inside its sandbox and interacts with it like a user. It can load changed pages, click through flows, fill out forms, check desktop and mobile layouts, and fix issues it finds before asking you to review.

You can ask for this directly:

- `Test the signup flow in the sandbox before opening the PR.`
- `Click through the dashboard and make sure the new empty state looks right.`
- `Check this change on desktop and mobile.`
- `Run the app locally and include screenshots of the tested flow.`

If the app requires a login, add browser test credentials in [AI Settings](/settings/ai-settings) so the Engineer can use a test account instead of your personal account.

If browser verification runs into a login wall, missing account, missing organization, or empty test data, the Engineer should keep going when it can do so safely. It should use test credentials, start local Supabase, create a local-only test user or seed data, and retry the browser flow instead of stopping at the first setup issue.

## Local Supabase Verification

When a change depends on the database, auth, or storage, the Engineer can run Supabase locally in the sandbox.

Local Supabase gives the Engineer a safe backend for testing app behavior without touching production data.

The Engineer can use it to:

- apply and test migrations
- confirm new tables or columns work with the app
- create test data
- test login and auth-dependent flows
- verify database-backed UI before the PR is ready for review

For schema changes, the Engineer should still put migrations in the app repo and send them through the normal review and publishing flow.

For authenticated flows, ask the Engineer to create a local-only test user before browser testing. If the agent changes `seed.sql`, it should run `supabase db reset` against the local Supabase stack before retrying the browser flow so the running database sees the new seed data.

You can copy and paste this:

```text
Set up a local-only test user for this app using seed.sql.
Then run supabase db reset locally so the seed is applied.
Run the app with local Supabase and use that test user to
browser-test the changed flow end to end.

Do not use my personal account. Use non-sensitive test data,
and include the local test login plus what you verified in your
final summary or PR notes.
```

## Database Viewer

The database viewer lives on Canvas as the **Database** artifact in the **Engineering** workspace.

Use it to browse tables in the managed Supabase project from inside Cofounder. It also lets you upload a CSV file directly into one of those tables without leaving the Engineering workspace.

The Database artifact lets you:

- browse tables in the managed Supabase project
- open a table and see its records
- upload a CSV file into the currently opened table

To upload a CSV:

1. Open **Canvas**.
2. Open the **Engineering** workspace.
3. Open the **Database** artifact or **Database** tab.
4. Pick a schema and open the table you want to import into.
5. In the table view, click **Upload CSV** in the header.

The import flow walks through file selection, header mapping review, and import. Rows are appended to the table. Existing rows are not touched, and the import does not truncate or replace data.

CSV imports expect a standard `.csv` file with a header row. Headers must match columns on the target table, and the importer rejects unsupported mappings such as generated columns, unsupported identity columns, array columns, unknown columns, or missing required columns.

Empty cells for non-text columns are treated as "not provided", so column defaults and nulls still apply. If some rows fail validation, Cofounder reports row-level errors so you can fix the CSV and run the import again.

## Previews And Feedback

When the Engineer puts up a PR, Cofounder can show the preview right in the workspace.

The preview is the staged version of the PR. You can review the app or site as it exists in that branch before deciding what should happen next.

Previews also support [**Agentation**](https://www.agentation.com/). Use the Agentation bar in the bottom right of the preview to leave feedback directly on the UI and point to the part of the page you want changed.

That feedback can be handed back to the Engineer as follow-up work. In practice, you can review the preview, leave comments, and have the Engineer keep working from that feedback instead of starting over in a separate flow.

Markdown artifacts also support direct comments. Open a Markdown artifact, switch between **Preview** and **Source** when needed, select text or comment on the whole document, then send the comments to the artifact's chat. Cofounder keeps the selected quote, surrounding context, and current version with the message so the Engineer can make a scoped edit or reply when the request is ambiguous.

Before a PR reaches preview, the Engineer can also run the changed app in a sandbox and test the affected flow in a browser. For database-backed changes, it can use local Supabase to verify the app behavior before asking you to review.

## Plan First When The Change Is Risky

Choose **Plan** when the engineering change is large, risky, or touches several systems.

Plan mode is useful for:

- schema or migration work
- auth, billing, permissions, or security-sensitive changes
- work across frontend, backend, and infrastructure
- unclear bugs where the fix path is not obvious

After you approve the plan, the agent can continue into implementation.

## Review Before Shipping

Review the PR, preview, migration, and test notes before merging.

Pay extra attention to:

- database migrations and data changes
- auth, billing, secrets, and permissions
- user-visible UI changes
- external service changes
- tests the agent could not run

## Next Steps

- [Migrations](/managed-services/migrations)
- [Agents Overview](/agents/overview)
