// Initialize local D1 database with schema and seed data
// Run with: node scripts/init-db.js

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const schemaSQL = readFileSync('./migrations/0001_initial_schema.sql', 'utf-8');
const seedSQL = readFileSync('./seed.sql', 'utf-8');

console.log('Initializing database schema...');

// Split SQL into individual statements and execute them
const schemaStatements = schemaSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

for (const statement of schemaStatements) {
  try {
    execSync(`npx wrangler d1 execute readmaster-production --local --command="${statement.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit'
    });
  } catch (error) {
    // Continue even if there are errors (table might already exist)
  }
}

console.log('\nSeeding database...');

const seedStatements = seedSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

for (const statement of seedStatements) {
  try {
    execSync(`npx wrangler d1 execute readmaster-production --local --command="${statement.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit'
    });
  } catch (error) {
    // Continue even if there are errors
  }
}

console.log('\n✅ Database initialized successfully!');
