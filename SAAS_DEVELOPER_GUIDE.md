# Warrior Finance - Developer Architecture Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React/Next.js)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Check   │  │ Organization │  │ Role-Based   │     │
│  │ Middleware   │  │ Context      │  │ Access Check │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Screens (27 screens)                        │   │
│  │  Dashboard → Transactions → Approvals → Reports    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    (HTTP/REST Calls)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│               APPLICATION LAYER (Server)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │ Role Service │  │ Data Service │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Transaction  │  │ Financial    │  │ Approval     │     │
│  │ Service      │  │ Calculation  │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    (SQL Queries)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (PostgreSQL)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ users      │  │ orgs       │  │ transactions
│  │ roles      │  │ settings   │  │ invoices   │           │
│  │ perms      │  │ team_mbr   │  │ banks      │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ buckets    │  │ approvals  │  │ audit_log  │           │
│  │ reconcil   │  │ reports    │  │ statements │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Patterns

### 1. Role-Based Access Control (RBAC)

**Implementation Pattern**
```typescript
// Check if user has permission
interface Permission {
  resource: 'transactions' | 'invoices' | 'reports' | ...;
  action: 'create' | 'read' | 'update' | 'delete' | 'approve';
  organizationId: string;
  userId: string;
}

function checkPermission(user: User, permission: Permission): boolean {
  // 1. Get user's role in organization
  const role = getUserRole(user.id, permission.organizationId);
  
  // 2. Get role's permissions
  const rolePerms = getRolePermissions(role);
  
  // 3. Check if permission exists
  return rolePerms.includes(permission);
}
```

### 2. Organization Data Isolation

**Implementation Pattern**
```typescript
// All queries filtered by organizationId
const getTransactions = (orgId: string) => {
  return db.query(
    `SELECT * FROM transactions WHERE organizationId = $1`,
    [orgId]
  );
};

// Middleware checks org access
const checkOrgAccess = async (req, res, next) => {
  const user = req.user;
  const orgId = req.params.orgId;
  
  const hasAccess = await db.query(
    `SELECT * FROM user_organizations 
     WHERE userId = $1 AND organizationId = $2`,
    [user.id, orgId]
  );
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  next();
};
```

### 3. Auto-Classification Engine

**Implementation Pattern**
```typescript
function classifyTransaction(description: string): CoAAccount {
  // 1. Extract keywords
  const keywords = extractKeywords(description);
  
  // 2. Match to Chart of Accounts
  const scores = [];
  for (const account of CHART_OF_ACCOUNTS) {
    const matchScore = calculateMatch(keywords, account.keywords);
    scores.push({ account, score: matchScore });
  }
  
  // 3. Return top match
  return scores.sort((a, b) => b.score - a.score)[0].account;
}
```

### 4. Approval Chain Pattern

**Implementation Pattern**
```typescript
async function processApproval(transaction) {
  // Determine approval level
  const approvalLevel = getApprovalLevel(transaction.amount);
  
  // Route to appropriate queue
  switch(approvalLevel) {
    case 'NONE':
      transaction.status = 'APPROVED';
      break;
    case 'MANAGER':
      transaction.approvalQueue = 'manager_queue';
      break;
    case 'ADMIN':
      transaction.approvalQueue = 'admin_queue';
      break;
  }
  
  // Notify approver
  await sendNotification(approver, transaction);
}
```

### 5. Real-time Financial Calculation

**Implementation Pattern**
```typescript
async function updateFinancialStatements(orgId: string) {
  // 1. Aggregate transactions by Chart of Accounts
  const aggregated = await aggregateByAccount(orgId);
  
  // 2. Calculate P&L
  const pnl = calculatePL(aggregated);
  
  // 3. Calculate Balance Sheet
  const bs = calculateBalanceSheet(aggregated);
  
  // 4. Update cached statements
  await cacheStatements(orgId, { pnl, bs });
  
  // 5. Notify subscribers (WebSocket)
  await broadcastUpdate(orgId, { pnl, bs });
}
```

---

## Data Model

