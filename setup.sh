#!/bin/bash
set -e

# Read ports from config.json
DATA_SERVER_PORT=$(node -e "const c=require('./config.json'); console.log(c.ports.dataServer)")
SERVER_PORT=$(node -e "const c=require('./config.json'); console.log(c.ports.server)")
CLIENT_PORT=$(node -e "const c=require('./config.json'); console.log(c.ports.client)")
POSTGRES_PORT=$(node -e "const c=require('./config.json'); console.log(c.ports.postgres)")

echo "==> Starting PostgreSQL..."
docker compose up -d

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
echo "==> Writing server/.env..."
cat > server/.env <<EOF
DATABASE_URL="postgresql://candidate:assignment@localhost:${POSTGRES_PORT}/ad_platform?schema=public"
EOF

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
echo "    cd data-server && npm run dev   # Data server on :${DATA_SERVER_PORT}"
echo "    cd server && npm run dev        # Your server on :${SERVER_PORT}"
echo "    cd client && npm run dev        # Frontend on :${CLIENT_PORT}"
echo "============================================"
