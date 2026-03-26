# Bank Account Flow Analysis - Missing Components

## Executive Summary

Your bank account is the **SOURCE OF TRUTH** for all financial flows. Currently, there are **critical gaps** where bank accounts are referenced but not fully implemented. This analysis identifies exactly what's missing and what needs to be linked.

---

## Current State: What EXISTS

### Schema References
- ✅ `transactions.bankAccountId` (foreign key defined)
- ✅ `transactions.amount`, `date`, `description`
- ✅ `transactions.isIncome` (tracks in/out)
- ✅ `invoices` (linked to transactions)

### Services That Reference Bank
- ✅ `bank-reconciliation.service.ts` - Reconciles statements
- ✅ `financial-calculations.service.ts` - Aggregates transactions

### Workflows That Depend on Bank
- ✅ Workflow 3: Bank Reconciliation (statement matching)
- ✅ Workflow 1: Transaction → P&L (uses transactions linked to bank)

---

## MISSING PIECES - Critical Gaps

### 1. **MISSING: `bank_accounts` Table**

**Current Problem:**
```sql
-- transactions table references this:
bankAccountId UUID REFERENCES bank_accounts(id)

-- But bank_accounts table DOESN'T EXIST!
```

**What's Missing:**
```sql
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  bankName VARCHAR,           -- "HDFC Bank", "ICICI", etc.
  accountNumber VARCHAR,      -- Masked for security
  accountType VARCHAR,        -- SAVINGS, CURRENT, SALARY
  currency VARCHAR DEFAULT 'INR',
  openingBalance DECIMAL(15,2),
  currentBalance DECIMAL(15,2),
  lastReconciliedDate DATE,
  status VARCHAR DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE, CLOSED
  createdAt TIMESTAMP,
  createdBy UUID REFERENCES users(id)
);

-- Link bank accounts to organization (one org can have multiple accounts)
CREATE TABLE IF NOT EXISTS organization_bank_accounts (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  bankAccountId UUID REFERENCES bank_accounts(id),
  isPrimary BOOLEAN DEFAULT FALSE,
  UNIQUE(organizationId, bankAccountId)
);
```

**Why It Matters:**
- Multiple bank accounts per organization (salary account, operations account, etc.)
- Opening balance tracking for reconciliation
- Primary account selection for default transactions
- Account status management

---

### 2. **MISSING: `payroll` Table & Salary Flow**

**Current Problem:**
- No way to record payroll runs
- No link between salary expenses and bank disbursements
- Budget vs Actual can't track salary properly

**What's Missing:**
```sql
CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  payrollMonth DATE,          -- "2024-02-01"
  payrollRunDate DATE,        -- When it was processed
  status VARCHAR,             -- DRAFT, APPROVED, PROCESSED, PAID
  totalAmount DECIMAL(15,2),  -- Sum of all salaries
  bankAccountId UUID REFERENCES bank_accounts(id),  -- Which account paid it
  createdBy UUID REFERENCES users(id),
  createdAt TIMESTAMP,
  processedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_employees (
  id UUID PRIMARY KEY,
  payrollId UUID REFERENCES payroll(id),
  employeeId VARCHAR,
  employeeName VARCHAR,
  salary DECIMAL(15,2),
  bonus DECIMAL(15,2),
  deductions DECIMAL(15,2),
  netAmount DECIMAL(15,2),
  bankAccount VARCHAR,        -- Employee's bank account
  tdsAmount DECIMAL(15,2),
  status VARCHAR              -- PENDING, PROCESSED, FAILED
);

-- Link payroll to transactions (accounting)
CREATE TABLE IF NOT EXISTS payroll_transactions (
  id UUID PRIMARY KEY,
  payrollId UUID REFERENCES payroll(id),
  transactionId UUID REFERENCES transactions(id),
  coaCode VARCHAR,            -- 2030 (Salaries), 4040 (GST), etc.
  amount DECIMAL(15,2)
);
```

**Flow:**
```
Payroll Run (Feb)
  ↓
Create transaction: -₹50,000 (Salary Expense, CoA 2030)
  ↓
Approval chain (if > ₹10K)
  ↓
Transaction approved
  ↓
Disburse from bank_account (update currentBalance)
  ↓
Show in P&L as expense
  ↓
Budget vs Actual tracks against salary budget
  ↓
Bank reconciliation matches payment
```

---

### 3. **MISSING: `budgets` Table & Budget Linking**

**Current Problem:**
- Budgeting module exists but not linked to bank accounts
- Can't track budget vs actual spending
- No way to enforce budget limits on transactions

