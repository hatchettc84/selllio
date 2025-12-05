# Selllio Admin Panel Design

## Overview
Multi-tenant admin panel for managing accounts, users, AI resources, webinars, billing, and system-wide operations.

## Architecture Considerations

### Docker Containerization Strategy
- **Current**: Single database with row-level isolation
- **Future**: Docker containers per account (isolated environments)
- **Admin Panel**: Must work with both architectures
- **Account Management**: Support for container lifecycle (create, start, stop, delete containers)
- **Data Access**: Admin panel queries across all accounts/containers via unified API

### File Size Constraints
- **Maximum**: 500 lines per file
- **Strategy**: Modular components, separate concerns, extract utilities
- **Component Pattern**: Small, focused components (<200 lines each)
- **Page Pattern**: Pages orchestrate components (<300 lines)
- **Action Pattern**: Server actions split by domain (<300 lines each)

## Route Structure

```
/admin
├── /dashboard              # Admin overview & key metrics
├── /accounts               # Tenant/Account management
│   ├── /[accountId]        # Individual account details
│   ├── /[accountId]/edit   # Edit account settings
│   └── /[accountId]/container # Container management (Docker)
├── /users                  # User management
│   ├── /[userId]           # Individual user details
│   └── /[userId]/activity  # User activity log
├── /ai                     # AI resource management
│   ├── /agents             # AI agents overview
│   ├── /usage              # AI usage analytics & costs
│   ├── /presentations      # Presentation processing status
│   └── /settings           # AI configuration
├── /webinars               # System-wide webinar management
│   ├── /[webinarId]        # Webinar details & moderation
│   └── /analytics          # Webinar analytics dashboard
├── /billing                # Revenue & billing management
│   ├── /overview           # Revenue dashboard
│   ├── /subscriptions      # Subscription management
│   ├── /stripe-connect     # Stripe Connect accounts
│   └── /transactions       # Transaction history
├── /content                # Content moderation
│   ├── /presentations      # Review presentations
│   └── /webinars           # Review webinars
├── /settings               # System settings
│   ├── /general           # General platform settings
│   ├── /features          # Feature flags
│   ├── /integrations      # Third-party integrations
│   └── /security          # Security settings
└── /support                # Support tools
    ├── /tickets           # Support tickets
    └── /logs              # System logs
```

## File Structure (Under 500 Lines Each)