### Core Tables

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  passwordHash VARCHAR,
  name VARCHAR,
  phone VARCHAR,
  createdAt TIMESTAMP,
  status VARCHAR, -- ACTIVE, INACTIVE, INVITED
  lastLogin TIMESTAMP
);
```

**organizations**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR,
  type VARCHAR, -- Company, Partnership, Sole Trader
  gstin VARCHAR,
  pan VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  pinCode VARCHAR,
  fiscalYearStart INT, -- 1-12
  fiscalYearEnd INT, -- 1-12
  currency VARCHAR DEFAULT 'INR',
  createdAt TIMESTAMP,
  createdBy UUID REFERENCES users(id),
  status VARCHAR -- ACTIVE, SUSPENDED, CLOSED
);
```

**user_organizations (Mapping)**
```sql
CREATE TABLE user_organizations (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  organizationId UUID REFERENCES organizations(id),
  role VARCHAR, -- SUPER_ADMIN, ORG_ADMIN, ACCOUNTANT, MANAGER, AUDITOR, VIEWER
  status VARCHAR -- ACTIVE, INVITED, INACTIVE
  invitedAt TIMESTAMP,
  acceptedAt TIMESTAMP,
  UNIQUE(userId, organizationId)
);
```

**transactions**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  date DATE,
  description VARCHAR,
  amount DECIMAL(15,2),
  isIncome BOOLEAN,
  accountingType VARCHAR, -- Revenue, Expense, Asset, Liability
  subtype VARCHAR,
  coaCode VARCHAR, -- Chart of Accounts code
  coaName VARCHAR, -- Chart of Accounts name
  invoiceId UUID REFERENCES invoices(id),
  status VARCHAR, -- DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
  approvalLevel VARCHAR, -- NONE, MANAGER, ADMIN
  approvedBy UUID REFERENCES users(id),
  approvalDate TIMESTAMP,
  gstRate INT, -- 5, 12, 18, 28
  gstAmount DECIMAL(15,2),
  taxableAmount DECIMAL(15,2),
  notes TEXT,
  createdBy UUID REFERENCES users(id),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  auditTrail JSONB -- Full history
);
```

**invoices**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  invoiceNo VARCHAR,
  partyName VARCHAR,
  type VARCHAR, -- Revenue, Expense
  invoiceAmount DECIMAL(15,2),
  paidAmount DECIMAL(15,2),
  balanceDue DECIMAL(15,2),
  dueDate DATE,
  status VARCHAR, -- UNPAID, PARTIAL, PAID, OVERDUE
  createdBy UUID REFERENCES users(id),
  createdAt TIMESTAMP,
  matchedTransactionId UUID REFERENCES transactions(id),
  matchedDate TIMESTAMP
);
```

**approvals**
```sql
CREATE TABLE approvals (
  id UUID PRIMARY KEY,
  transactionId UUID REFERENCES transactions(id),
  organizationId UUID REFERENCES organizations(id),
  approverRole VARCHAR,
  approverUserId UUID REFERENCES users(id),
  status VARCHAR, -- PENDING, APPROVED, REJECTED, INFO_REQUESTED
  amount DECIMAL(15,2),
  reason TEXT,
  approvalDate TIMESTAMP,
  createdAt TIMESTAMP
);
```

**audit_log**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  userId UUID REFERENCES users(id),
  action VARCHAR, -- CREATE, UPDATE, DELETE, APPROVE, REJECT
  resource VARCHAR, -- transaction, invoice, user, etc
  resourceId UUID,
  changes JSONB, -- Before/after values
  timestamp TIMESTAMP,
  ipAddress VARCHAR
);
```

---

## API Endpoint Structure

### Transaction Endpoints

```
POST   /api/orgs/:orgId/transactions
       Create transaction with auto-classification
       Requires: ACCOUNTANT+ role
       Body: { date, amount, type, description }
       Returns: Transaction with classified CoA

GET    /api/orgs/:orgId/transactions
       Get all transactions (paginated, filtered)
       Requires: ACCOUNTANT+ role
       Query: { status, dateFrom, dateTo, coaCode }
       Returns: Transaction[]

GET    /api/orgs/:orgId/transactions/:txnId
       Get single transaction
       Requires: READ permission
       Returns: Transaction with full audit trail

PUT    /api/orgs/:orgId/transactions/:txnId
       Update transaction
       Requires: MANAGER+ or creator + ACCOUNTANT
       Body: { date, amount, type, coaCode }
       Returns: Updated transaction

