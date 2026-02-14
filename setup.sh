#!/bin/bash
set -e

echo "==> Starting PostgreSQL..."
docker-compose up -d

echo ""
echo "==> Installing data-server dependencies..."
(cd data-server && npm install)

echo ""
echo "==> Installing server dependencies..."
(cd server && npm install)

echo ""
echo "==> Installing client dependencies..."
(cd client && npm install)

echo ""
echo "==> Waiting for PostgreSQL to be ready..."
sleep 3

echo ""
echo "==> Pushing Prisma schema to database..."
(cd server && npx prisma db push)

echo ""
echo "==> Generating Prisma client..."
(cd server && npx prisma generate)

echo ""
echo "============================================"
echo "  Setup complete!"
echo ""
echo "  Run each service in a separate terminal:"
echo ""
echo "    cd data-server && npm run dev   # Data server on :3001"
echo "    cd server && npm run dev        # Your server on :3000"
echo "    cd client && npm run dev        # Frontend on :5173"
echo "============================================"