```
src/
├── app/
│   └── (adminRoutes)/          # Admin route group
│       ├── layout.tsx          # Admin layout (~150 lines)
│       ├── dashboard/
│       │   └── page.tsx        # Dashboard page (~250 lines)
│       ├── accounts/
│       │   ├── page.tsx        # Accounts list (~200 lines)
│       │   ├── [accountId]/
│       │   │   ├── page.tsx    # Account detail (~250 lines)
│       │   │   ├── edit/
│       │   │   │   └── page.tsx # Edit form (~200 lines)
│       │   │   └── container/
│       │   │       └── page.tsx # Container mgmt (~200 lines)
│       ├── users/
│       │   ├── page.tsx        # Users list (~200 lines)
│       │   └── [userId]/
│       │       ├── page.tsx    # User detail (~250 lines)
│       │       └── activity/
│       │           └── page.tsx # Activity log (~200 lines)
│       ├── ai/
│       │   ├── agents/
│       │   │   └── page.tsx    # AI agents (~250 lines)
│       │   ├── usage/
│       │   │   └── page.tsx    # Usage analytics (~300 lines)
│       │   ├── presentations/
│       │   │   └── page.tsx    # Presentations (~250 lines)
│       │   └── settings/
│       │       └── page.tsx    # AI settings (~200 lines)
│       ├── webinars/
│       │   ├── page.tsx        # Webinars list (~200 lines)
│       │   ├── [webinarId]/
│       │   │   └── page.tsx    # Webinar detail (~250 lines)
│       │   └── analytics/
│       │       └── page.tsx    # Analytics (~300 lines)
│       ├── billing/
│       │   ├── overview/
│       │   │   └── page.tsx    # Revenue overview (~300 lines)
│       │   ├── subscriptions/
│       │   │   └── page.tsx    # Subscriptions (~250 lines)
│       │   ├── stripe-connect/
│       │   │   └── page.tsx    # Stripe Connect (~250 lines)
│       │   └── transactions/
│       │       └── page.tsx    # Transactions (~250 lines)
│       ├── content/
│       │   ├── presentations/
│       │   │   └── page.tsx    # Content moderation (~250 lines)
│       │   └── webinars/
│       │       └── page.tsx    # Webinar moderation (~250 lines)
│       ├── settings/
│       │   ├── general/
│       │   │   └── page.tsx    # General settings (~200 lines)
│       │   ├── features/
│       │   │   └── page.tsx    # Feature flags (~250 lines)
│       │   ├── integrations/
│       │   │   └── page.tsx    # Integrations (~250 lines)
│       │   └── security/
│       │       └── page.tsx    # Security (~200 lines)
│       └── support/
│           ├── tickets/
│           │   └── page.tsx    # Support tickets (~300 lines)
│           └── logs/
│               └── page.tsx    # System logs (~300 lines)
│
├── components/
│   └── admin/
│       ├── layout/
│       │   ├── AdminSidebar.tsx      # Sidebar nav (~200 lines)
│       │   ├── AdminHeader.tsx       # Header (~150 lines)
│       │   └── AdminBreadcrumb.tsx   # Breadcrumb (~100 lines)
│       ├── dashboard/
│       │   ├── MetricCard.tsx        # Metric card (~100 lines)
│       │   ├── ChartCard.tsx         # Chart wrapper (~150 lines)
│       │   ├── ActivityFeed.tsx      # Activity list (~200 lines)
│       │   └── QuickActions.tsx      # Quick actions (~150 lines)
│       ├── accounts/
│       │   ├── AccountsTable.tsx     # Table component (~250 lines)
│       │   ├── AccountFilters.tsx   # Filters (~150 lines)
│       │   ├── AccountDetailCard.tsx # Detail card (~200 lines)
│       │   ├── ContainerStatus.tsx  # Docker status (~150 lines)
│       │   └── AccountActions.tsx   # Action buttons (~150 lines)
│       ├── users/
│       │   ├── UsersTable.tsx        # Table (~250 lines)
│       │   ├── UserFilters.tsx       # Filters (~150 lines)
│       │   ├── UserDetailCard.tsx    # Detail card (~200 lines)
│       │   └── UserActivityLog.tsx   # Activity log (~200 lines)
│       ├── ai/
│       │   ├── UsageChart.tsx        # Usage charts (~200 lines)
│       │   ├── CostBreakdown.tsx     # Cost display (~200 lines)
│       │   ├── AgentList.tsx        # Agent list (~200 lines)
│       │   └── PresentationQueue.tsx # Queue table (~250 lines)
│       ├── webinars/
│       │   ├── WebinarsTable.tsx     # Table (~250 lines)
│       │   ├── WebinarFilters.tsx    # Filters (~150 lines)
│       │   ├── AnalyticsCharts.tsx    # Charts (~300 lines)
│       │   └── ModerationActions.tsx # Actions (~150 lines)
│       ├── billing/
│       │   ├── RevenueChart.tsx      # Revenue chart (~200 lines)
│       │   ├── SubscriptionList.tsx # Sub list (~250 lines)
│       │   ├── StripeConnectList.tsx # Connect list (~250 lines)
│       │   └── TransactionTable.tsx # Transactions (~250 lines)
│       ├── content/
│       │   ├── ModerationQueue.tsx   # Queue (~250 lines)
│       │   └── ContentReview.tsx     # Review panel (~200 lines)
│       ├── settings/
│       │   ├── FeatureFlagToggle.tsx # Toggle (~150 lines)
│       │   ├── IntegrationCard.tsx  # Integration card (~200 lines)
│       │   └── SecuritySettings.tsx  # Security form (~200 lines)
│       └── shared/
│           ├── DataTable.tsx         # Reusable table (~300 lines)
│           ├── FilterBar.tsx         # Filter component (~200 lines)
│           ├── Pagination.tsx        # Pagination (~150 lines)
│           ├── StatusBadge.tsx       # Status badge (~100 lines)
│           └── ActionMenu.tsx        # Action dropdown (~150 lines)
│
├── action/
│   └── admin/
│       ├── accounts.ts               # Account actions (~300 lines)
│       ├── users.ts                   # User actions (~300 lines)
│       ├── ai.ts                      # AI actions (~300 lines)
│       ├── webinars.ts                # Webinar actions (~300 lines)
│       ├── billing.ts                 # Billing actions (~300 lines)
│       ├── content.ts                 # Content actions (~250 lines)
│       ├── settings.ts                # Settings actions (~250 lines)
│       ├── dashboard.ts               # Dashboard data (~300 lines)
│       └── containers.ts              # Docker container actions (~300 lines)
│
├── lib/
│   └── admin/
│       ├── permissions.ts             # Permission checks (~200 lines)
│       ├── analytics.ts               # Analytics utils (~300 lines)
│       ├── docker.ts                  # Docker client (~300 lines)
│       └── validators.ts              # Form validators (~200 lines)
│
└── api/
    └── admin/
        ├── dashboard/
        │   └── route.ts               # Dashboard API (~200 lines)
        ├── accounts/
        │   ├── route.ts               # Accounts list (~200 lines)
        │   └── [id]/
        │       └── route.ts           # Account CRUD (~300 lines)
        ├── users/
        │   ├── route.ts               # Users list (~200 lines)
        │   └── [id]/
        │       └── route.ts           # User CRUD (~300 lines)
        ├── ai/
        │   ├── usage/
        │   │   └── route.ts           # Usage stats (~200 lines)
        │   └── costs/
        │       └── route.ts           # Cost data (~200 lines)
        ├── webinars/
        │   ├── route.ts               # Webinars list (~200 lines)
        │   ├── [id]/
        │   │   └── route.ts           # Webinar details (~250 lines)
        │   └── analytics/
        │       └── route.ts           # Analytics (~250 lines)
        ├── billing/
        │   ├── revenue/
        │   │   └── route.ts           # Revenue data (~200 lines)
        │   └── subscriptions/
        │       └── route.ts           # Subscriptions (~200 lines)
        ├── containers/
        │   ├── route.ts               # Container list (~200 lines)
        │   └── [id]/
        │       └── route.ts           # Container ops (~300 lines)
        └── settings/
            └── route.ts               # Settings CRUD (~250 lines)
```

