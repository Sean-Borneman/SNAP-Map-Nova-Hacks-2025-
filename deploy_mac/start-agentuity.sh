#!/bin/bash

# Agentuity Server Startup Script
# Starts the Agentuity agent server independently
# This server can be accessed from other machines on the network

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}   Agentuity Server Startup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AGENTUITY_DIR="$PROJECT_ROOT/snapagent"

# Configuration
PORT="${AGENTUITY_PORT:-3500}"
HOST="${AGENTUITY_HOST:-0.0.0.0}"  # Bind to all interfaces by default

# Function to kill processes on a port
kill_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}Stopping existing server on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ Server stopped${NC}"
    fi
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down Agentuity server...${NC}"

    if [ ! -z "$AGENTUITY_PID" ] && ps -p $AGENTUITY_PID > /dev/null 2>&1; then
        kill $AGENTUITY_PID 2>/dev/null || true
    fi

    sleep 1
    kill_port $PORT

    echo -e "${GREEN}✓ Agentuity server stopped${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if directory exists
if [ ! -d "$AGENTUITY_DIR" ]; then
    echo -e "${RED}Error: Agentuity directory not found at $AGENTUITY_DIR${NC}"
    exit 1
fi

cd "$AGENTUITY_DIR"

# Check/install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Agentuity dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Kill any existing processes on this port
kill_port $PORT

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

# Start Agentuity agent
echo -e "${BLUE}Starting Agentuity agent server...${NC}"
echo -e "${BLUE}Host: ${HOST}${NC}"
echo -e "${BLUE}Port: ${PORT}${NC}"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "${BLUE}Local IP: ${LOCAL_IP}${NC}"
fi
echo ""

LOG_FILE="$PROJECT_ROOT/agentuity-server.log"
export PORT=$PORT
agentuity dev > "$LOG_FILE" 2>&1 &
AGENTUITY_PID=$!

# Wait for server to be ready
echo -e "${YELLOW}Waiting for Agentuity server to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Agentuity agent is ready! (PID: $AGENTUITY_PID)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: Agentuity server failed to start${NC}"
        echo -e "Check the log file: $LOG_FILE"
        echo -e "${YELLOW}Make sure you're logged in with: agentuity login${NC}"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Display success message
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}   Agentuity is now running!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  Local:   http://localhost:$PORT"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "  Network: http://${LOCAL_IP}:$PORT"
fi
echo ""
echo -e "${BLUE}Process ID:${NC} $AGENTUITY_PID"
echo -e "${BLUE}Log file:${NC}   $LOG_FILE"
echo ""
echo -e "${YELLOW}To access from other machines:${NC}"
echo -e "  Set AGENTUITY_URL=http://${LOCAL_IP}:${PORT} in their .env file"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Keep script running and monitor process
while true; do
    if ! ps -p $AGENTUITY_PID > /dev/null 2>&1; then
        echo -e "${RED}Error: Agentuity server stopped unexpectedly${NC}"
        echo -e "Check the log: $LOG_FILE"
        exit 1
    fi
    sleep 5
done
