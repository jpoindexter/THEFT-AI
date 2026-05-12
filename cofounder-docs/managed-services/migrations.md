# Migrations

Use migrations for database schema changes in the managed app repo.

That includes changes like:

- adding tables
- changing columns
- updating indexes or other schema-level database setup

If you are adding tables, this is the workflow to use.

In practice, have the **Engineer** agent work on the schema change and add the migration in the app repository.

## Where Migrations Live

Migrations live in `supabase/migrations/` in the app repository.

## How The Workflow Works

1. Add the migration file in the app repository.
2. Put up a GitHub pull request with that migration.
3. When that PR is open, the seeded GitHub workflow lint checks the migration files.
4. When that PR is merged into `main`, the seeded staging migration workflow runs automatically.
5. When those changes are later published from `main` to `prod`, the seeded production migration workflow runs automatically.

## Staging And Production

- merging a migration PR into `main` applies it to staging
- publishing to `prod` applies it to production

That keeps migrations lined up with the same staging-to-production flow as the app code.

## Next Steps

- [Supabase](/managed-services/supabase)
- [Publishing](/publishing/overview)
- [Environments](/publishing/environments)
