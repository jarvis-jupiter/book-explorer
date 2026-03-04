#!/bin/sh
set -e

# Generate the Prisma client into the local node_modules.
# pnpm deploy copies @prisma/client from the pnpm store but the store does
# NOT contain the generated .prisma/client/ runtime files — they must be
# generated inside the container against the schema.
echo "Generating Prisma client..."
node_modules/.bin/prisma generate --schema prisma/schema.prisma

echo "Running database migrations..."
node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma

echo "Starting API server..."
exec node dist/index.js
