#!/bin/bash

# Chatbot Server Startup Script
# Starts the chatbot backend server independently

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}   Chatbot Server Startup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHATBOT_DIR="$PROJECT_ROOT/1"

# Configuration
PORT="${CHATBOT_PORT:-3001}"
AGENTUITY_URL="${AGENTUITY_URL:-http://localhost:3500}"

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
    echo -e "${YELLOW}Shutting down chatbot server...${NC}"

    if [ ! -z "$CHATBOT_PID" ] && ps -p $CHATBOT_PID > /dev/null 2>&1; then
        kill $CHATBOT_PID 2>/dev/null || true
    fi

    sleep 1
    kill_port $PORT

    echo -e "${GREEN}✓ Chatbot server stopped${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if directory exists
if [ ! -d "$CHATBOT_DIR" ]; then
    echo -e "${RED}Error: Chatbot directory not found at $CHATBOT_DIR${NC}"
    exit 1
fi

cd "$CHATBOT_DIR"

# Check/create .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✓${NC} Created .env file"
        echo -e "${YELLOW}⚠️  Please edit .env and add your API keys${NC}"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Found .env file"
fi

# Check/install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing chatbot dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Kill any existing processes on this port
kill_port $PORT

# Set environment variables for Agentuity URL
export AGENTUITY_URL=$AGENTUITY_URL
export PORT=$PORT

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

# Start chatbot server
echo -e "${BLUE}Starting chatbot server...${NC}"
echo -e "${BLUE}Port: ${PORT}${NC}"
echo -e "${BLUE}Agentuity URL: ${AGENTUITY_URL}${NC}"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "${BLUE}Local IP: ${LOCAL_IP}${NC}"
fi
echo ""

LOG_FILE="$SCRIPT_DIR/chatbot-server.log"
npm start > "$LOG_FILE" 2>&1 &
CHATBOT_PID=$!

# Wait for server to be ready
echo -e "${YELLOW}Waiting for chatbot server to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Chatbot server is ready! (PID: $CHATBOT_PID)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: Chatbot server failed to start${NC}"
        echo -e "Check the log file: $LOG_FILE"
        echo -e "${YELLOW}Common issues:${NC}"
        echo -e "  - Missing ANTHROPIC_API_KEY in .env"
        echo -e "  - Database not found at specified path"
        echo -e "  - Agentuity server not running at $AGENTUITY_URL"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Display success message
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}   Chatbot is now running!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  Local:      http://localhost:$PORT"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "  Network:    http://${LOCAL_IP}:$PORT"
fi
echo -e "  Health:     http://localhost:$PORT/health"
echo ""
echo -e "${BLUE}Process ID:${NC}    $CHATBOT_PID"
echo -e "${BLUE}Log file:${NC}      $LOG_FILE"
echo -e "${BLUE}Agentuity:${NC}     $AGENTUITY_URL"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Keep script running and monitor process
while true; do
    if ! ps -p $CHATBOT_PID > /dev/null 2>&1; then
        echo -e "${RED}Error: Chatbot server stopped unexpectedly${NC}"
        echo -e "Check the log: $LOG_FILE"
        exit 1
    fi
    sleep 5
done
