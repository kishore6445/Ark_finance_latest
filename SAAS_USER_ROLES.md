# Warrior Finance - SaaS User Roles & Permissions

## Role Hierarchy

```
Super Admin (Platform Level)
├── Org Admin (Organization Level)
│   ├── Accountant
│   ├── Manager
│   ├── Auditor
│   └── Viewer
└── Accountant (Individual Level)
```

---

## 1. SUPER ADMIN (Platform Level)

**Responsibility**: Manage the entire SaaS platform

### Permissions Matrix

| Feature | Read | Create | Edit | Delete | Approve |
|---------|------|--------|------|--------|---------|
| Organizations | ✓ | ✓ | ✓ | ✓ | ✓ |
| Users | ✓ | ✓ | ✓ | ✓ | ✓ |
| Subscriptions | ✓ | ✓ | ✓ | ✓ | ✓ |
| Billing | ✓ | ✓ | ✓ | ✓ | ✓ |
| System Logs | ✓ | - | - | - | - |
| All Organization Data | ✓ | ✓ | ✓ | ✓ | ✓ |
| Compliance Reports | ✓ | - | - | - | - |

### Screens Access
- Organization Management
- User Management
- Billing & Subscription
- System Settings
- Audit Logs
- All other screens (with override)

---

## 2. ORG ADMIN (Organization Level)

**Responsibility**: Manage single organization, team, and financial settings

### Permissions Matrix

| Feature | Read | Create | Edit | Delete | Approve |
|---------|------|--------|------|--------|---------|
| Organization Settings | ✓ | - | ✓ | - | - |
| Team Members | ✓ | ✓ | ✓ | ✓ | - |
| Transactions | ✓ | ✓ | ✓ | ✓ | ✓ |
| Invoices | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bank Accounts | ✓ | ✓ | ✓ | ✓ | ✓ |
| Financial Statements | ✓ | - | - | - | ✓ |
| Approvals | ✓ | - | - | - | ✓ |
| Reports | ✓ | ✓ | ✓ | ✓ | - |

### Key Responsibilities
- Invite and manage team members
- Set up bank accounts and buckets
- Approve high-value transactions
- Manage compliance settings
- Review financial statements
- Access all financial data

---

## 3. ACCOUNTANT (Organization Member)

**Responsibility**: Day-to-day transaction entry and reconciliation

### Permissions Matrix

| Feature | Read | Create | Edit | Delete | Approve |
|---------|------|--------|------|--------|---------|
| Transactions | ✓ | ✓ | ✓ (Own) | - | - |
| Invoices | ✓ | ✓ | ✓ (Own) | - | - |
| Bank Reconciliation | ✓ | ✓ | ✓ | - | - |
| Buckets | ✓ | - | - | - | - |
| Financial Statements | ✓ | - | - | - | - |
| Reports | ✓ | ✓ | ✓ (Own) | - | - |
| Team Members | - | - | - | - | - |
| Organization Settings | - | - | - | - | - |

### Restrictions
- Cannot delete transactions/invoices
- Cannot modify organization settings
- Cannot see other team members' activity
- Cannot approve transactions
- Cannot change financial statement data

---

## 4. MANAGER (Organization Member)

**Responsibility**: Oversee operations, review entries, manage approvals

### Permissions Matrix

| Feature | Read | Create | Edit | Delete | Approve |
|---------|------|--------|------|--------|---------|
| Transactions | ✓ | ✓ | ✓ | - | ✓ |
| Invoices | ✓ | ✓ | ✓ | - | ✓ |
| Bank Reconciliation | ✓ | ✓ | ✓ | - | - |
| Reports | ✓ | ✓ | ✓ | ✓ | - |
| Financial Statements | ✓ | - | - | - | - |
| Activity Logs | ✓ | - | - | - | - |
| Team Members | ✓ | - | - | - | - |

### Key Responsibilities
- Review transactions entered by accountants
- Approve transactions and invoices
- Monitor budget and spending
- Generate operational reports
- View team activity logs

---

## 5. AUDITOR (Organization Member)

**Responsibility**: Independent verification and compliance review

### Permissions Matrix

| Feature | Read | Create | Edit | Delete | Approve |
|---------|------|--------|------|--------|---------|
| All Data | ✓ | - | - | - | - |
| Transactions | ✓ | - | - | - | - |
| Financial Statements | ✓ | - | - | - | - |
| Audit Reports | ✓ | ✓ | ✓ | - | - |
| Activity Logs | ✓ | - | - | - | - |
| Compliance Reports | ✓ | ✓ | - | - | - |

### Key Responsibilities
- Review all transactions (read-only)
- Verify financial statement accuracy
- Generate audit reports
- Check compliance with standards
- Document audit findings

---

## 6. VIEWER (Organization Member)

**Responsibility**: View-only access for stakeholders

### Permissions Matrix

| Feature | Read | Create | Edit | Delete | Approve |
|---------|------|--------|------|--------|---------|
| Transactions | ✓ | - | - | - | - |
| Financial Statements | ✓ | - | - | - | - |
| Reports | ✓ | - | - | - | - |
| Dashboard | ✓ | - | - | - | - |

### Restrictions
- Cannot create anything
- Cannot edit anything
- Cannot delete anything
- Cannot approve anything
- Read-only access to dashboards and reports

---

## Permission Legend

- **✓** = Full Access
- **✓ (Own)** = Can only access own data
- **-** = No Access
- **✓ (Limited)** = Conditional access based on rules

---

## Data Visibility by Role

### Super Admin
- Sees all data across all organizations
- Can filter by organization

### Org Admin
- Sees all data within organization
- Cannot see other organizations

### Accountant
- Sees own transactions
- Sees all organization transactions (read)
- Cannot see other members' details

### Manager
- Sees all transactions
- Sees team member activity
- Sees approval queue

### Auditor
- Sees all transactions (read-only)
- Sees audit trail
- Sees compliance data

### Viewer
- Sees public dashboards
- Sees published reports
- Cannot see transactional details

---

## Role Assignment Workflow

```
Super Admin creates Organization
    ↓
Org Admin created (assigned by Super Admin)
    ↓
Org Admin invites team members
    ├── Accountants (create transactions)
    ├── Managers (approve transactions)
    ├── Auditors (review compliance)
    └── Viewers (view reports)
    ↓
Team members accept invitation
    ↓
Roles become active in organization
```

---

## Permission Rules by Context

### Transaction Entry
- **Accountant**: Can create own transactions
- **Manager**: Can create and approve transactions
- **Org Admin**: Can create, edit, approve all transactions
- **Auditor**: View-only
- **Viewer**: View-only

### Financial Statements
- **Accountant**: Read-only
- **Manager**: Read-only
- **Org Admin**: Read + can finalize
- **Auditor**: Read-only with audit annotations
- **Viewer**: View published statements only

### Bank Reconciliation
- **Accountant**: Can reconcile own entries
- **Manager**: Can review and approve reconciliation
- **Org Admin**: Full control
- **Auditor**: Read-only
- **Viewer**: No access

### Approval Chains
- **Amount < ₹10,000**: Accountant can create, Manager can approve
- **Amount ₹10,000 - ₹1,00,000**: Requires Manager approval
- **Amount > ₹1,00,000**: Requires Org Admin approval
- **Critical transactions**: Requires Org Admin + Auditor sign-off

---

## Audit Trail by Role Action

Every role's actions are logged:
- WHO: User ID + Name + Role
- WHAT: Action (Create, Edit, Delete, Approve)
- WHEN: Timestamp
- WHERE: Screen/Feature
- WHY: Change reason (if provided)
- BEFORE/AFTER: Data comparison