**What's Missing:**
```sql
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  fiscalYear INT,             -- 2024
  coaCode VARCHAR,            -- 2030 (Salaries)
  coaName VARCHAR,
  budgetAmount DECIMAL(15,2),
  startMonth INT,             -- 1
  endMonth INT,               -- 12
  status VARCHAR DEFAULT 'ACTIVE',
  createdBy UUID REFERENCES users(id),
  createdAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_tracking (
  id UUID PRIMARY KEY,
  budgetId UUID REFERENCES budgets(id),
  month INT,                  -- Current month
  budgetedAmount DECIMAL(15,2),
  actualAmount DECIMAL(15,2),  -- Sum of all transactions for this CoA this month
  variance DECIMAL(15,2),      -- budgeted - actual
  variancePercent DECIMAL(5,2),
  status VARCHAR,             -- ON_TRACK, WARNING, OVERSPENT
  updatedAt TIMESTAMP
);
```

**Flow:**
```
Budget Set: Salaries ₹1,00,000/month
  ↓
Payroll Run: ₹95,000
  ↓
Transaction created & approved
  ↓
budget_tracking updated: actualAmount = ₹95,000
  ↓
Dashboard shows: "95% of salary budget used"
  ↓
If next payroll is ₹10,000 (exceeds ₹1,00,000):
  - Alert: "Budget exceeded by ₹5,000"
  - Manager approval required
  - Flag for budget review
```

---

### 4. **MISSING: `bank_statements` Table**

**Current Problem:**
- Bank reconciliation service parses CSV but doesn't store statements
- Can't track historical reconciliations
- No audit trail for bank changes

**What's Missing:**
```sql
CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  bankAccountId UUID REFERENCES bank_accounts(id),
  statementDate DATE,         -- 2024-02-29
  openingBalance DECIMAL(15,2),
  closingBalance DECIMAL(15,2),
  totalDebits DECIMAL(15,2),
  totalCredits DECIMAL(15,2),
  parsedAt TIMESTAMP,
  reconciliationStatus VARCHAR,  -- PENDING, MATCHED, UNMATCHED, RECONCILED
  createdBy UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS bank_statement_items (
  id UUID PRIMARY KEY,
  statementId UUID REFERENCES bank_statements(id),
  date DATE,
  description VARCHAR,
  amount DECIMAL(15,2),
  type VARCHAR,               -- DEBIT, CREDIT
  referenceNumber VARCHAR,    -- Bank reference
  matchedTransactionId UUID REFERENCES transactions(id),
  matchStatus VARCHAR,        -- MATCHED, UNMATCHED, PENDING
  matchedAt TIMESTAMP
);
```

---

### 5. **MISSING: `expense_categories` Table (For Auto-Classification)**

**Current Problem:**
- Auto-classification service has hardcoded Chart of Accounts
- No way to customize for organization
- No link between expense type and bank categories

**What's Missing:**
```sql
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  name VARCHAR,               -- "Salary", "Travel", "Office Supplies"
  coaCode VARCHAR,            -- 2030, 2060, 2080
  coaName VARCHAR,
  bankKeywords JSONB,         -- ["salary", "payroll", "emp payment"]
  gstRate INT,                -- 0, 5, 12, 18, 28
  autoApproveUnder DECIMAL(15,2),  -- If ₹50,000, auto-approve?
  requiresInvoice BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP
);

-- Link to budgets
ALTER TABLE budgets
ADD COLUMN categoryId UUID REFERENCES expense_categories(id);
```

---

### 6. **MISSING: Cash Flow from Bank Perspective**

**Current Problem:**
- Cash flow statement generated from transactions
- But not linked to actual bank balance changes
- Can't verify cash flow accuracy with bank statement

**What Needs Updating:**
```typescript
// In financial-calculations.service.ts

// Add this function:
calculateCashFlowFromBank(organizationId, startDate, endDate) {
  // Query: startBalance + deposits - withdrawals = endBalance
  // Verify against: bank_accounts.currentBalance
  
  return {
    openingCashBalance: startBalance,    // From bank_account
    operatingCashFlow: positiveTransactions,
    investingCashFlow: capitalTransactions,
    financingCashFlow: loanTransactions,
    closingCashBalance: endBalance,      // Should match bank_account.currentBalance
    variance: endBalance - actualBankBalance  // Should be 0 if reconciled
  };
}
```

---

## COMPLETE FLOW WITH MISSING PIECES

### End-to-End: Bank → Salary Payroll → Budget → P&L