## Page Designs

### 1. Admin Dashboard (`/admin/dashboard`)
**Purpose:** Overview of platform health and key metrics

**Components:**
- **Key Metrics Cards:**
  - Total Users (with growth %)
  - Active Accounts (subscription status)
  - Total Webinars (live, scheduled, ended)
  - Revenue (MTD, YTD)
  - AI Usage (tokens, costs)
  - Conversion Rate

- **Charts:**
  - User Growth (line chart)
  - Revenue Trends (area chart)
  - Webinar Activity (bar chart)
  - AI Usage by Model (pie chart)

- **Recent Activity Feed:**
  - New user registrations
  - Webinar creations
  - High-value conversions
  - System alerts

- **Quick Actions:**
  - Create test account
  - View system health
  - Access logs
  - Emergency actions

---

### 2. Accounts Management (`/admin/accounts`)
**Purpose:** Manage all tenant accounts

**Features:**
- **Accounts Table:**
  - Account ID, Name, Email
  - Subscription Status
  - Stripe Connect Status
  - Webinar Count
  - User Count
  - Created Date
  - Last Activity
  - Actions (View, Edit, Suspend, Delete)

- **Filters:**
  - Subscription status
  - Account age
  - Activity level
  - Search by name/email

- **Bulk Actions:**
  - Suspend multiple accounts
  - Export account data
  - Send bulk emails

