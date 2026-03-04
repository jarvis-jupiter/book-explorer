#!/bin/sh
set -e

echo "Running database migrations..."
cd /app && node_modules/.bin/prisma migrate deploy --schema packages/db/prisma/schema.prisma

echo "Starting API server..."
exec node /app/apps/api/dist/index.js