DELETE /api/orgs/:orgId/transactions/:txnId
       Delete transaction
       Requires: ORG_ADMIN role
       Returns: { success: true }

POST   /api/orgs/:orgId/transactions/:txnId/approve
       Approve transaction
       Requires: Manager or higher
       Body: { approvalComment }
       Returns: Approval record

POST   /api/orgs/:orgId/transactions/:txnId/reject
       Reject transaction
       Requires: Manager or higher
       Body: { rejectionReason }
       Returns: Updated transaction
```

### Invoice Endpoints

```
POST   /api/orgs/:orgId/invoices
       Create invoice
       Requires: ACCOUNTANT+ role
       Body: { invoiceNo, partyName, type, amount, dueDate }
       Returns: Invoice

GET    /api/orgs/:orgId/invoices
       Get all invoices
       Query: { status, dateFrom, dateTo, partyName }
       Returns: Invoice[]

POST   /api/orgs/:orgId/invoices/:invId/match
       Match invoice to transaction
       Requires: ACCOUNTANT+ role
       Body: { transactionId }
       Returns: Matched invoice

POST   /api/orgs/:orgId/invoices/:invId/unmatch
       Unmatch invoice
       Requires: ACCOUNTANT+ role
       Returns: Unmatched invoice
```

### Financial Statement Endpoints

```
GET    /api/orgs/:orgId/statements/pl
       Get P&L Statement
       Query: { dateFrom, dateTo }
       Returns: P&L Statement

GET    /api/orgs/:orgId/statements/bs
       Get Balance Sheet
       Query: { asOn }
       Returns: Balance Sheet

GET    /api/orgs/:orgId/statements/cf
       Get Cash Flow
       Query: { dateFrom, dateTo }
       Returns: Cash Flow

POST   /api/orgs/:orgId/statements/finalize
       Finalize period statements
       Requires: ORG_ADMIN role
       Returns: Finalized statements
```

### Approval Endpoints

```
GET    /api/orgs/:orgId/approvals
       Get pending approvals for current user
       Returns: Approval[]

POST   /api/orgs/:orgId/approvals/:appId/approve
       Approve pending item
       Requires: Appropriate role
       Returns: Updated approval

POST   /api/orgs/:orgId/approvals/:appId/reject
       Reject pending item
       Requires: Appropriate role
       Body: { rejectionReason }
       Returns: Updated approval

POST   /api/orgs/:orgId/approvals/:appId/request-info
       Request additional info
       Body: { infoRequested: string[] }
       Returns: Updated approval
```

---

## Implementation Checklist for Developer

### Phase 1: Foundation (Week 1-2)
- [ ] Set up database schema (users, orgs, transactions, invoices, approvals)
- [ ] Implement authentication & JWT
- [ ] Create organization context & provider
- [ ] Implement role-based access middleware
- [ ] Build user invitation system
- [ ] Create permission checking utilities

### Phase 2: Core Workflows (Week 3-4)
- [ ] Build transaction entry with auto-classification
- [ ] Implement invoice creation and management
- [ ] Create bank reconciliation flow
- [ ] Build approval chain system
- [ ] Implement approval queue notifications
- [ ] Create audit logging system

### Phase 3: Financial Calculations (Week 5-6)
- [ ] Build Chart of Accounts mapping engine
- [ ] Implement transaction aggregation
- [ ] Create P&L calculation engine
- [ ] Create Balance Sheet calculation
- [ ] Create Cash Flow calculation
- [ ] Implement real-time statement updates

### Phase 4: Reporting & Compliance (Week 7-8)
- [ ] Build report generation system
- [ ] Implement GST compliance calculations
- [ ] Create GST return generation
- [ ] Build tax report generation
- [ ] Create audit report system
- [ ] Implement compliance verification

### Phase 5: Admin & Settings (Week 9-10)
- [ ] Build organization settings management
- [ ] Create team management interface
- [ ] Build budget management
- [ ] Implement role & permission management
- [ ] Create system notifications system
- [ ] Build user activity tracking

### Phase 6: Polish & Testing (Week 11-12)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] User acceptance testing
- [ ] Documentation
- [ ] Deployment