**Account Detail Page (`/admin/accounts/[accountId]`):**
- Account overview
- Subscription details
- Billing history
- Webinar list
- User list
- Activity timeline
- Support tickets
- Account actions (suspend, delete, reset)

---

### 3. Users Management (`/admin/users`)
**Purpose:** Manage all platform users

**Features:**
- **Users Table:**
  - User ID, Name, Email
  - Account/Owner
  - Role (if implemented)
  - Subscription Status
  - Webinar Count
  - AI Agents Count
  - Last Login
  - Created Date
  - Status (Active, Suspended, Deleted)
  - Actions (View, Edit, Impersonate, Suspend)

- **Filters:**
  - Account
  - Subscription status
  - Activity status
  - Search

- **User Detail Page (`/admin/users/[userId]`):**
  - Profile information
  - Account association
  - Webinar history
  - AI agents
  - Attendance records
  - Billing information
  - Activity log
  - Actions (impersonate, suspend, delete)

---

### 4. AI Management (`/admin/ai`)
**Purpose:** Monitor and manage AI resources

#### 4a. AI Agents (`/admin/ai/agents`)
- List all AI agents across accounts
- Filter by account, model, provider
- View agent configurations
- Usage statistics per agent
- Cost tracking

#### 4b. AI Usage (`/admin/ai/usage`)
**Analytics Dashboard:**
- **Cost Breakdown:**
  - Total AI costs (MTD, YTD)
  - Cost by model (GPT-4o, Claude, TTS)
  - Cost by account
  - Cost trends (line chart)

- **Usage Metrics:**
  - Total tokens used
  - API calls count
  - Presentations processed
  - TTS audio generated (hours)
  - Average cost per webinar

- **Top Users:**
  - Highest AI usage accounts
  - Cost per account ranking

#### 4c. Presentations (`/admin/ai/presentations`)
- List all presentations
- Processing status
- Error logs
- Cost per presentation
- Retry failed jobs
- Bulk operations

#### 4d. AI Settings (`/admin/ai/settings`)
- Model availability
- Rate limits
- Cost thresholds
- Feature flags for AI features
- API key management

---

### 5. Webinars Management (`/admin/webinars`)
**Purpose:** System-wide webinar oversight

**Features:**
- **Webinars Table:**
  - Webinar ID, Title, Presenter
  - Status (Scheduled, Live, Ended)
  - Start/End Time
  - Attendee Count
  - Conversion Count
  - Revenue Generated
  - Actions (View, Moderate, End)

- **Filters:**
  - Status
  - Date range
  - Presenter
  - Search

- **Webinar Detail (`/admin/webinars/[webinarId]`):**
  - Full webinar details
  - Attendee list
  - Attendance analytics
  - Chat logs (if needed for moderation)
  - Recording access
  - Moderation actions

#### Webinar Analytics (`/admin/webinars/analytics`)
- System-wide metrics
- Popular webinars
- Conversion rates
- Average attendance
- Revenue by webinar
- Time-based trends

---

### 6. Billing Management (`/admin/billing`)
**Purpose:** Revenue and payment oversight

#### 6a. Revenue Overview (`/admin/billing/overview`)
- **Revenue Metrics:**
  - Total Revenue (MTD, YTD, All-time)
  - Revenue by account
  - Revenue trends (charts)
  - Average revenue per account

- **Revenue Sources:**
  - Subscription revenue
  - Webinar sales
  - Platform fees

#### 6b. Subscriptions (`/admin/billing/subscriptions`)
- List all subscriptions
- Active vs. cancelled
- Subscription tiers
- Renewal dates
- Churn analysis

#### 6c. Stripe Connect (`/admin/billing/stripe-connect`)
- Connected accounts
- Payout status
- Account verification status
- Dispute management
- Fee structure

#### 6d. Transactions (`/admin/billing/transactions`)
- All transactions
- Filter by account, date, type
- Refund management
- Export capabilities

---

### 7. Content Moderation (`/admin/content`)
**Purpose:** Review and moderate user-generated content

#### 7a. Presentations (`/admin/content/presentations`)
- Queue of presentations to review
- Flagged content
- Approval workflow
- Bulk approve/reject

