#!/bin/bash

# Start Backend (Chatbot) and Frontend
# This script starts both the chatbot server and React frontend

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Start Backend & Frontend${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHATBOT_DIR="$PROJECT_ROOT/1"
FRONTEND_DIR="$PROJECT_ROOT/snap-map"

# Configuration
CHATBOT_PORT="${CHATBOT_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
AGENTUITY_URL="${AGENTUITY_URL:-http://localhost:3500}"

# Function to kill processes on a port
kill_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}Stopping existing $name on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ $name stopped${NC}"
    fi
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"

    if [ ! -z "$CHATBOT_PID" ] && ps -p $CHATBOT_PID > /dev/null 2>&1; then
        kill $CHATBOT_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    sleep 1
    kill_port $CHATBOT_PORT "Chatbot"
    kill_port $FRONTEND_PORT "Frontend"

    echo -e "${GREEN}✓ All servers stopped${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# ===== STEP 1: Start Chatbot Backend =====
echo -e "${BLUE}Step 1: Starting Chatbot Backend${NC}"
echo -e "${BLUE}=================================${NC}"

if [ ! -d "$CHATBOT_DIR" ]; then
    echo -e "${RED}Error: Chatbot directory not found at $CHATBOT_DIR${NC}"
    exit 1
fi

cd "$CHATBOT_DIR"

# Check .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✓${NC} Created .env file"
        echo -e "${YELLOW}⚠️  Please edit .env and add your API keys${NC}"
        echo ""
        read -p "Press Enter to continue after updating .env..."
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Found .env file"
fi

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing chatbot dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Kill any existing chatbot processes
kill_port $CHATBOT_PORT "Chatbot"

# Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

# Start chatbot server
echo -e "${BLUE}Starting chatbot server...${NC}"
echo -e "${BLUE}Port: ${CHATBOT_PORT}${NC}"
echo -e "${BLUE}Agentuity URL: ${AGENTUITY_URL}${NC}"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "${BLUE}Local IP: ${LOCAL_IP}${NC}"
fi
echo ""

CHATBOT_LOG="$PROJECT_ROOT/chatbot-server.log"
export PORT=$CHATBOT_PORT
export AGENTUITY_URL=$AGENTUITY_URL
npm start > "$CHATBOT_LOG" 2>&1 &
CHATBOT_PID=$!

# Wait for chatbot to be ready
echo -e "${YELLOW}Waiting for chatbot server to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:$CHATBOT_PORT/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Chatbot server is ready! (PID: $CHATBOT_PID)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: Chatbot server failed to start${NC}"
        echo -e "Check the log file: $CHATBOT_LOG"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# ===== STEP 2: Start React Frontend =====
echo ""
echo -e "${BLUE}Step 2: Starting React Frontend${NC}"
echo -e "${BLUE}==============================${NC}"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Kill any existing frontend processes
kill_port $FRONTEND_PORT "Frontend"

# Start frontend
echo -e "${BLUE}Starting React frontend...${NC}"
echo -e "${BLUE}Port: ${FRONTEND_PORT}${NC}"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "${BLUE}Local IP: ${LOCAL_IP}${NC}"
fi
echo ""

FRONTEND_LOG="$PROJECT_ROOT/frontend-server.log"
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo -e "${YELLOW}Waiting for frontend server to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend server is ready! (PID: $FRONTEND_PID)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: Frontend server failed to start${NC}"
        echo -e "Check the log file: $FRONTEND_LOG"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# ===== STEP 3: Open Browser =====
echo ""
echo -e "${BLUE}Step 3: Opening Browser${NC}"
echo -e "${BLUE}=======================${NC}"

sleep 2  # Give servers a moment to fully initialize

# Detect OS and open browser
case "$(uname -s)" in
    Darwin)
        open http://localhost:$FRONTEND_PORT
        ;;
    Linux)
        xdg-open http://localhost:$FRONTEND_PORT 2>/dev/null || sensible-browser http://localhost:$FRONTEND_PORT 2>/dev/null
        ;;
    CYGWIN*|MINGW*|MSYS*)
        start http://localhost:$FRONTEND_PORT
        ;;
    *)
        echo -e "${YELLOW}Could not detect OS. Please open http://localhost:$FRONTEND_PORT manually${NC}"
        ;;
esac

echo -e "${GREEN}✓ Browser opened${NC}"

# ===== SUCCESS MESSAGE =====
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}   Servers are now running!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  Frontend:     http://localhost:$FRONTEND_PORT"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "  Network:      http://${LOCAL_IP}:$FRONTEND_PORT"
fi
echo -e "  Backend API:  http://localhost:$CHATBOT_PORT"
echo -e "  Health:       http://localhost:$CHATBOT_PORT/health"
echo ""
echo -e "${BLUE}Process IDs:${NC}"
echo -e "  Chatbot:   $CHATBOT_PID"
echo -e "  Frontend:  $FRONTEND_PID"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  Chatbot:   $CHATBOT_LOG"
echo -e "  Frontend:  $FRONTEND_LOG"
echo ""
echo -e "${BLUE}Configuration:${NC}"
echo -e "  Agentuity: $AGENTUITY_URL"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep script running and monitor processes
while true; do
    # Check if chatbot is still running
    if ! ps -p $CHATBOT_PID > /dev/null 2>&1; then
        echo -e "${RED}Error: Chatbot server stopped unexpectedly${NC}"
        echo -e "Check the log: $CHATBOT_LOG"
        exit 1
    fi

    # Check if frontend is still running
    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${RED}Error: Frontend server stopped unexpectedly${NC}"
        echo -e "Check the log: $FRONTEND_LOG"
        exit 1
    fi

    sleep 5
done
