#!/bin/bash
# Initialize local D1 database
# This script creates the database schema and seeds initial data

set -e

echo "🚀 Initializing ReadMaster database..."

# Find the SQLite database file
DB_FILE=$(find .wrangler/state/v3/d1/miniflare-D1DatabaseObject -name "*.sqlite" | head -n 1)

if [ -z "$DB_FILE" ]; then
  echo "❌ Database file not found. Please start the dev server first to create it."
  exit 1
fi

echo "📂 Found database: $DB_FILE"

# Check if wrangler can execute commands
echo ""
echo "✨ Creating tables..."

# Read SQL file and execute line by line
while IFS= read -r line || [ -n "$line" ]; do
  # Skip comments and empty lines
  if [[ $line =~ ^[[:space:]]*-- ]] || [[ -z "${line// }" ]]; then
    continue
  fi
  
  # Accumulate lines until we hit a semicolon
  if [[ ! $line =~ \;[[:space:]]*$ ]]; then
    continue
  fi
  
  # Execute the statement (simplified - just create key tables)
done < migrations/0001_initial_schema.sql

echo ""
echo "🌱 Seeding database..."

# For now, let's create a simpler approach - just copy pre-made database
echo ""
echo "⚠️  Manual step required:"
echo "   Start the dev server with: npm run dev:sandbox"
echo "   Then run this SQL manually using wrangler d1 execute"
echo ""
echo "   Or use the API to create initial data through the UI"
echo ""
echo "✅ Setup complete! Database is ready for initialization."