#### 7b. Webinars (`/admin/content/webinars`)
- Review webinar content
- Check for policy violations
- Approve/reject webinars
- Edit webinar details if needed

---

### 8. System Settings (`/admin/settings`)
**Purpose:** Platform configuration

#### 8a. General Settings (`/admin/settings/general`)
- Platform name, logo
- Default configurations
- Email templates
- Notification settings

#### 8b. Feature Flags (`/admin/settings/features`)
- Toggle features on/off
- Beta features
- A/B testing flags
- Feature rollout percentages

#### 8c. Integrations (`/admin/settings/integrations`)
- API keys management
- Third-party service status
- Webhook configurations
- Service health monitoring

#### 8d. Security (`/admin/settings/security`)
- Rate limiting
- IP whitelisting
- Security policies
- Audit log settings

---

### 9. Support Tools (`/admin/support`)
**Purpose:** Customer support and system monitoring

#### 9a. Support Tickets (`/admin/support/tickets`)
- Ticket management system
- Assign tickets
- Response tracking
- Ticket analytics

#### 9b. System Logs (`/admin/support/logs`)
- Application logs
- Error logs
- API logs
- Search and filter
- Export logs

---

## Database Schema Updates Needed

### Add Admin Role Support
```prisma
enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}

model User {
  // ... existing fields
  role UserRole @default(USER)
  
  @@index([role])
}
```

### Add Account/Container Management
```prisma
model Account {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String   @db.VarChar(255)
  ownerId         String   @db.Uuid
  owner           User     @relation("AccountOwner", fields: [ownerId], references: [id])
  
  // Container/Docker info
  containerId     String?  @db.VarChar(255)  // Docker container ID
  containerStatus String?  @db.VarChar(50)   // running, stopped, paused
  containerImage  String?  @db.VarChar(255)  // Docker image
  containerPort   Int?                        // Assigned port
  
  // Account status
  status          String   @default("active") @db.VarChar(50)
  subscriptionTier String? @db.VarChar(50)
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
  
  users           User[]   @relation("AccountUsers")
  
  @@index([ownerId])
  @@index([containerId])
  @@index([status])
}

// Update User model
model User {
  // ... existing fields
  role UserRole @default(USER)
  accountId String? @db.Uuid
  account   Account? @relation("AccountUsers", fields: [accountId], references: [id])
  
  @@index([role])
  @@index([accountId])
}
```

### Add Admin Activity Logging
```prisma
model AdminActivity {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  adminId   String   @db.Uuid
  admin     User     @relation(fields: [adminId], references: [id])
  action    String   @db.VarChar(100)
  resource  String   @db.VarChar(100)
  resourceId String? @db.Uuid
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  @@index([adminId])
  @@index([createdAt])
}
```

### Add System Settings
```prisma
model SystemSetting {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key       String   @unique @db.VarChar(100)
  value     Json
  updatedBy String?  @db.Uuid
  updatedAt DateTime @default(now()) @updatedAt
}
```

### Add Container Logs
```prisma
model ContainerLog {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  accountId   String   @db.Uuid
  account     Account  @relation(fields: [accountId], references: [id])
  containerId String   @db.VarChar(255)
  level       String   @db.VarChar(20)  // info, warning, error
  message     String   @db.Text
  metadata    Json?
  createdAt   DateTime @default(now())
  
  @@index([accountId])
  @@index([containerId])
  @@index([createdAt])
}
```

---

## Security & Access Control

### Middleware Protection
- All `/admin/*` routes require admin role
- Check user role in middleware
- Log all admin actions
- Rate limiting for admin actions

### Permission Levels
- **USER**: Regular platform user
- **ADMIN**: Can manage accounts, users, content
- **SUPER_ADMIN**: Full system access including settings

---

## Implementation Priority

