#!/bin/bash

# VPS Deployment Script for Agentuity
# This script helps deploy Agentuity to a remote VPS

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Agentuity VPS Deployment${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Get server details
read -p "Enter VPS IP address: " VPS_IP
read -p "Enter SSH username (default: root): " SSH_USER
SSH_USER=${SSH_USER:-root}
read -p "Enter SSH port (default: 22): " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

echo ""
echo -e "${BLUE}Testing SSH connection...${NC}"
if ssh -p $SSH_PORT -o ConnectTimeout=5 $SSH_USER@$VPS_IP "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo -e "${YELLOW}Please check your credentials and try again${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Checking if Node.js is installed on server...${NC}"
NODE_INSTALLED=$(ssh -p $SSH_PORT $SSH_USER@$VPS_IP "command -v node >/dev/null 2>&1 && echo 'yes' || echo 'no'")

if [ "$NODE_INSTALLED" = "no" ]; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    read -p "Which OS is the server running? (ubuntu/centos/debian): " OS_TYPE

    case $OS_TYPE in
        ubuntu|debian)
            ssh -p $SSH_PORT $SSH_USER@$VPS_IP "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
            ;;
        centos)
            ssh -p $SSH_PORT $SSH_USER@$VPS_IP "curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && yum install -y nodejs"
            ;;
        *)
            echo -e "${RED}Unsupported OS. Please install Node.js 20+ manually${NC}"
            exit 1
            ;;
    esac
    echo -e "${GREEN}✓ Node.js installed${NC}"
else
    NODE_VERSION=$(ssh -p $SSH_PORT $SSH_USER@$VPS_IP "node -v")
    echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"
fi

echo ""
echo -e "${BLUE}Installing required packages...${NC}"
ssh -p $SSH_PORT $SSH_USER@$VPS_IP "npm install -g pm2 @agentuity/cli" || {
    echo -e "${RED}Failed to install packages${NC}"
    exit 1
}
echo -e "${GREEN}✓ Packages installed${NC}"

echo ""
echo -e "${BLUE}Creating deployment directory...${NC}"
ssh -p $SSH_PORT $SSH_USER@$VPS_IP "mkdir -p /opt/snapmap"

echo ""
echo -e "${BLUE}Uploading Agentuity files...${NC}"
scp -P $SSH_PORT -r snapagent/* $SSH_USER@$VPS_IP:/opt/snapmap/
echo -e "${GREEN}✓ Files uploaded${NC}"

echo ""
echo -e "${BLUE}Installing dependencies on server...${NC}"
ssh -p $SSH_PORT $SSH_USER@$VPS_IP "cd /opt/snapmap && npm install"
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo -e "${YELLOW}Please configure your .env file on the server${NC}"
read -p "Do you want to edit .env now? (y/n): " EDIT_ENV

if [ "$EDIT_ENV" = "y" ]; then
    ssh -p $SSH_PORT $SSH_USER@$VPS_IP "cd /opt/snapmap && nano .env"
fi

echo ""
echo -e "${BLUE}Building Agentuity project...${NC}"
ssh -p $SSH_PORT $SSH_USER@$VPS_IP "cd /opt/snapmap && agentuity bundle"
echo -e "${GREEN}✓ Build complete${NC}"

echo ""
echo -e "${BLUE}Starting Agentuity with PM2...${NC}"
ssh -p $SSH_PORT $SSH_USER@$VPS_IP "cd /opt/snapmap && pm2 delete agentuity-server 2>/dev/null || true"
ssh -p $SSH_PORT $SSH_USER@$VPS_IP "cd /opt/snapmap && pm2 start .agentuity/index.js --name agentuity-server --node-args='--env-file .env --no-deprecation'"
ssh -p $SSH_PORT $SSH_USER@$VPS_IP "pm2 save"
echo -e "${GREEN}✓ Agentuity started${NC}"

echo ""
echo -e "${BLUE}Configuring PM2 startup...${NC}"
ssh -p $SSH_PORT $SSH_USER@$VPS_IP "pm2 startup systemd -u $SSH_USER --hp /home/$SSH_USER | tail -n 1" | bash
echo -e "${GREEN}✓ PM2 configured to start on boot${NC}"

echo ""
echo -e "${BLUE}Configuring firewall...${NC}"
read -p "Do you want to configure firewall to allow port 3500? (y/n): " CONFIG_FW

if [ "$CONFIG_FW" = "y" ]; then
    # Try UFW first (Ubuntu/Debian)
    ssh -p $SSH_PORT $SSH_USER@$VPS_IP "command -v ufw >/dev/null 2>&1 && sudo ufw allow 3500/tcp || true"
    # Try firewalld (CentOS/RHEL)
    ssh -p $SSH_PORT $SSH_USER@$VPS_IP "command -v firewall-cmd >/dev/null 2>&1 && sudo firewall-cmd --permanent --add-port=3500/tcp && sudo firewall-cmd --reload || true"
    echo -e "${GREEN}✓ Firewall configured${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  HTTP:  http://$VPS_IP:3500"
echo ""
echo -e "${BLUE}Useful commands (run on VPS):${NC}"
echo -e "  View logs:     ${YELLOW}pm2 logs agentuity-server${NC}"
echo -e "  Check status:  ${YELLOW}pm2 status${NC}"
echo -e "  Restart:       ${YELLOW}pm2 restart agentuity-server${NC}"
echo -e "  Stop:          ${YELLOW}pm2 stop agentuity-server${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Test the server: ${YELLOW}curl http://$VPS_IP:3500${NC}"
echo -e "2. Update your local .env: ${YELLOW}AGENTUITY_URL=http://$VPS_IP:3500${NC}"
echo -e "3. (Optional) Setup nginx reverse proxy for HTTPS"
echo -e "4. (Optional) Configure domain name"
echo ""
echo -e "${YELLOW}For SSL/HTTPS setup, see AGENTUITY_DEPLOYMENT.md${NC}"
