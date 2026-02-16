#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==> Starting all services...${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}==> Stopping all services...${NC}"
    kill $DATA_SERVER_PID $SERVER_PID $CLIENT_PID 2>/dev/null || true
    exit
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Start data-server
echo -e "${GREEN}Starting data-server on port 3001...${NC}"
cd data-server
npm run dev > ../logs/data-server.log 2>&1 &
DATA_SERVER_PID=$!
cd ..

# Start server
echo -e "${GREEN}Starting server on port 3000...${NC}"
cd server
npm run dev > ../logs/server.log 2>&1 &
SERVER_PID=$!
cd ..

# Create logs directory if it doesn't exist
mkdir -p logs

# Start client
echo -e "${GREEN}Starting client on port 5173...${NC}"
cd client
npm run dev > ../logs/client.log 2>&1 &
CLIENT_PID=$!
cd ..

# Wait a bit for services to start
sleep 3

echo ""
echo -e "${BLUE}============================================"
echo "  All services are running!"
echo ""
echo "  Data Server: http://localhost:3001"
echo "  API Server:  http://localhost:3000"
echo "  Frontend:    http://localhost:5173"
echo ""
echo "  Logs are being written to:"
echo "    - logs/data-server.log"
echo "    - logs/server.log"
echo "    - logs/client.log"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "============================================${NC}"
echo ""

# Wait for all background processes
wait