### Phase 1: Core Admin Infrastructure (~2-3 days)
**Files to create:**
- `src/app/(adminRoutes)/layout.tsx` (~150 lines)
- `src/components/admin/layout/AdminSidebar.tsx` (~200 lines)
- `src/components/admin/layout/AdminHeader.tsx` (~150 lines)
- `src/middleware.ts` (update for admin routes)
- `src/lib/admin/permissions.ts` (~200 lines)
- `src/action/admin/dashboard.ts` (~300 lines)
- `src/app/(adminRoutes)/dashboard/page.tsx` (~250 lines)
- `src/components/admin/dashboard/` (4 components, ~600 lines total)

**Database:**
- Migration: Add `role` to User model
- Migration: Add `Account` model
- Migration: Add `AdminActivity` model

### Phase 2: Account & User Management (~3-4 days)
**Files to create:**
- `src/app/(adminRoutes)/accounts/page.tsx` (~200 lines)
- `src/app/(adminRoutes)/accounts/[accountId]/page.tsx` (~250 lines)
- `src/app/(adminRoutes)/accounts/[accountId]/container/page.tsx` (~200 lines)
- `src/components/admin/accounts/` (5 components, ~900 lines total)
- `src/action/admin/accounts.ts` (~300 lines)
- `src/action/admin/containers.ts` (~300 lines)
- `src/lib/admin/docker.ts` (~300 lines)
- `src/api/admin/accounts/` (2 routes, ~500 lines total)
- `src/api/admin/containers/` (2 routes, ~500 lines total)

**Files to create:**
- `src/app/(adminRoutes)/users/page.tsx` (~200 lines)
- `src/app/(adminRoutes)/users/[userId]/page.tsx` (~250 lines)
- `src/components/admin/users/` (4 components, ~800 lines total)
- `src/action/admin/users.ts` (~300 lines)
- `src/api/admin/users/` (2 routes, ~500 lines total)

### Phase 3: Analytics & Monitoring (~3-4 days)
**Files to create:**
- `src/app/(adminRoutes)/ai/usage/page.tsx` (~300 lines)
- `src/app/(adminRoutes)/ai/agents/page.tsx` (~250 lines)
- `src/app/(adminRoutes)/webinars/analytics/page.tsx` (~300 lines)
- `src/app/(adminRoutes)/billing/overview/page.tsx` (~300 lines)
- `src/components/admin/ai/` (4 components, ~850 lines total)
- `src/components/admin/webinars/` (4 components, ~850 lines total)
- `src/components/admin/billing/` (4 components, ~900 lines total)
- `src/action/admin/ai.ts` (~300 lines)
- `src/action/admin/webinars.ts` (~300 lines)
- `src/action/admin/billing.ts` (~300 lines)
- `src/lib/admin/analytics.ts` (~300 lines)
- `src/api/admin/ai/` (2 routes, ~400 lines total)
- `src/api/admin/webinars/` (3 routes, ~700 lines total)
- `src/api/admin/billing/` (2 routes, ~400 lines total)

### Phase 4: Advanced Features (~2-3 days)
**Files to create:**
- `src/app/(adminRoutes)/content/` (2 pages, ~500 lines total)
- `src/app/(adminRoutes)/settings/` (4 pages, ~900 lines total)
- `src/app/(adminRoutes)/support/` (2 pages, ~600 lines total)
- `src/components/admin/content/` (2 components, ~450 lines total)
- `src/components/admin/settings/` (3 components, ~550 lines total)
- `src/action/admin/content.ts` (~250 lines)
- `src/action/admin/settings.ts` (~250 lines)
- `src/api/admin/settings/route.ts` (~250 lines)

### Shared Components (Create as needed)
- `src/components/admin/shared/DataTable.tsx` (~300 lines)
- `src/components/admin/shared/FilterBar.tsx` (~200 lines)
- `src/components/admin/shared/Pagination.tsx` (~150 lines)
- `src/components/admin/shared/StatusBadge.tsx` (~100 lines)
- `src/components/admin/shared/ActionMenu.tsx` (~150 lines)

**Total Estimated Files:** ~60 files
**Total Estimated Lines:** ~15,000 lines (all under 500 lines each)

---

## UI/UX Considerations

