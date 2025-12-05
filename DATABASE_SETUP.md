# Database Setup Guide

## Current Issue
Your migration is trying to connect to PostgreSQL on port **5434**, but your local PostgreSQL is likely running on the default port **5432**.

## Quick Fix Options

### Option 1: Check Your DATABASE_URL (Recommended)
Your `.env` file should have a `DATABASE_URL`. Check what port it's using:

```bash
# Check your .env file
cat .env | grep DATABASE_URL
```

**Common formats:**
- Default PostgreSQL: `postgresql://user:password@localhost:5432/database`
- Custom port: `postgresql://user:password@localhost:5434/database`

### Option 2: Update DATABASE_URL to Port 5432
If your PostgreSQL is running on port 5432 (default), update your `.env`:

```bash
# Edit .env file
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/spotlight_multi_tenant"
```

### Option 3: Start PostgreSQL on Port 5434
If you specifically need port 5434, you can:

**Using Homebrew (macOS):**
```bash
# Check current PostgreSQL version
brew services list | grep postgresql

# Start PostgreSQL (if not running)
brew services start postgresql@14

# To run on port 5434, you'd need to modify postgresql.conf
# Location: /opt/homebrew/var/postgresql@14/postgresql.conf
# Change: port = 5432 to port = 5434
# Then restart: brew services restart postgresql@14
```

**Using Docker:**
```bash
# Run PostgreSQL on port 5434
docker run --name selllio-postgres \
  -e POSTGRES_USER=your_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=spotlight_multi_tenant \
  -p 5434:5432 \
  -d postgres:15

# Then update DATABASE_URL to use localhost:5434
```

## Verify Database Connection

### Test Connection
```bash
# Test with psql (if installed)
psql -h localhost -p 5432 -U your_user -d spotlight_multi_tenant

# Or test with Prisma
npx prisma db pull
```

### Check Database Exists
```bash
# List databases
psql -h localhost -p 5432 -U your_user -l
```

## Create Database (If Needed)

If the database `spotlight_multi_tenant` doesn't exist:

```bash
# Connect to PostgreSQL
psql -h localhost -p 5432 -U your_user postgres

# Create database
CREATE DATABASE spotlight_multi_tenant;

# Exit
\q
```

## Run Migration After Fix

Once your database is accessible:

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev --name add_admin_features

# Verify schema
npx prisma studio
```

## Common Issues

### Issue: "Can't reach database server"
- **Solution**: Make sure PostgreSQL is running
  ```bash
  # Check status (macOS with Homebrew)
  brew services list | grep postgresql
  
  # Start if stopped
  brew services start postgresql@14
  ```

### Issue: "Authentication failed"
- **Solution**: Check your username and password in DATABASE_URL
- Make sure the user has permissions to create databases/tables

### Issue: "Database does not exist"
- **Solution**: Create the database first (see above)

### Issue: "Port already in use"
- **Solution**: Either use a different port or stop the conflicting service

## Recommended Setup for Development

For local development, use the default PostgreSQL port (5432):

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/spotlight_multi_tenant"
```

Then run:
```bash
npx prisma migrate dev --name add_admin_features
```

## Next Steps After Migration

1. **Create your first admin user:**
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

2. **Access admin panel:**
   - Navigate to `/admin/dashboard`
   - You should see the admin interface


