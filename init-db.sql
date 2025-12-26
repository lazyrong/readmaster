-- Quick initialization script for local database
-- Run with: npx wrangler d1 execute readmaster-production --local --command="$(cat init-db.sql)"

-- Or better: Just paste SQL from migrations/0001_initial_schema.sql

-- Run seed data
-- Run with: npx wrangler d1 execute readmaster-production --local --file=./seed.sql