- **Consistent Design**: Match existing Selllio design system
- **Dark Mode**: Support theme switching
- **Responsive**: Mobile-friendly admin panel
- **Performance**: Pagination, lazy loading, caching
- **Accessibility**: WCAG compliant
- **Data Tables**: Sortable, filterable, exportable
- **Real-time Updates**: WebSocket for live metrics
- **Bulk Operations**: Select multiple items for batch actions

---

## API Endpoints Needed

### Dashboard
```
GET    /api/admin/dashboard/stats
```

### Accounts
```
GET    /api/admin/accounts
GET    /api/admin/accounts/[id]
PUT    /api/admin/accounts/[id]
DELETE /api/admin/accounts/[id]
POST   /api/admin/accounts/[id]/suspend
POST   /api/admin/accounts/[id]/activate
```

### Containers (Docker)
```
GET    /api/admin/containers
GET    /api/admin/containers/[id]
POST   /api/admin/containers/[id]/start
POST   /api/admin/containers/[id]/stop
POST   /api/admin/containers/[id]/restart
GET    /api/admin/containers/[id]/logs
POST   /api/admin/containers/create
DELETE /api/admin/containers/[id]
```

### Users
```
GET    /api/admin/users
GET    /api/admin/users/[id]
PUT    /api/admin/users/[id]
DELETE /api/admin/users/[id]
POST   /api/admin/users/[id]/suspend
POST   /api/admin/users/[id]/impersonate
GET    /api/admin/users/[id]/activity
```

### AI
```
GET    /api/admin/ai/usage
GET    /api/admin/ai/costs
GET    /api/admin/ai/agents
GET    /api/admin/ai/presentations
POST   /api/admin/ai/presentations/[id]/retry
```

### Webinars
```
GET    /api/admin/webinars
GET    /api/admin/webinars/[id]
GET    /api/admin/webinars/analytics
POST   /api/admin/webinars/[id]/moderate
```

### Billing
```
GET    /api/admin/billing/revenue
GET    /api/admin/billing/subscriptions
GET    /api/admin/billing/stripe-connect
GET    /api/admin/billing/transactions
```

### Settings
```
GET    /api/admin/settings
PUT    /api/admin/settings
GET    /api/admin/settings/features
PUT    /api/admin/settings/features
```

### Support
```
GET    /api/admin/logs
GET    /api/admin/tickets
POST   /api/admin/tickets
PUT    /api/admin/tickets/[id]
```

## Docker Containerization Integration

### Container Management Strategy
- **Container Lifecycle**: Create, start, stop, restart, delete containers per account
- **Port Management**: Dynamic port assignment for account containers
- **Resource Limits**: CPU, memory limits per container
- **Health Monitoring**: Container health checks and status
- **Log Aggregation**: Collect logs from all containers
- **Backup Strategy**: Container data backup and restore

### Docker Client Integration
```typescript
// src/lib/admin/docker.ts
- connectToDocker()          // Docker API client
- listContainers()           // List all account containers
- getContainerStatus()        // Get container health
- startContainer()           // Start account container
- stopContainer()            // Stop account container
- getContainerLogs()         // Fetch logs
- createAccountContainer()   // Provision new container
- deleteContainer()         // Remove container
```

### Container Configuration
- **Base Image**: Selllio platform image
- **Environment Variables**: Per-account env vars
- **Volume Mounts**: Account-specific data volumes
- **Network**: Isolated network per account or shared network
- **Resource Limits**: Configurable CPU/memory per tier

### Admin Panel Container Features
- **Container Status Dashboard**: Real-time status of all containers
- **Resource Usage**: CPU, memory, disk usage per container
- **Log Viewer**: Stream logs from containers
- **Container Actions**: Start, stop, restart, rebuild
- **Provisioning**: Create new account containers
- **Migration Tools**: Move accounts between containers

---

## Best Practices for File Size Management

