#!/bin/bash

# Frontend Server Startup Script
# Starts the React frontend development server independently

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}   Frontend Server Startup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/snap-map"

# Configuration
PORT="${FRONTEND_PORT:-5173}"
CHATBOT_API_URL="${CHATBOT_API_URL:-http://localhost:3001}"
OPEN_BROWSER="${OPEN_BROWSER:-true}"

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
    echo -e "${YELLOW}Shutting down frontend server...${NC}"

    if [ ! -z "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    sleep 1
    kill_port $PORT

    echo -e "${GREEN}✓ Frontend server stopped${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

# Check/install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Kill any existing processes on this port
kill_port $PORT

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

# Start frontend server
echo -e "${BLUE}Starting React frontend...${NC}"
echo -e "${BLUE}Port: ${PORT}${NC}"
echo -e "${BLUE}Chatbot API: ${CHATBOT_API_URL}${NC}"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "${BLUE}Local IP: ${LOCAL_IP}${NC}"
fi
echo ""

LOG_FILE="$SCRIPT_DIR/frontend-server.log"
npm run dev > "$LOG_FILE" 2>&1 &
FRONTEND_PID=$!

# Wait for server to be ready
echo -e "${YELLOW}Waiting for frontend server to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend server is ready! (PID: $FRONTEND_PID)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: Frontend server failed to start${NC}"
        echo -e "Check the log file: $LOG_FILE"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Open browser if requested
if [ "$OPEN_BROWSER" = "true" ]; then
    echo -e "${BLUE}Opening browser...${NC}"
    sleep 2  # Give server a moment to fully initialize

    # Detect OS and open browser
    case "$(uname -s)" in
        Darwin)
            open http://localhost:$PORT
            ;;
        Linux)
            xdg-open http://localhost:$PORT 2>/dev/null || sensible-browser http://localhost:$PORT 2>/dev/null
            ;;
        CYGWIN*|MINGW*|MSYS*)
            start http://localhost:$PORT
            ;;
        *)
            echo -e "${YELLOW}Could not detect OS. Please open http://localhost:$PORT manually${NC}"
            ;;
    esac
    echo -e "${GREEN}✓ Browser opened${NC}"
fi

# Display success message
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}   Frontend is now running!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  Local:      http://localhost:$PORT"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "  Network:    http://${LOCAL_IP}:$PORT"
fi
echo ""
echo -e "${BLUE}Process ID:${NC}    $FRONTEND_PID"
echo -e "${BLUE}Log file:${NC}      $LOG_FILE"
echo -e "${BLUE}Chatbot API:${NC}   $CHATBOT_API_URL"
echo ""
echo -e "${YELLOW}Note:${NC} Make sure the chatbot server is running at $CHATBOT_API_URL"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Keep script running and monitor process
while true; do
    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${RED}Error: Frontend server stopped unexpectedly${NC}"
        echo -e "Check the log: $LOG_FILE"
        exit 1
    fi
    sleep 5
done
