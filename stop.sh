#!/bin/bash

# Find and kill processes running on the project ports
echo "==> Stopping all services..."

# Kill processes on ports 3001, 3000, and 5173
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "Done!"

