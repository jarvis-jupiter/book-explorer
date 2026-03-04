#!/bin/sh
set -e

cd /app

echo "=== Diagnostic: dist/client.js import ==="
head -2 /app/packages/db/dist/client.js || echo "dist/client.js NOT FOUND"

echo "=== Diagnostic: generated client ==="
ls /app/packages/db/generated/client/ 2>/dev/null && echo "Generated client EXISTS" || echo "Generated client MISSING"

echo "=== Generating Prisma client ==="
node_modules/.bin/prisma generate --schema packages/db/prisma/schema.prisma

echo "=== Generated client after generate ==="
ls /app/packages/db/generated/client/ 2>/dev/null | grep "\.node\|index\.js" || echo "Still missing"

echo "=== Running database migrations ==="
node_modules/.bin/prisma migrate deploy --schema packages/db/prisma/schema.prisma

echo "=== Starting API server ==="
exec node /app/apps/api/dist/index.js
