#!/bin/bash

# Selllio Production Deployment Script for AlmaLinux
# This script automates the deployment of Selllio to production

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Selllio Production Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
dnf update -y

echo -e "${YELLOW}Step 2: Installing required packages...${NC}"
dnf install -y git curl wget nano

# Install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
    dnf install -y docker-ce docker-ce-cli containerd.io
    systemctl start docker
    systemctl enable docker
    echo -e "${GREEN}Docker installed successfully${NC}"
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}Docker Compose already installed${NC}"
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Installing Nginx...${NC}"
    dnf install -y nginx
    systemctl enable nginx
    echo -e "${GREEN}Nginx installed successfully${NC}"
else
    echo -e "${GREEN}Nginx already installed${NC}"
fi

# Install Certbot
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installing Certbot...${NC}"
    dnf install -y certbot python3-certbot-nginx
    echo -e "${GREEN}Certbot installed successfully${NC}"
else
    echo -e "${GREEN}Certbot already installed${NC}"
fi

echo -e "${YELLOW}Step 3: Configuring firewall...${NC}"
if command -v firewall-cmd &> /dev/null; then
    systemctl start firewalld
    systemctl enable firewalld
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --reload
    echo -e "${GREEN}Firewall configured${NC}"
else
    echo -e "${YELLOW}firewalld not found, skipping firewall configuration${NC}"
fi

echo -e "${YELLOW}Step 4: Cloning repository...${NC}"
APP_DIR="/opt/selllio"
if [ -d "$APP_DIR" ]; then
    echo -e "${YELLOW}Directory exists, pulling latest changes...${NC}"
    cd $APP_DIR
    git pull
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone https://github.com/hatchettc84/selllio.git $APP_DIR
    cd $APP_DIR
fi

echo -e "${YELLOW}Step 5: Setting up environment variables...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}Creating .env.production file...${NC}"
    echo "Please provide the following environment variables:"

    read -p "Neon Database URL: " DATABASE_URL
    read -p "Clerk Publishable Key: " CLERK_PUB_KEY
    read -p "Clerk Secret Key: " CLERK_SECRET
    read -p "OpenAI API Key: " OPENAI_KEY
    read -p "Stripe Secret Key: " STRIPE_SECRET
    read -p "Stripe Publishable Key: " STRIPE_PUB
    read -p "Stripe Client ID: " STRIPE_CLIENT
    read -p "Stripe Webhook Secret: " STRIPE_WEBHOOK
    read -p "Stripe Subscription Price ID: " STRIPE_PRICE
    read -p "Stream.io API Key: " STREAM_KEY
    read -p "Stream.io Secret: " STREAM_SECRET
    read -p "VAPI Private Key: " VAPI_PRIVATE
    read -p "VAPI Org ID: " VAPI_ORG
    read -p "VAPI Public API Key: " VAPI_PUBLIC
    read -p "Resend API Key: " RESEND_KEY

    cat > .env.production <<EOF
# Environment
ENVIRONMENT=PRODUCTION

# Database
DATABASE_URL=${DATABASE_URL}

# Base URL
NEXT_PUBLIC_BASE_URL=https://selllio.com

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PUB_KEY}
CLERK_SECRET_KEY=${CLERK_SECRET}
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/callback
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/callback

# OpenAI
OPENAI_API_KEY=${OPENAI_KEY}

# Stripe
STRIPE_SECRET_KEY=${STRIPE_SECRET}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUB}
NEXT_PUBLIC_STRIPE_CLIENT_ID=${STRIPE_CLIENT}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK}
STRIPE_SUBSCRIPTION_PRICE_ID=${STRIPE_PRICE}

# Stream.io
NEXT_PUBLIC_STREAM_API_KEY=${STREAM_KEY}
STREAM_SECRET=${STREAM_SECRET}

# VAPI
VAPI_PRIVATE_KEY=${VAPI_PRIVATE}
VAPI_ORG_ID=${VAPI_ORG}
NEXT_PUBLIC_VAPI_API_KEY=${VAPI_PUBLIC}

# Resend
RESEND_API_KEY=${RESEND_KEY}

# Email
EMAIL_FROM_NAME=Selllio
EMAIL_FROM_ADDRESS=noreply@selllio.com
EOF
    echo -e "${GREEN}.env.production created${NC}"
else
    echo -e "${GREEN}.env.production already exists${NC}"
fi

echo -e "${YELLOW}Step 6: Building Docker image...${NC}"
docker-compose -f docker-compose.production.yml build

echo -e "${YELLOW}Step 7: Running database migrations...${NC}"
docker-compose -f docker-compose.production.yml run --rm selllio npx prisma migrate deploy

echo -e "${YELLOW}Step 8: Starting application...${NC}"
docker-compose -f docker-compose.production.yml up -d

echo -e "${YELLOW}Step 9: Configuring Nginx...${NC}"
cat > /etc/nginx/conf.d/selllio.conf <<'NGINXCONF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name selllio.com www.selllio.com;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Main application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name selllio.com www.selllio.com;

    # SSL Configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/selllio.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/selllio.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Client body size for file uploads
    client_max_body_size 20M;

    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support for live features
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
NGINXCONF

# Test nginx configuration
nginx -t

# Create certbot directory
mkdir -p /var/www/certbot

# Start nginx
systemctl restart nginx

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Make sure selllio.com DNS points to this server (145.223.121.234)"
echo "2. Run SSL certificate setup: certbot --nginx -d selllio.com -d www.selllio.com"
echo "3. Update Stripe webhook URL to: https://selllio.com/api/stripe-webhook"
echo "4. Update Clerk allowed origins to include: https://selllio.com"
echo "5. Change root password: passwd"
echo ""
echo "Application is running at: http://$(hostname -I | awk '{print $1}'):3000"
echo "After SSL setup, it will be at: https://selllio.com"
echo ""
echo -e "${GREEN}Check application logs: docker-compose -f /opt/selllio/docker-compose.production.yml logs -f${NC}"
