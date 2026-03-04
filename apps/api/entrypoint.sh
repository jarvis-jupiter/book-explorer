#!/bin/sh
set -e

cd /app

echo "Generating Prisma client..."
node_modules/.bin/prisma generate --schema packages/db/prisma/schema.prisma

echo "Running database migrations..."
node_modules/.bin/prisma migrate deploy --schema packages/db/prisma/schema.prisma

echo "Starting API server..."
exec node /app/apps/api/dist/index.js
