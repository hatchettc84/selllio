# Selllio Production Deployment - Step-by-Step Guide

## Quick Deployment to 145.223.121.234

### Step 1: SSH into Server
```bash
ssh root@145.223.121.234
# Password: ALLhulkDOES15###
```

### Step 2: Download and Run Deployment Script
```bash
curl -sSL https://raw.githubusercontent.com/hatchettc84/selllio/main/deploy-production.sh -o /tmp/deploy.sh
chmod +x /tmp/deploy.sh
/tmp/deploy.sh
```

### Step 3: Provide Environment Variables
When prompted, enter your API keys:

**Required Environment Variables:**
- Neon Database URL: `postgresql://...`
- Clerk Publishable Key: `pk_live_...`
- Clerk Secret Key: `sk_live_...`
- OpenAI API Key: `sk-proj-...`
- Stripe Secret Key: `sk_live_...`
- Stripe Publishable Key: `pk_live_...`
- Stripe Client ID: `ca_...`
- Stripe Webhook Secret: `whsec_...`
- Stripe Subscription Price ID: `price_...`
- Stream.io API Key: (from Stream dashboard)
- Stream.io Secret: (from Stream dashboard)
- VAPI Private Key: (from VAPI dashboard)
- VAPI Org ID: (from VAPI dashboard)
- VAPI Public API Key: (from VAPI dashboard)
- Resend API Key: `re_...`

### Step 4: Wait for Deployment
The script will:
- Install Docker, Nginx, Certbot
- Clone the repository
- Build Docker image
- Run database migrations
- Start the application
- Configure Nginx

This takes about 10-15 minutes.

### Step 5: Configure SSL Certificate
After deployment completes:
```bash
certbot --nginx -d selllio.com -d www.selllio.com --non-interactive --agree-tos --email your@email.com
```

### Step 6: Verify Deployment
```bash
# Check if containers are running
docker ps

# Check application logs
cd /opt/selllio
docker-compose -f docker-compose.production.yml logs -f

# Test health endpoint
curl http://localhost:3000/api/health
```

### Step 7: Update External Services

**Stripe Webhooks:**
1. Go to https://dashboard.stripe.com/webhooks
2. Update webhook URL to: `https://selllio.com/api/stripe-webhook`
3. Test webhook delivery

**Clerk Settings:**
1. Go to https://dashboard.clerk.com
2. Add `https://selllio.com` to allowed origins
3. Update redirect URLs to use `https://selllio.com/callback`

### Step 8: Change Root Password
```bash
passwd
# Enter new password twice
```

### Step 9: Test Application
Visit: `https://selllio.com`

Test these flows:
- User registration
- User login
- Create webinar
- Upload document & generate presentation
- Start live webinar
- AI voice call

## Troubleshooting

### If deployment fails:
```bash
# Check Docker logs
docker-compose -f /opt/selllio/docker-compose.production.yml logs

# Restart containers
docker-compose -f /opt/selllio/docker-compose.production.yml restart

# Rebuild if needed
cd /opt/selllio
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
```

### If SSL fails:
```bash
# Make sure DNS is pointing to server
dig selllio.com

# Try manual certbot
certbot certonly --nginx -d selllio.com -d www.selllio.com

# Check Nginx config
nginx -t
systemctl restart nginx
```

### Database connection issues:
```bash
# Test connection from container
docker-compose -f /opt/selllio/docker-compose.production.yml exec selllio npx prisma db pull
```

## Post-Deployment Maintenance

### View logs:
```bash
docker-compose -f /opt/selllio/docker-compose.production.yml logs -f
```

### Restart application:
```bash
docker-compose -f /opt/selllio/docker-compose.production.yml restart
```

### Update application:
```bash
cd /opt/selllio
git pull
docker-compose -f docker-compose.production.yml up -d --build
```

### Backup database (handled by Neon automatically)

### Monitor SSL certificate renewal:
```bash
# Test renewal
certbot renew --dry-run

# Certificates auto-renew every 90 days
```

## Application URLs

- **Main Application**: https://selllio.com
- **Health Check**: https://selllio.com/api/health
- **Stripe Webhook**: https://selllio.com/api/stripe-webhook

## Server Info

- **IP**: 145.223.121.234
- **Hostname**: srv631994.hstgr.cloud
- **OS**: AlmaLinux
- **Application Path**: /opt/selllio
- **Docker Compose File**: /opt/selllio/docker-compose.production.yml

---

**Need Help?**
- Check logs: `docker-compose -f /opt/selllio/docker-compose.production.yml logs`
- Restart: `docker-compose -f /opt/selllio/docker-compose.production.yml restart`
- GitHub Issues: https://github.com/hatchettc84/selllio/issues