```
BANK ACCOUNT (Starting balance: ₹5,00,000)
     ↓
BUDGET SET: Salaries ₹1,00,000/month
     ↓
PAYROLL RUN (Feb 15)
  - Employee 1: ₹30,000
  - Employee 2: ₹25,000
  - Employee 3: ₹35,000
  - Total: ₹90,000
     ↓
TRANSACTION CREATED (Accounting Entry)
  - CoA: 2030 (Salaries)
  - Amount: ₹90,000
  - Status: PENDING_APPROVAL
  - LinkedTo: payroll_id
     ↓
APPROVAL CHAIN (₹90,000 → Manager approval)
  - Manager approves
  - Status: APPROVED
     ↓
BANK ACCOUNT UPDATED
  - currentBalance: ₹5,00,000 - ₹90,000 = ₹4,10,000
  - Transaction marked as CLEARED
     ↓
BUDGET TRACKING UPDATED
  - actualAmount: ₹90,000 (was ₹0)
  - variance: ₹1,00,000 - ₹90,000 = ₹10,000
  - status: ON_TRACK (90% of budget used)
     ↓
P&L UPDATED
  - Salary Expense: +₹90,000
  - Net Profit: Reduced by ₹90,000
     ↓
BANK RECONCILIATION (Feb 29)
  - Bank statement shows: -₹90,000 on Feb 15
  - System has: -₹90,000 on Feb 15
  - Status: MATCHED
  - Closing balance: ₹4,10,000 (verified)
     ↓
REPORTS
  - Dashboard: Salary budget 90% used, On track
  - Cash Flow: Cash outflow ₹90,000 for operations
  - P&L: Salary expense ₹90,000
  - Bank Reconciliation: Verified
```

---

## What's Working NOW vs What's Broken

| Component | Status | Issue |
|-----------|--------|-------|
| Transactions | ✅ Working | But bankAccountId references non-existent table |
| Approvals | ✅ Working | Doesn't update bank balance |
| Financial Calcs | ✅ Working | Can't verify against actual bank |
| Bank Reconciliation | ⚠️ Partial | Service exists but needs bank_statements table |
| Payroll | ❌ Missing | No payroll module |
| Budgets | ❌ Missing | No budget tracking |
| Cash Flow | ⚠️ Broken | Not linked to bank balance |
| Bank Accounts | ❌ Missing | Core table missing |

---

## Priority Fixes (Order of Implementation)

### Phase 1: Create Core Bank Infrastructure
1. ✅ Create `bank_accounts` table
2. ✅ Create `bank_statements` table
3. ✅ Update `transactions` foreign key constraint
4. ✅ Create Bank Account Management service

### Phase 2: Connect Payroll & Salary Flow
1. ✅ Create `payroll` and `payroll_employees` tables
2. ✅ Create Payroll Service
3. ✅ Link payroll transactions to bank account deductions
4. ✅ Create Payroll API endpoints

### Phase 3: Implement Budget Tracking
1. ✅ Create `budgets` and `budget_tracking` tables
2. ✅ Create Budget Tracking service
3. ✅ Create Budget vs Actual API
4. ✅ Add budget validation to approval chain

### Phase 4: Link Everything
1. ✅ Update Cash Flow calculations to verify against bank
2. ✅ Create dashboard showing bank → payroll → budget → P&L flow
3. ✅ Add real-time bank balance updates
4. ✅ Add transaction impact on bank balance

---

## Expected After Fixes

```
Real Financial Flow:

Bank Opening Balance: ₹5,00,000
  ↓ (Salary payment approved & deducted)
Bank Updated: ₹4,10,000
  ↓ (Payroll service records)
Payroll Recorded: ₹90,000 spent
  ↓ (Budget tracking service compares)
Budget: 90% of ₹1,00,000 used (ON TRACK)
  ↓ (Financial calcs aggregates)
P&L Shows: Salary Expense ₹90,000
  ↓ (Cash flow verification)
Cash Flow: ₹90,000 operating outflow
  ↓ (Reconciliation matches)
Bank Statement: Verified match
  ↓ (Audit trail)
Complete audit trail for compliance
```

---

## Recommendation

Implement Phase 1 & 2 immediately. These are **blocking issues** - without them:
- Transactions can't actually deduct from bank
- Payroll can't be recorded
- Cash flow calculations are inaccurate
- Bank reconciliation can't verify against actual transactions

Would you like me to implement all 4 phases? I can create the tables, services, and APIs to fully connect the bank account flow.
