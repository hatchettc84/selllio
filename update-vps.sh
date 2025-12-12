#!/bin/bash

# Quick VPS Update Script for Selllio
# This script pulls latest changes and redeploys the application

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Selllio VPS Update${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Note: Some commands may require sudo${NC}"
fi

# Set application directory
APP_DIR="/opt/selllio"

if [ ! -d "$APP_DIR" ]; then
  echo -e "${RED}Error: Application directory not found at $APP_DIR${NC}"
  echo "Please update APP_DIR variable or ensure the application is installed."
  exit 1
fi

echo -e "${YELLOW}Step 1: Navigating to application directory...${NC}"
cd $APP_DIR

echo -e "${YELLOW}Step 2: Pulling latest changes from GitHub...${NC}"
git pull origin main

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to pull changes from GitHub${NC}"
  exit 1
fi

echo -e "${GREEN}Successfully pulled latest changes${NC}"

echo -e "${YELLOW}Step 3: Rebuilding Docker image...${NC}"
docker-compose -f docker-compose.production.yml build

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Docker build failed${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 4: Running database migrations (if any)...${NC}"
docker-compose -f docker-compose.production.yml run --rm selllio npx prisma migrate deploy || echo -e "${YELLOW}No new migrations or migration already applied${NC}"

echo -e "${YELLOW}Step 5: Restarting application...${NC}"
docker-compose -f docker-compose.production.yml up -d

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to start application${NC}"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Update Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Checking application status...${NC}"
docker-compose -f docker-compose.production.yml ps

echo ""
echo -e "${YELLOW}Recent logs (last 20 lines):${NC}"
docker-compose -f docker-compose.production.yml logs --tail=20

echo ""
echo -e "${GREEN}To view live logs, run:${NC}"
echo "docker-compose -f $APP_DIR/docker-compose.production.yml logs -f"
echo ""
echo -e "${GREEN}To check application health:${NC}"
echo "curl http://localhost:3000/api/health || echo 'Health check endpoint may not be available'"
