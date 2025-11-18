# AlmaLinux Deployment Guide for Selllio

Complete guide for deploying the Selllio multi-tenant webinar SaaS platform on AlmaLinux servers.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Server Setup](#server-setup)
- [Database Installation](#database-installation)
- [Node.js & Application Setup](#nodejs--application-setup)
- [Nginx Reverse Proxy](#nginx-reverse-proxy)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Process Management (PM2)](#process-management-pm2)
- [Environment Configuration](#environment-configuration)
- [Database Migration](#database-migration)
- [Production Deployment](#production-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- ✅ AlmaLinux 8 or 9 server (minimum 2GB RAM, 2 vCPU)
- ✅ Root or sudo access
- ✅ Domain name pointed to your server IP
- ✅ GitHub repository access
- ✅ API keys from:
  - OpenAI (for presentations & AI presenter)
  - Clerk (authentication)
  - Stripe (payments)
  - Stream.io (video streaming)
  - VAPI (AI voice calls)
  - Resend (email notifications)

## Architecture Overview

### Multi-Tenant Strategy
Selllio uses a **single database with row-level isolation** approach:
- One PostgreSQL database for all tenants
- Data isolation at application level via Prisma
- Each user's data is scoped by `userId`/`presenterId`
- Optimal for self-hosted AlmaLinux deployments

### Tech Stack
- **Frontend**: Next.js 15 with App Router
- **Backend**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL 15
- **Web Server**: Nginx (reverse proxy)
- **Process Manager**: PM2
- **Runtime**: Node.js 20 LTS

## Server Setup

### 1. Update System

```bash
# Update all packages
sudo dnf update -y

# Install EPEL repository
sudo dnf install -y epel-release

# Install development tools
sudo dnf groupinstall -y "Development Tools"

# Install essential utilities
sudo dnf install -y wget curl git nano vim
```

### 2. Configure Firewall

```bash
# Enable and start firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Allow HTTP, HTTPS, and SSH
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh

# Reload firewall
sudo firewall-cmd --reload

# Verify rules
sudo firewall-cmd --list-all
```

### 3. Create Application User

```bash
# Create non-root user for running the application
sudo useradd -m -s /bin/bash selllio
sudo passwd selllio

# Add to wheel group for sudo access (optional)
sudo usermod -aG wheel selllio

# Switch to selllio user
sudo su - selllio
```

## Database Installation

### Option 1: Local PostgreSQL (Recommended for Single Server)

```bash
# Install PostgreSQL 15
sudo dnf install -y postgresql15-server postgresql15-contrib

# Initialize database
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb

# Start and enable PostgreSQL
sudo systemctl enable postgresql-15
sudo systemctl start postgresql-15

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE selllio_db;
CREATE USER selllio_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE selllio_db TO selllio_user;
ALTER DATABASE selllio_db OWNER TO selllio_user;
\q
EOF

# Update pg_hba.conf for local connections
sudo nano /var/lib/pgsql/15/data/pg_hba.conf
# Change: local   all   all   peer
# To:     local   all   all   md5

# Restart PostgreSQL
sudo systemctl restart postgresql-15
```

**Connection String:**
```
DATABASE_URL=postgresql://selllio_user:your_secure_password_here@localhost:5432/selllio_db
```

### Option 2: External Managed Database

Use one of these providers:
- **Neon** (PostgreSQL, generous free tier) - https://neon.tech
- **Supabase** (PostgreSQL + extras) - https://supabase.com
- **Railway** (Easy setup) - https://railway.app

Get the connection string from your provider.

## Node.js & Application Setup

### 1. Install Node.js 20 LTS

```bash
# Install Node.js 20 from NodeSource
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install global packages
sudo npm install -g pm2
```

### 2. Clone Repository

```bash
# Switch to selllio user
sudo su - selllio

# Clone the repository
cd ~
git clone https://github.com/hatchettc84/selllio.git
cd selllio

# Install dependencies
npm install
```

### 3. Create Environment File

```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env
```

Add all required environment variables (see [Environment Configuration](#environment-configuration) below).

### 4. Build Application

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build Next.js application
npm run build

# Test the build
node .next/standalone/server.js
# Press Ctrl+C to stop after verifying it starts
```

## Nginx Reverse Proxy

### 1. Install Nginx

```bash
sudo dnf install -y nginx

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/conf.d/selllio.conf
```

Add the following configuration:

```nginx
# Upstream to Next.js application
upstream nextjs_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be configured with Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/selllio_access.log;
    error_log /var/log/nginx/selllio_error.log;

    # Maximum upload size (for presentations)
    client_max_body_size 20M;

    # Proxy to Next.js
    location / {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://nextjs_upstream;
        access_log off;
    }
}
```

**Important:** Replace `yourdomain.com` with your actual domain name.

### 3. Test Nginx Configuration

```bash
# Test configuration
sudo nginx -t

# If successful, reload Nginx
sudo systemctl reload nginx
```

## SSL/TLS Configuration

### Install Certbot and Get SSL Certificate

```bash
# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Temporarily stop Nginx
sudo systemctl stop nginx

# Get SSL certificate (standalone mode for first time)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Start Nginx
sudo systemctl start nginx

# Reload Nginx to use new certificates
sudo systemctl reload nginx

# Test automatic renewal
sudo certbot renew --dry-run

# Setup auto-renewal (already done by certbot)
sudo systemctl enable certbot-renew.timer
```

**Note:** Replace `yourdomain.com` with your domain. Certbot will automatically configure renewal.

## Process Management (PM2)

### 1. Create PM2 Ecosystem File

```bash
# Create PM2 configuration
nano ~/selllio/ecosystem.config.js
```

Add the following:

```javascript
module.exports = {
  apps: [
    {
      name: 'selllio',
      cwd: '/home/selllio/selllio',
      script: '.next/standalone/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      error_file: '/home/selllio/logs/selllio-error.log',
      out_file: '/home/selllio/logs/selllio-out.log',
      time: true,
      max_memory_restart: '1G',
      exp_backoff_restart_delay: 100,
    }
  ]
};
```

### 2. Start Application with PM2

```bash
# Create logs directory
mkdir -p ~/logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u selllio --hp /home/selllio
# Copy and run the command that PM2 outputs

# Verify application is running
pm2 status
pm2 logs selllio --lines 50
```

### 3. PM2 Management Commands

```bash
# View logs
pm2 logs selllio

# Restart application
pm2 restart selllio

# Stop application
pm2 stop selllio

# Monitor resources
pm2 monit

# Reload without downtime
pm2 reload selllio
```

## Environment Configuration

Edit `/home/selllio/selllio/.env` with all required variables:

```bash
# Environment
ENVIRONMENT=production

# Database
DATABASE_URL=postgresql://selllio_user:password@localhost:5432/selllio_db

# Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/callback
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/callback

# OpenAI (for presentations & AI presenter)
OPENAI_API_KEY=sk-proj-xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_STRIPE_CLIENT_ID=ca_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_SUBSCRIPTION_PRICE_ID=price_xxxxx

# Stream.io (video streaming)
NEXT_PUBLIC_STREAM_API_KEY=xxxxx
STREAM_SECRET=xxxxx

# VAPI (AI voice calls)
VAPI_PRIVATE_KEY=xxxxx
VAPI_ORG_ID=xxxxx
NEXT_PUBLIC_VAPI_API_KEY=xxxxx

# Resend (email notifications)
RESEND_API_KEY=re_xxxxx

# Email Configuration
EMAIL_FROM_NAME=Selllio
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

### Getting API Keys

See [COOLIFY_DEPLOYMENT.md](./COOLIFY_DEPLOYMENT.md#getting-api-keys) for detailed instructions on obtaining all API keys.

## Database Migration

After configuring the environment:

```bash
cd ~/selllio

# Run migrations
npx prisma migrate deploy

# Verify database
npx prisma db push

# Optional: Seed data
npx prisma db seed
```

## Production Deployment

### Initial Deployment

```bash
# 1. Pull latest code
cd ~/selllio
git pull origin main

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate deploy

# 5. Build application
npm run build

# 6. Restart with PM2
pm2 restart selllio

# 7. Verify deployment
pm2 logs selllio
curl http://localhost:3000/api/health
```

### Deployment Script

Create a deployment script for easy updates:

```bash
nano ~/deploy.sh
```

Add:

```bash
#!/bin/bash
set -e

echo "Starting deployment..."

cd ~/selllio

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Reload PM2 (zero-downtime)
pm2 reload selllio

echo "Deployment complete!"
pm2 status
```

Make executable:

```bash
chmod +x ~/deploy.sh
```

Use it:

```bash
~/deploy.sh
```

## Webhook Configuration

### Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`
5. Restart application: `pm2 restart selllio`

### Clerk Webhook (Optional)

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/clerk-webhook`
3. Select user events
4. Configure as needed

## Monitoring & Maintenance

### System Monitoring

```bash
# View PM2 status
pm2 status

# Monitor resources
pm2 monit

# View logs
pm2 logs selllio --lines 100

# View Nginx logs
sudo tail -f /var/log/nginx/selllio_access.log
sudo tail -f /var/log/nginx/selllio_error.log

# Check disk space
df -h

# Check memory usage
free -h

# Check PostgreSQL status
sudo systemctl status postgresql-15
```

### Database Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Manual backup
pg_dump -U selllio_user -h localhost selllio_db > ~/backups/selllio_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (cron)
crontab -e

# Add this line for daily backup at 2 AM:
0 2 * * * pg_dump -U selllio_user -h localhost selllio_db > ~/backups/selllio_$(date +\%Y\%m\%d_\%H\%M\%S).sql

# Keep only last 7 days of backups
0 3 * * * find ~/backups -name "selllio_*.sql" -mtime +7 -delete
```

### Log Rotation

```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
```

### Security Updates

```bash
# Regular system updates (weekly)
sudo dnf update -y

# After updates, restart services if needed
sudo systemctl restart nginx
pm2 restart selllio
```

## Scaling Considerations

### Current Setup (Single Server)
- Good for: 1-5000 concurrent users
- Database: Single PostgreSQL instance
- Web Server: Nginx + PM2 cluster mode

### To Scale Beyond:

#### Horizontal Scaling:
1. Add load balancer (HAProxy or Nginx load balancer)
2. Deploy multiple application servers
3. Shared PostgreSQL database
4. Use external file storage (S3-compatible)

#### Database Scaling:
1. Enable connection pooling (PgBouncer)
2. Add read replicas
3. Consider managed database (AWS RDS, Azure Database)

#### CDN Integration:
1. Use Cloudflare or similar CDN
2. Cache static assets
3. DDoS protection

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs selllio --err

# Check environment variables
cat ~/selllio/.env | grep -v "SECRET\|KEY\|PASSWORD"

# Test database connection
cd ~/selllio
npx prisma db pull
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql-15

# Check if PostgreSQL is listening
sudo ss -tulpn | grep 5432

# Test connection
psql -U selllio_user -h localhost -d selllio_db

# Check pg_hba.conf
sudo cat /var/lib/pgsql/15/data/pg_hba.conf
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# View error log
sudo tail -50 /var/log/nginx/selllio_error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### High Memory Usage

```bash
# Check memory
free -h
pm2 monit

# Restart application
pm2 restart selllio

# Increase swap if needed
sudo dd if=/dev/zero of=/swapfile bs=1G count=4
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Port Already in Use

```bash
# Find process using port 3000
sudo ss -tulpn | grep 3000

# Kill process if needed
sudo kill -9 <PID>

# Restart application
pm2 restart selllio
```

## Security Best Practices

- ✅ Keep system updated: `sudo dnf update -y`
- ✅ Use strong passwords for database
- ✅ Enable firewall (firewalld)
- ✅ Use SSL/TLS (Let's Encrypt)
- ✅ Configure fail2ban for SSH protection
- ✅ Regular backups
- ✅ Monitor logs for suspicious activity
- ✅ Use environment variables (never commit secrets)
- ✅ Keep Node.js and npm updated
- ✅ Run application as non-root user

## Performance Optimization

```bash
# Enable HTTP/2 in Nginx (already configured above)
# Enable gzip compression in Nginx

# Add to nginx.conf or server block:
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

# Reload Nginx
sudo systemctl reload nginx

# Optimize PostgreSQL for production
sudo nano /var/lib/pgsql/15/data/postgresql.conf

# Adjust these settings based on your server:
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 1GB      # 50-75% of RAM
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB

# Restart PostgreSQL
sudo systemctl restart postgresql-15
```

## Cost Estimation

### Infrastructure (AlmaLinux Server):
- **VPS (2GB RAM, 2 vCPU)**: $10-20/month (DigitalOcean, Linode, Vultr)
- **VPS (4GB RAM, 4 vCPU)**: $20-40/month (for higher traffic)
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)

### External Services (variable):
- OpenAI: ~$10-50/month (depends on usage)
- Clerk: Free tier (up to 10k MAU)
- Stripe: 2.9% + $0.30 per transaction
- Stream.io: ~$50-100/month (free tier available)
- VAPI: Pay per minute
- Resend: Free tier (100 emails/day)

**Total**: ~$70-220/month depending on usage and server size

## Quick Reference Commands

```bash
# Application Management
pm2 start ecosystem.config.js    # Start application
pm2 restart selllio              # Restart
pm2 logs selllio                 # View logs
pm2 monit                        # Monitor resources

# Deployment
~/deploy.sh                       # Deploy updates

# Database
npx prisma migrate deploy         # Run migrations
npx prisma studio                 # Database GUI

# Nginx
sudo nginx -t                     # Test config
sudo systemctl reload nginx       # Reload config
sudo tail -f /var/log/nginx/selllio_access.log  # View logs

# System
sudo dnf update -y                # Update system
sudo systemctl status postgresql-15  # Check PostgreSQL
free -h                           # Check memory
df -h                             # Check disk space
```

## Support & Resources

- GitHub Issues: https://github.com/hatchettc84/selllio/issues
- AlmaLinux Docs: https://wiki.almalinux.org
- Next.js Docs: https://nextjs.org/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Nginx Docs: https://nginx.org/en/docs/
- PM2 Docs: https://pm2.keymetrics.io/docs

---

## Quick Start Checklist

- [ ] AlmaLinux server provisioned
- [ ] Domain DNS configured
- [ ] System updated and firewall configured
- [ ] PostgreSQL installed and configured
- [ ] Node.js 20 installed
- [ ] Application cloned from GitHub
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Application built successfully
- [ ] PM2 configured and application running
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Webhooks configured (Stripe, Clerk)
- [ ] Deployment script created
- [ ] Backup strategy implemented
- [ ] Monitoring configured

**You're ready to launch! 🚀**
