#!/bin/bash

# SnapMap Complete Startup Script
# Starts both the chatbot backend and React frontend

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}   SnapMap Complete Startup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AGENTUITY_DIR="$PROJECT_ROOT/snapagent"
CHATBOT_DIR="$PROJECT_ROOT/1"
FRONTEND_DIR="$PROJECT_ROOT/snap-map"

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

    # Kill by PID first
    if [ ! -z "$AGENTUITY_PID" ] && ps -p $AGENTUITY_PID > /dev/null 2>&1; then
        kill $AGENTUITY_PID 2>/dev/null || true
    fi
    if [ ! -z "$CHATBOT_PID" ] && ps -p $CHATBOT_PID > /dev/null 2>&1; then
        kill $CHATBOT_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    # Kill by port to ensure cleanup
    sleep 1
    kill_port 3500 "Agentuity"
    kill_port 3001 "Chatbot"
    kill_port 5173 "Frontend"

    echo -e "${GREEN}✓ All servers stopped${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# ===== INITIAL CLEANUP =====
echo -e "${BLUE}Cleaning up any existing servers...${NC}"
kill_port 3500 "Agentuity" 2>/dev/null || true
kill_port 3001 "Chatbot" 2>/dev/null || true
kill_port 5173 "Frontend" 2>/dev/null || true
echo ""

# ===== STEP 1: Start Agentuity Agent =====
echo -e "${BLUE}Step 1: Starting Agentuity Agent${NC}"
echo -e "${BLUE}=================================${NC}"

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

# Kill any existing Agentuity processes
kill_port 3500 "Agentuity"

# Start Agentuity agent
echo -e "${BLUE}Starting Agentuity agent server...${NC}"
AGENTUITY_LOG="$PROJECT_ROOT/agentuity-server.log"
agentuity dev > "$AGENTUITY_LOG" 2>&1 &
AGENTUITY_PID=$!

# Wait for server to be ready
echo -e "${YELLOW}Waiting for Agentuity server to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3500 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Agentuity agent is ready! (PID: $AGENTUITY_PID)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: Agentuity server failed to start${NC}"
        echo -e "Check the log file: $AGENTUITY_LOG"
        echo -e "${YELLOW}Make sure you're logged in with: agentuity login${NC}"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# ===== STEP 2: Start Chatbot Backend =====
echo ""
echo -e "${BLUE}Step 2: Starting Chatbot Backend${NC}"
echo -e "${BLUE}=================================${NC}"

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

# Kill any existing Chatbot processes
kill_port 3001 "Chatbot"

# Start chatbot server
echo -e "${BLUE}Starting chatbot server...${NC}"
CHATBOT_LOG="$PROJECT_ROOT/chatbot-server.log"
npm start > "$CHATBOT_LOG" 2>&1 &
CHATBOT_PID=$!

# Wait for server to be ready
echo -e "${YELLOW}Waiting for chatbot server to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
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

# ===== STEP 3: Start React Frontend =====
echo ""
echo -e "${BLUE}Step 3: Starting React Frontend${NC}"
echo -e "${BLUE}==============================${NC}"

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

# Kill any existing Frontend processes
kill_port 5173 "Frontend"

# Start frontend
echo -e "${BLUE}Starting React frontend...${NC}"
FRONTEND_LOG="$PROJECT_ROOT/frontend-server.log"
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Wait for server to be ready
echo -e "${YELLOW}Waiting for frontend server to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
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

# ===== STEP 4: Open Browser =====
echo ""
echo -e "${BLUE}Step 4: Opening Browser${NC}"
echo -e "${BLUE}=======================${NC}"

sleep 2  # Give servers a moment to fully initialize

# Detect OS and open browser
case "$(uname -s)" in
    Darwin)
        open http://localhost:5173
        ;;
    Linux)
        xdg-open http://localhost:5173 2>/dev/null || sensible-browser http://localhost:5173 2>/dev/null
        ;;
    CYGWIN*|MINGW*|MSYS*)
        start http://localhost:5173
        ;;
    *)
        echo -e "${YELLOW}Could not detect OS. Please open http://localhost:5173 manually${NC}"
        ;;
esac

echo -e "${GREEN}✓ Browser opened${NC}"

# ===== SUCCESS MESSAGE =====
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}   SnapMap is now running!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC}        http://localhost:5173"
echo -e "${BLUE}Backend API:${NC}     http://localhost:3001"
echo -e "${BLUE}Agentuity:${NC}       http://localhost:3500"
echo -e "${BLUE}Database:${NC}        $PROJECT_ROOT/Database/my_records.db"
echo ""
echo -e "${BLUE}Process IDs:${NC}"
echo -e "  Agentuity: $AGENTUITY_PID"
echo -e "  Chatbot:   $CHATBOT_PID"
echo -e "  Frontend:  $FRONTEND_PID"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  Agentuity: $AGENTUITY_LOG"
echo -e "  Chatbot:   $CHATBOT_LOG"
echo -e "  Frontend:  $FRONTEND_LOG"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep script running and monitor processes
while true; do
    # Check if Agentuity is still running
    if ! ps -p $AGENTUITY_PID > /dev/null 2>&1; then
        echo -e "${RED}Error: Agentuity server stopped unexpectedly${NC}"
        echo -e "Check the log: $AGENTUITY_LOG"
        exit 1
    fi

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
