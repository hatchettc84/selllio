#!/bin/bash

# Fix Docker Installation on AlmaLinux
# This script cleans up failed Docker installation and reinstalls correctly

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Fixing Docker on AlmaLinux${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 1: Stopping Docker service...${NC}"
systemctl stop docker 2>/dev/null || true
systemctl stop docker.socket 2>/dev/null || true

echo -e "${YELLOW}Step 2: Removing failed Docker installation...${NC}"
dnf remove -y docker \
              docker-client \
              docker-client-latest \
              docker-common \
              docker-latest \
              docker-latest-logrotate \
              docker-logrotate \
              docker-engine \
              docker-ce \
              docker-ce-cli \
              containerd.io 2>/dev/null || true

echo -e "${YELLOW}Step 3: Cleaning up Docker data and repositories...${NC}"
rm -rf /var/lib/docker
rm -rf /var/lib/containerd
rm -f /etc/yum.repos.d/docker*.repo

echo -e "${YELLOW}Step 4: Installing Docker dependencies...${NC}"
dnf install -y dnf-plugins-core

echo -e "${YELLOW}Step 5: Adding correct Docker repository for AlmaLinux...${NC}"
dnf config-manager --add-repo=https://download.docker.com/linux/rhel/docker-ce.repo

echo -e "${YELLOW}Step 6: Installing Docker...${NC}"
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo -e "${YELLOW}Step 7: Starting Docker service...${NC}"
systemctl start docker
systemctl enable docker

echo -e "${YELLOW}Step 8: Verifying Docker installation...${NC}"
if systemctl is-active --quiet docker; then
    echo -e "${GREEN}✓ Docker service is running${NC}"
else
    echo -e "${RED}✗ Docker service failed to start${NC}"
    echo -e "${YELLOW}Showing Docker logs:${NC}"
    journalctl -xeu docker.service --no-pager | tail -30
    exit 1
fi

# Test Docker
echo -e "${YELLOW}Step 9: Testing Docker...${NC}"
if docker run --rm hello-world > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker is working correctly${NC}"
else
    echo -e "${RED}✗ Docker test failed${NC}"
    exit 1
fi

# Show Docker version
echo ""
echo -e "${GREEN}Docker version:${NC}"
docker --version
docker-compose --version 2>/dev/null || docker compose version

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Docker Fixed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}You can now continue with the deployment:${NC}"
echo "cd /opt/selllio && bash deploy-production.sh"