### Component Splitting Strategy
1. **Extract Reusable Logic**: Create utility functions in separate files
2. **Separate Concerns**: Split data fetching, UI, and business logic
3. **Small Components**: Keep components focused on single responsibility
4. **Extract Constants**: Move constants, types, and configs to separate files
5. **Custom Hooks**: Extract complex logic into custom hooks

### Example: Breaking Down a Large Component
```typescript
// ❌ BAD: Single file with 600+ lines
// AccountDetailPage.tsx (600 lines)

// ✅ GOOD: Split into multiple files
// AccountDetailPage.tsx (~200 lines) - Main page component
// AccountDetailHeader.tsx (~150 lines) - Header section
// AccountDetailTabs.tsx (~100 lines) - Tab navigation
// AccountInfoCard.tsx (~150 lines) - Info display
// AccountActions.tsx (~150 lines) - Action buttons
// hooks/useAccountDetail.ts (~200 lines) - Data fetching logic
// utils/accountHelpers.ts (~150 lines) - Helper functions
```

### Page Component Pattern
```typescript
// page.tsx (~200-300 lines max)
// - Imports
// - Main component structure
// - Data fetching (server component)
// - Render child components

// _components/ folder
// - FeatureCard.tsx (~150 lines)
// - DataTable.tsx (~250 lines)
// - Filters.tsx (~150 lines)
```

### Server Action Pattern
```typescript
// action/admin/accounts.ts (~300 lines max)
// - Split by operation type if needed:
//   - accounts-list.ts (~150 lines)
//   - accounts-detail.ts (~150 lines)
//   - accounts-actions.ts (~150 lines)
```

### API Route Pattern
```typescript
// route.ts (~200-300 lines max)
// - Handle method routing
// - Validation
// - Call server actions
// - Return responses
// - Extract complex logic to lib/ files
```

---

## Implementation Approach

### Step 1: Database & Auth Setup
1. Create Prisma migrations for new models
2. Update middleware for admin route protection
3. Add role checking utilities

### Step 2: Core Layout
1. Create admin route group `(adminRoutes)`
2. Build admin layout with sidebar and header
3. Add navigation structure
4. Implement breadcrumbs

### Step 3: Shared Components First
1. Build reusable `DataTable` component
2. Create `FilterBar` component
3. Build `StatusBadge` and other UI primitives
4. These will be used across all admin pages

### Step 4: Page-by-Page Implementation
1. Start with Dashboard (simplest)
2. Then Accounts (core functionality)
3. Then Users (similar to accounts)
4. Then Analytics pages
5. Finally advanced features

### Step 5: Docker Integration
1. Set up Docker client library
2. Create container management utilities
3. Build container UI components
4. Integrate with account management

---

## Code Quality Standards

### TypeScript
- Strict type checking
- Proper interface definitions
- No `any` types
- Export types from separate files if needed

### Error Handling
- Try-catch blocks in all async operations
- Proper error messages
- Logging for debugging
- User-friendly error displays

### Performance
- Server components for data fetching
- Client components only when needed
- Pagination for large datasets
- Lazy loading for charts
- Caching where appropriate

### Testing Considerations
- Unit tests for utilities
- Integration tests for API routes
- Component tests for complex UI
- E2E tests for critical flows

---

## Docker Containerization Best Practices

### Container Naming Convention
- Format: `selllio-account-{accountId}`
- Example: `selllio-account-abc123`

### Environment Variables per Container
- `ACCOUNT_ID`: Account identifier
- `DATABASE_URL`: Account-specific database (if isolated)
- `API_KEYS`: Account-specific API keys
- `RESOURCE_LIMITS`: CPU/memory limits

### Health Checks
- HTTP endpoint: `/health`
- Database connectivity check
- Service dependencies check

### Logging Strategy
- Centralized log aggregation
- Structured logging (JSON)
- Log levels: info, warning, error
- Log retention policies

### Backup & Recovery
- Automated backups per container
- Point-in-time recovery
- Disaster recovery procedures

---

This design provides comprehensive admin functionality for managing a multi-tenant SaaS platform while maintaining security, usability, and code quality standards. All files are structured to stay under 500 lines through modular architecture and proper separation of concerns.

