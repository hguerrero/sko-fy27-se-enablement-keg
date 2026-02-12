#!/bin/bash

# Kong Event Gateway Matrix UI - Development Startup Script
echo "🚀 Starting Kong Event Gateway Matrix UI Demo..."

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Start backend server
echo "📡 Starting backend server (port 3001)..."
cd server && npm start &
SERVER_PID=$!

# Wait for server to be ready
echo "⏰ Waiting for backend server to initialize..."
sleep 3

# Check if server is running
if curl -s http://localhost:3001/api/topics > /dev/null 2>&1; then
    echo "✅ Backend server ready!"
else
    echo "⚠️  Backend server may need more time to start..."
fi

# Go back to script directory
cd "$SCRIPT_DIR"

# Start frontend 
echo "🎨 Starting Matrix UI frontend (port 3000)..."
npm start

# Cleanup on exit
trap 'echo "🛑 Shutting down..."; kill $SERVER_PID 2>/dev/null; exit' INT TERM
wait