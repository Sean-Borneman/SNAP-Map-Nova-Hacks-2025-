#!/bin/bash

# Deploy Agentuity to Remote (Agentuity Cloud)
# This script deploys Agentuity using the native `agentuity deploy` command

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Deploy Agentuity to Remote${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AGENTUITY_DIR="$PROJECT_ROOT/snapagent"

# Check if agentuity directory exists
if [ ! -d "$AGENTUITY_DIR" ]; then
    echo -e "${RED}Error: Agentuity directory not found at $AGENTUITY_DIR${NC}"
    exit 1
fi

cd "$AGENTUITY_DIR"

# Check if agentuity CLI is installed
if ! command -v agentuity &> /dev/null; then
    echo -e "${YELLOW}Agentuity CLI not found. Installing...${NC}"
    npm install -g @agentuity/cli
    echo -e "${GREEN}✓ Agentuity CLI installed${NC}"
else
    AGENTUITY_VERSION=$(agentuity --version 2>&1 | head -n 1)
    echo -e "${GREEN}✓ Agentuity CLI found: $AGENTUITY_VERSION${NC}"
fi

echo ""
echo -e "${BLUE}Checking login status...${NC}"

# Check if logged in
if ! agentuity whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Agentuity. Let's login...${NC}"
    echo ""
    agentuity login
    echo ""
    echo -e "${GREEN}✓ Logged in successfully${NC}"
else
    USER_INFO=$(agentuity whoami 2>&1)
    echo -e "${GREEN}✓ Already logged in: $USER_INFO${NC}"
fi

echo ""
echo -e "${BLUE}Checking dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

echo ""
echo -e "${BLUE}Building Agentuity project...${NC}"
agentuity build
echo -e "${GREEN}✓ Build complete${NC}"

echo ""
echo -e "${BLUE}Deploying to Agentuity Cloud...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"
echo ""

# Deploy to Agentuity Cloud
agentuity deploy

echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"

echo ""
echo -e "${BLUE}Getting deployment status...${NC}"
DEPLOYMENT_INFO=$(agentuity status)
echo "$DEPLOYMENT_INFO"

# Extract URL from deployment info
DEPLOYMENT_URL=$(echo "$DEPLOYMENT_INFO" | grep -i "url" | head -n 1 | awk '{print $NF}')

if [ -z "$DEPLOYMENT_URL" ]; then
    echo ""
    echo -e "${YELLOW}Could not automatically detect deployment URL${NC}"
    echo -e "${YELLOW}Run 'agentuity status' to see your deployment details${NC}"
else
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}  Deployment Successful!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo -e "${BLUE}Your Agentuity server is now live at:${NC}"
    echo -e "${GREEN}$DEPLOYMENT_URL${NC}"
    echo ""
fi

echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo -e "1. Update your local .env file:"
echo -e "   ${YELLOW}cd $PROJECT_ROOT/1${NC}"
echo -e "   ${YELLOW}nano .env${NC}"
echo ""
echo -e "2. Set the AGENTUITY_URL:"
if [ ! -z "$DEPLOYMENT_URL" ]; then
    echo -e "   ${GREEN}AGENTUITY_URL=$DEPLOYMENT_URL${NC}"
else
    echo -e "   ${GREEN}AGENTUITY_URL=<your-deployment-url>${NC}"
fi
echo ""
echo -e "3. Start your chatbot and frontend:"
echo -e "   ${YELLOW}cd $PROJECT_ROOT${NC}"
echo -e "   ${YELLOW}./bash/start-backend-frontend.sh${NC}"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  View logs:        ${YELLOW}agentuity logs${NC}"
echo -e "  Check status:     ${YELLOW}agentuity status${NC}"
echo -e "  Redeploy:         ${YELLOW}agentuity deploy${NC}"
echo -e "  View deployments: ${YELLOW}agentuity deployments${NC}"
echo ""
echo -e "${GREEN}Done! 🚀${NC}"
