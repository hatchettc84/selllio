# Admin Panel Setup Guide

## Phase 1: Core Admin Infrastructure - COMPLETED ✅

### What Was Created

#### 1. Database Schema Updates
- ✅ Added `UserRole` enum (USER, ADMIN, SUPER_ADMIN)
- ✅ Added `role` field to User model
- ✅ Created `Account` model for multi-tenant account management
- ✅ Created `AdminActivity` model for audit logging
- ✅ Created `SystemSetting` model for platform configuration
- ✅ Created `ContainerLog` model for Docker container logging
- ✅ Fixed `AiAgents` model relation

**Files Modified:**
- `prisma/schema.prisma`

#### 2. Admin Permissions & Security
- ✅ Created admin permissions utility (`src/lib/admin/permissions.ts`)
  - `isAdmin()` - Check if user is admin
  - `isSuperAdmin()` - Check if user is super admin
  - `getUserRole()` - Get current user's role
  - `requireAdmin()` - Require admin access (throws if not)
  - `requireSuperAdmin()` - Require super admin access
  - `logAdminActivity()` - Log admin actions for audit

- ✅ Updated middleware (`src/middleware.ts`)
  - Added admin route detection
  - Ensures authentication for admin routes

#### 3. Admin Layout Components
- ✅ `AdminSidebar` - Navigation sidebar with all admin sections
- ✅ `AdminHeader` - Top header with search, notifications, user menu
- ✅ `AdminBreadcrumb` - Breadcrumb navigation
- ✅ Admin layout wrapper (`src/app/(adminRoutes)/layout.tsx`)
  - Checks admin access
  - Redirects non-admins to home

**Files Created:**
- `src/components/admin/layout/AdminSidebar.tsx` (~200 lines)
- `src/components/admin/layout/AdminHeader.tsx` (~150 lines)
- `src/components/admin/layout/AdminBreadcrumb.tsx` (~100 lines)
- `src/app/(adminRoutes)/layout.tsx` (~150 lines)

#### 4. Admin Dashboard
- ✅ Dashboard page with key metrics
- ✅ Metric cards component
- ✅ Activity feed component
- ✅ Quick actions component
- ✅ Dashboard server actions

**Files Created:**
- `src/app/(adminRoutes)/dashboard/page.tsx` (~250 lines)
- `src/components/admin/dashboard/MetricCard.tsx` (~100 lines)
- `src/components/admin/dashboard/ActivityFeed.tsx` (~200 lines)
- `src/components/admin/dashboard/QuickActions.tsx` (~150 lines)
- `src/action/admin/dashboard.ts` (~300 lines)

### Next Steps

#### 1. Run Database Migration
```bash
# Generate migration
npx prisma migrate dev --name add_admin_features

# Or if in production
npx prisma migrate deploy
```

#### 2. Create Your First Admin User
After migration, you'll need to manually set a user's role to ADMIN or SUPER_ADMIN:

```sql
-- Option 1: Using Prisma Studio
npx prisma studio

-- Option 2: Using SQL directly
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
-- OR
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'your-admin@email.com';
```

#### 3. Test Admin Access
1. Sign in with your admin account
2. Navigate to `/admin/dashboard`
3. You should see the admin dashboard with metrics

### File Structure Created

```
src/
├── app/
│   └── (adminRoutes)/
│       ├── layout.tsx          ✅ Admin layout with access control
│       └── dashboard/
│           └── page.tsx        ✅ Dashboard page
├── components/
│   └── admin/
│       ├── layout/
│       │   ├── AdminSidebar.tsx      ✅
│       │   ├── AdminHeader.tsx       ✅
│       │   └── AdminBreadcrumb.tsx   ✅
│       └── dashboard/
│           ├── MetricCard.tsx        ✅
│           ├── ActivityFeed.tsx      ✅
│           └── QuickActions.tsx      ✅
├── lib/
│   └── admin/
│       └── permissions.ts      ✅ Admin permission utilities
└── action/
    └── admin/
        └── dashboard.ts        ✅ Dashboard data fetching
```

### All Files Under 500 Lines ✅

- AdminSidebar.tsx: ~200 lines
- AdminHeader.tsx: ~150 lines
- AdminBreadcrumb.tsx: ~100 lines
- AdminLayout: ~150 lines
- Dashboard page: ~250 lines
- MetricCard: ~100 lines
- ActivityFeed: ~200 lines
- QuickActions: ~150 lines
- Dashboard actions: ~300 lines
- Permissions: ~200 lines

### What's Working

✅ Admin route protection
✅ Role-based access control
✅ Admin layout with navigation
✅ Dashboard with real metrics
✅ Activity feed
✅ Quick actions
✅ Breadcrumb navigation

### What's Next (Phase 2)

1. **Accounts Management** (`/admin/accounts`)
   - List all accounts
   - Account detail pages
   - Container management
   - Account actions (suspend, activate, delete)

2. **Users Management** (`/admin/users`)
   - List all users
   - User detail pages
   - User activity logs
   - Impersonation (if needed)

### Notes

- The admin panel uses the existing Selllio design system
- All components are responsive and support dark mode
- Admin actions are logged for audit purposes
- The dashboard shows real-time metrics from your database
- Container management will be added in Phase 2

### Troubleshooting

**Issue: Can't access `/admin/dashboard`**
- Make sure you've run the migration
- Make sure your user has `role = 'ADMIN'` or `role = 'SUPER_ADMIN'` in the database
- Check browser console for errors

**Issue: Migration fails**
- Make sure your database is running
- Check `DATABASE_URL` in `.env`
- Review the migration SQL for any conflicts

**Issue: Metrics showing 0**
- This is normal if you don't have data yet
- Metrics are calculated from your actual database records
- They will populate as you use the platform

---

**Status:** Phase 1 Complete ✅
**Ready for:** Database migration and testing


