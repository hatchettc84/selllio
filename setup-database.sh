#!/bin/bash

# Database Setup Script for Selllio Admin Panel
# This script creates the database user and database if they don't exist

set -e

echo "🔧 Setting up database for Selllio..."

# Get current username (usually your macOS username)
CURRENT_USER=$(whoami)
DB_USER="saas_operator"
DB_PASSWORD="change_me_at_runtime"
DB_NAME="spotlight_multi_tenant"

echo "📋 Configuration:"
echo "   User: $DB_USER"
echo "   Database: $DB_NAME"
echo "   Port: 5432"
echo ""

# Check if user exists
USER_EXISTS=$(psql -h localhost -p 5432 -U $CURRENT_USER -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || echo "0")

if [ "$USER_EXISTS" != "1" ]; then
  echo "👤 Creating database user: $DB_USER"
  psql -h localhost -p 5432 -U $CURRENT_USER -d postgres <<EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
ALTER USER $DB_USER CREATEDB;
EOF
  echo "✅ User created"
else
  echo "✅ User already exists"
fi

# Check if database exists
DB_EXISTS=$(psql -h localhost -p 5432 -U $CURRENT_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
  echo "📦 Creating database: $DB_NAME"
  psql -h localhost -p 5432 -U $CURRENT_USER -d postgres <<EOF
CREATE DATABASE $DB_NAME OWNER $DB_USER;
EOF
  echo "✅ Database created"
else
  echo "✅ Database already exists"
fi

# Grant privileges
echo "🔐 Granting privileges..."
psql -h localhost -p 5432 -U $CURRENT_USER -d postgres <<EOF
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📝 Your DATABASE_URL should be:"
echo "   postgres://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: npx prisma migrate dev --name add_admin_features"
echo "   2. Create admin user: UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'your-email@example.com';"


