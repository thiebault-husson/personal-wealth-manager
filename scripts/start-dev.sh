#!/bin/bash

# Personal Wealth Manager - Development Startup Script
# This script starts both backend and frontend servers

set -e

echo "🚀 Starting Personal Wealth Manager Development Environment"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the personal-wealth-manager directory"
    exit 1
fi

# Check if ChromaDB is running
echo "🔌 Checking ChromaDB status..."
if ! curl -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
    echo "⚠️  ChromaDB not running. Starting ChromaDB..."
    echo "   Run: npm run chromadb"
    echo "   Or: docker run -p 8000:8000 chromadb/chroma:latest"
    echo ""
fi

# Start backend in background
echo "🔧 Starting Backend API (port 3001)..."
npm run backend &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background  
echo "🎨 Starting Frontend (port 5173)..."
npm run frontend &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers starting!"
echo "   📡 Backend API: http://localhost:3001"
echo "   🖥️  Frontend:   http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
