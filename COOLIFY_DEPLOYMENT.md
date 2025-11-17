# Coolify Deployment Guide for Selllio

Complete guide for deploying the Selllio multi-tenant webinar SaaS platform on Coolify.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Database Setup](#database-setup)
- [Coolify Configuration](#coolify-configuration)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- ✅ Coolify instance running (v4+)
- ✅ GitHub repository access
- ✅ Domain name (optional but recommended)
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
- Optimal for self-hosted deployments on Coolify

### Tech Stack
- **Frontend**: Next.js 15 with App Router
- **Backend**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL (via Prisma)
- **Auth**: Clerk
- **Video**: Stream.io
- **AI**: OpenAI (GPT-4o, TTS)
- **Voice**: VAPI

## Database Setup

### Option 1: Coolify Built-in PostgreSQL (Recommended)

1. In Coolify dashboard, create a new PostgreSQL database
2. Note the connection string provided
3. Format: `postgresql://user:password@host:5432/database`

### Option 2: External Managed Database

Use one of these providers:
- **Neon** (PostgreSQL, generous free tier)
- **Supabase** (PostgreSQL + extras)
- **Railway** (Easy setup)

Get the connection string from your provider.

### Database Migrations

After deployment, run migrations:
```bash
# Coolify will run this automatically if configured
npx prisma migrate deploy
```

## Coolify Configuration

### 1. Create New Service

1. Go to Coolify Dashboard
2. Click **"New Resource"** → **"Application"**
3. Select **"Public Repository"** or connect your GitHub
4. Enter repository URL: `https://github.com/hatchettc84/selllio.git`
5. Branch: `main`

### 2. Build Configuration

Coolify will auto-detect Next.js. Verify these settings:

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: `3000`
- **Install Command**: `npm install`

### 3. Environment Variables

In Coolify, go to **Environment Variables** tab and add all variables from `.env.example`:

#### Required Variables

```bash
# Environment
ENVIRONMENT=production

# Database (from step 1)
DATABASE_URL=postgresql://user:password@host:5432/database

# Base URL (your domain)
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

#### Getting API Keys

**Clerk:**
1. Go to https://clerk.com
2. Create new application
3. Copy publishable and secret keys
4. Set redirect URLs to match your domain

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. **Important**: Set usage limits to prevent unexpected charges

**Stripe:**
1. Go to https://dashboard.stripe.com/apikeys
2. Get API keys (use test keys first)
3. Create webhook endpoint: `https://yourdomain.com/api/stripe-webhook`
4. Create a subscription price in Products section

**Stream.io:**
1. Go to https://getstream.io
2. Create new app
3. Get API key and secret from dashboard

**VAPI:**
1. Go to https://vapi.ai
2. Sign up and get API keys
3. Note organization ID

**Resend:**
1. Go to https://resend.com
2. Create API key
3. Verify domain for sending emails

### 4. Docker Configuration

Coolify uses the provided `Dockerfile`. No changes needed.

The Dockerfile already includes:
- Multi-stage build for optimization
- Prisma client generation
- Production optimizations

### 5. Persistent Storage (Optional)

If using file uploads, add persistent storage:
1. In Coolify, go to **Storages** tab
2. Add volume: `/app/public/uploads`
3. This persists uploaded files across deployments

## Post-Deployment

### 1. Run Database Migrations

Coolify runs this automatically, but verify:
```bash
# In Coolify console or SSH
npx prisma migrate deploy
npx prisma db seed # if you have seed data
```

### 2. Configure Webhooks

**Stripe Webhook:**
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` env var
5. Redeploy in Coolify

**Clerk Webhook (optional):**
1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/clerk-webhook`
3. Select user events

### 3. Test Critical Features

After deployment, test:
- ✅ User registration/login (Clerk)
- ✅ Create webinar
- ✅ Upload presentation document
- ✅ Generate presentation (OpenAI)
- ✅ Enable AI Presenter
- ✅ Start live webinar (Stream.io)
- ✅ AI voice call (VAPI)
- ✅ Payment flow (Stripe)

### 4. Domain Configuration

**In Coolify:**
1. Go to **Domains** tab
2. Add your domain
3. Enable SSL (automatic with Let's Encrypt)

**In DNS:**
1. Add A record pointing to Coolify server IP
2. Wait for propagation (5-60 minutes)

**Update Environment Variables:**
```bash
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Monitoring & Logs

### View Logs in Coolify

1. Go to your service
2. Click **"Logs"** tab
3. Monitor for errors

### Key Metrics to Watch

- **Database connections**: Monitor PostgreSQL
- **API response times**: Stream.io, OpenAI
- **Error rates**: Check logs for API failures
- **Storage usage**: If using file uploads

## Scaling Considerations

### Current Setup (Single Server)
- Good for: 1-1000 users
- Database: Single PostgreSQL instance
- Limitations: Single point of failure

### To Scale Beyond:

**Horizontal Scaling:**
1. Add load balancer
2. Deploy multiple app instances in Coolify
3. Shared PostgreSQL database
4. Use external file storage (S3, Cloudflare R2)

**Database Scaling:**
1. Enable connection pooling (PgBouncer)
2. Add read replicas for heavy read workloads
3. Consider managed database (Neon, Supabase)

## Troubleshooting

### Build Fails

**Error**: `npm install fails`
```bash
# Solution: Check package.json, try:
npm clean cache --force
```

**Error**: `Prisma client generation fails`
```bash
# Solution: Verify DATABASE_URL is set
npx prisma generate
```

### Runtime Errors

**Error**: `Missing OpenAI API key`
- Check environment variable is set in Coolify
- Verify key format: `sk-proj-...`

**Error**: `Database connection failed`
- Verify DATABASE_URL format
- Check database is running
- Ensure Coolify can reach database

**Error**: `Clerk authentication fails`
- Check Clerk dashboard allowed origins
- Verify API keys match environment
- Check redirect URLs in Clerk settings

### Performance Issues

**Slow page loads:**
1. Check database query performance
2. Enable Next.js caching
3. Add CDN for static assets

**High memory usage:**
1. Check for memory leaks in logs
2. Increase container memory in Coolify
3. Optimize database queries

## Backup Strategy

### Database Backups

**In Coolify:**
1. Go to PostgreSQL service
2. Enable automatic backups
3. Set retention policy

**Manual Backup:**
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Application Data

- Uploaded files: Backup `/app/public/uploads`
- Configuration: Keep `.env` backup secure locally
- Code: Already in GitHub

## Security Checklist

- ✅ Use HTTPS (SSL enabled in Coolify)
- ✅ Environment variables set (not in code)
- ✅ Database uses strong password
- ✅ Webhook signatures verified (Stripe)
- ✅ CORS configured correctly
- ✅ Rate limiting enabled (if needed)
- ✅ Regular backups automated
- ✅ Monitor for suspicious activity

## Cost Optimization

### Estimated Monthly Costs

**Infrastructure:**
- Coolify server (self-hosted): $0 (your server)
- Database (built-in): $0

**Services (variable):**
- OpenAI: ~$10-50 (depends on usage)
- Clerk: Free tier (up to 10k MAU)
- Stripe: 2.9% + $0.30 per transaction
- Stream.io: ~$50-100 (free tier available)
- VAPI: Pay per minute
- Resend: Free tier (100 emails/day)

**Total**: ~$60-200/month depending on usage

### Cost Saving Tips

1. **OpenAI**: Set usage limits, use standard TTS
2. **Stream.io**: Use free tier during testing
3. **VAPI**: Optimize call duration
4. **Resend**: Use transactional emails only
5. **Database**: Use connection pooling

## Support & Updates

### Updating the Application

1. Push changes to GitHub
2. Coolify auto-deploys (if configured)
3. Or manually trigger deployment in Coolify

### Getting Help

- GitHub Issues: https://github.com/hatchettc84/selllio/issues
- Coolify Docs: https://coolify.io/docs
- Next.js Docs: https://nextjs.org/docs

---

## Quick Start Checklist

- [ ] Coolify instance ready
- [ ] GitHub repository connected
- [ ] Database created (PostgreSQL)
- [ ] All API keys obtained
- [ ] Environment variables configured
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] Database migrations run
- [ ] Webhooks configured
- [ ] Test deployment successful
- [ ] Backups configured
- [ ] Monitoring enabled

**You're ready to launch! 🚀**
