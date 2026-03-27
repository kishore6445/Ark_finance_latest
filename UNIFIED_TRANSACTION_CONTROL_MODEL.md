# UNIFIED TRANSACTION CONTROL MODEL
# Single Source of Truth for All Financial Transactions

---

## EXECUTIVE SUMMARY

The Unified Transaction Control Model creates a **single source of truth** for ALL financial transactions. It implements a **two-stage workflow**:
- **Stage 1 (User)**: Enter transaction description + basic type (Revenue/Expense)
- **Stage 2 (Chartered Accountant)**: Fill ALL control fields to lock narrative

Every transaction is controlled through bank account flows, with complete traceability from source (payroll, budget, invoice, obligation, compliance) to financial statement.

---

## PART 1: CURRENT FIELDS IN TRANSACTIONS TABLE

### Existing Fields (15 fields)

| Field | Type | Purpose | Current Status |
|-------|------|---------|-----------------|
| `id` | UUID | Primary key | ✓ Active |
| `organizationId` | UUID | Multi-org support | ✓ Active |
| `date` | DATE | Transaction date | ✓ Active |
| `description` | VARCHAR | User enters here (Stage 1) | ✓ Active |
| `amount` | DECIMAL(15,2) | Transaction amount | ✓ Active |
| `isIncome` | BOOLEAN | Revenue or Expense | ✓ Active |
| `accountingType` | VARCHAR | Revenue/Expense/Asset/Liability | ✓ Active |
| `subtype` | VARCHAR | Payment/Receipt/Adjustment | ✓ Active |
| `coaCode` | VARCHAR | Chart of Accounts code | ✓ Active |
| `coaName` | VARCHAR | Chart of Accounts name | ✓ Active |
| `status` | VARCHAR | DRAFT/PENDING/APPROVED/REJECTED | ✓ Active |
| `approvalLevel` | VARCHAR | NONE/MANAGER/ADMIN | ✓ Active |
| `approvedBy` | UUID | Approver user ID | ✓ Active |
| `approvalDate` | TIMESTAMP | When approved | ✓ Active |
| `vendorCustomerName` | VARCHAR | Party name | ✓ Active |

### GST Fields (4 fields)

| Field | Type | Purpose | Current Status |
|-------|------|---------|-----------------|
| `gstRate` | INT | 5/12/18/28 % | ✓ Active |
| `gstAmount` | DECIMAL(15,2) | Calculated GST | ✓ Active |
| `taxableAmount` | DECIMAL(15,2) | Amount before GST | ✓ Active |
| `notes` | TEXT | Accountant notes | ✓ Active |

### Bank-Related Fields (2 fields)

| Field | Type | Purpose | Current Status |
|-------|------|---------|-----------------|
| `bankAccountId` | UUID | Which bank account | ⚠️ Partial |
| `paymentMethod` | VARCHAR | NEFT/RTGS/Cheque/Cash | ✓ Active |

### Reference Fields (3 fields)

| Field | Type | Purpose | Current Status |
|-------|------|---------|-----------------|
| `invoiceId` | UUID | Linked invoice | ✓ Active |
| `bucketId` | UUID | Expense bucket/department | ⚠️ Partial |
| `createdBy` | UUID | Who created | ✓ Active |

### Metadata Fields (2 fields)

| Field | Type | Purpose | Current Status |
|-------|------|---------|-----------------|
| `createdAt` | TIMESTAMP | Creation time | ✓ Active |
| `updatedAt` | TIMESTAMP | Last update | ✓ Active |

### Audit Fields (1 field)

| Field | Type | Purpose | Current Status |
|-------|------|---------|-----------------|
| `auditTrail` | JSONB | Full history | ✓ Active |

**TOTAL: 27 fields currently exist**

---

## PART 2: MISSING FIELDS (WHAT NEEDS TO BE ADDED)

### A. SOURCE/ORIGIN TRACKING (5 NEW FIELDS)

| Field | Type | Required | Purpose | Example |
|-------|------|----------|---------|---------|
| `sourceType` | VARCHAR | YES | Where did this come from? | `PAYROLL`, `INVOICE`, `BUDGET`, `MANUAL`, `BANK_STATEMENT`, `ADJUSTMENT` |
| `sourceId` | UUID | NO | FK to source record | payroll_run_id or invoice_id |
| `sourceReference` | VARCHAR | NO | Human-readable ref | `PR-2024-02-001` (Payroll Run) |
| `relatedEntityType` | VARCHAR | NO | What entity created this? | `EMPLOYEE`, `VENDOR`, `CUSTOMER`, `BANK` |
| `relatedEntityId` | UUID | NO | FK to entity | employee_id, vendor_id |

**Why**: Need to know if transaction came from payroll run, invoice, budget allocation, or manual entry. This creates the audit trail.

---

### B. OBLIGATION & COMPLIANCE TRACKING (6 NEW FIELDS)

| Field | Type | Required | Purpose | Example |
|-------|------|----------|---------|---------|
| `obligationId` | UUID | NO | FK to obligation | tax_payment_obligation_id |
| `obligationType` | VARCHAR | NO | What obligation? | `GST_RETURN`, `TDS_PAYMENT`, `PAYROLL_TAX`, `COMPLIANCE_FEE` |
| `complianceCategory` | VARCHAR | NO | Tax/Legal/Regulatory | `TAX`, `LEGAL`, `REGULATORY`, `AUDIT` |
| `riskFlag` | VARCHAR | NO | Risk assessment | `LOW`, `MEDIUM`, `HIGH` |
| `requiresAudit` | BOOLEAN | NO | Does auditor need to review? | true/false |
| `auditedBy` | UUID | NO | Auditor approval | auditor_user_id |

**Why**: Chartered accountant needs to flag which transactions have compliance requirements (GST, TDS, payroll tax, audit requirements). This prevents missing compliance.

---

### C. BUDGET & ALLOCATION TRACKING (5 NEW FIELDS)

| Field | Type | Required | Purpose | Example |
|-------|------|----------|---------|---------|
| `budgetCode` | VARCHAR | NO | Which budget line? | `SALARY_2024_Q1` |
| `budgetAllocationId` | UUID | NO | FK to budget allocation | allocation_id |
| `budgetVariance` | DECIMAL(15,2) | NO | Amount vs budget | -5000 (under budget) |
| `departmentId` | UUID | NO | Department/team | dept_id |
| `costCenterId` | VARCHAR | NO | Cost center code | `CC-001` |

**Why**: Transactions must link to budgets so accountant can track budget vs actual spending and variance analysis.

---

### D. WORKFLOW & CONTROL STATE (6 NEW FIELDS)

| Field | Type | Required | Purpose | Example |
|-------|------|----------|---------|---------|
| `workflowStage` | VARCHAR | YES | Current stage | `ENTRY`, `REVIEW`, `CONTROL`, `APPROVED`, `RECORDED` |
| `accountantReviewedAt` | TIMESTAMP | NO | When accountant reviewed | 2024-02-15 10:30 AM |
| `accountantReviewedBy` | UUID | NO | Which accountant | accountant_user_id |
| `controlledNarrative` | BOOLEAN | NO | Has accountant "locked" narrative? | true/false |
| `narrativeLocked At` | TIMESTAMP | NO | When locked | 2024-02-15 11:00 AM |
| `narrativeLockedBy` | UUID | NO | Which accountant locked it | accountant_user_id |

**Why**: Tracks the two-stage workflow. Tells us if accountant has reviewed and "controlled" the transaction narrative.

---

### E. BANK FLOW DETAILS (7 NEW FIELDS)

| Field | Type | Required | Purpose | Example |
|-------|------|----------|---------|---------|
| `bankStatementDate` | DATE | NO | When appeared on bank statement? | 2024-02-20 |
| `bankTransactionRef` | VARCHAR | NO | Bank's ref number | `TXN-12345` |
| `reconciliationStatus` | VARCHAR | NO | MATCHED/UNMATCHED/PENDING | `MATCHED` |
| `reconciliationDate` | TIMESTAMP | NO | When reconciled | 2024-02-28 03:00 PM |
| `chequeNumber` | VARCHAR | NO | If paid by cheque | `CHQ-0001234` |
| `clearanceDate` | DATE | NO | When cheque cleared | 2024-02-21 |
| `bankCharges` | DECIMAL(15,2) | NO | Bank fees if any | 100.00 |

**Why**: Complete bank flow visibility. Know exactly when money moved, how it moved, and when it cleared.

---

### F. NARRATIVE & CONTEXT (4 NEW FIELDS)

| Field | Type | Required | Purpose | Example |
|-------|------|----------|---------|---------|
| `accountantNotes` | TEXT | NO | Accountant's control notes | "GST verified from invoice", "Budget approved" |
| `internalNarrative` | TEXT | NO | Full story of transaction | "Feb salary run for 50 employees, total ₹90,000. GST-exempt. Approved by HR. Reconciled with bank." |
| `externalNarrative` | TEXT | NO | For auditor/compliance | "Monthly salary expense, standard rate" |
| `violationFlags` | JSONB | NO | Any issues found | `["budget_overage", "missing_invoice"]` |

**Why**: Accountant documents WHY each field was set this way, creating complete control narrative.

---

### G. CALCULATION & IMPACT TRACKING (5 NEW FIELDS)

| Field | Type | Required | Purpose | Example |
|-------|------|----------|---------|---------|
| `impactOnCashFlow` | DECIMAL(15,2) | NO | Actual cash impact | 90000 (salary is cash out) |
| `impactOnProfit` | DECIMAL(15,2) | NO | Profit/loss impact | -90000 (salary is expense) |
| `impactOnTaxes` | DECIMAL(15,2) | NO | Tax liability impact | -5400 (GST calculated) |
| `calculationFormula` | VARCHAR | NO | How was it calculated? | `Amount × (1 + GST_Rate)` |
| `systemCalculatedAmount` | DECIMAL(15,2) | NO | What system calculated | 106200 (before accountant override) |

**Why**: Shows impact on all three key areas (cash, profit, taxes) and whether accountant overrode system calculation.

---

**TOTAL NEW FIELDS TO ADD: 38 fields**
**FINAL TOTAL: 27 (existing) + 38 (new) = 65 fields in unified transaction table**

---

## PART 3: TWO-STAGE WORKFLOW

### STAGE 1: USER ENTRY (Minimal Data)

**User enters ONLY:**
```
Description: "February salary run for 50 employees"
Type: Revenue / Expense (Expense selected)
Amount: 90000
Date: 2024-02-15
Status: ENTRY
Workflow Stage: ENTRY
```

**System automatically fills:**
```
organizationId: (from logged-in user)
createdBy: (logged-in user)
createdAt: (now)
id: (generate UUID)
status: DRAFT
auditTrail: [{action: "created", by: user, at: now}]
```

**Result**: Transaction created in minimal form. User submits.

---

### STAGE 2: CHARTERED ACCOUNTANT CONTROL (Full Data)

**Accountant receives notification: "New transaction awaiting review"**

**Accountant fills ALL control fields:**

```
CLASSIFICATION & CODING
  → coaCode: "2030" (Salary Expense)
  → coaName: "Employee Compensation"
  → accountingType: "Expense"
  → subtype: "Payroll"
  
SOURCE TRACKING
  → sourceType: "PAYROLL"
  → sourceId: payroll_run_id_xyz
  → sourceReference: "PR-2024-02-001"
  → relatedEntityType: "EMPLOYEE"
  
BANK & PAYMENT
  → bankAccountId: primary_bank_account_id
  → bankAccountName: "HDFC Current Account"
  → paymentMethod: "NEFT"
  → bankTransactionRef: "TXN-54321"
  
GST & TAX
  → gstRate: 0 (payroll is GST-exempt)
  → gstAmount: 0
  → taxableAmount: 90000
  → complianceCategory: "TAX"
  → obligationType: "PAYROLL_TAX"
  
BUDGET & ALLOCATION
  → budgetCode: "SALARY_2024_Q1"
  → budgetAllocationId: budget_alloc_id_xyz
  → departmentId: "HR_DEPT"
  → costCenterId: "CC-SALARY"
  → bucketId: bucket_salary_id
  
CONTROL & AUDIT
  → workflowStage: "CONTROL"
  → accountantReviewedBy: accountant_user_id
  → accountantReviewedAt: now
  → controlledNarrative: true
  → narrativeLockedAt: now
  → narrativeLockedBy: accountant_user_id
  
NARRATIVE
  → accountantNotes: "Verified against payroll register. 50 employees, ₹1,800/emp average. GST-exempt per compliance. Salary head deduction verified."
  → internalNarrative: "February 2024 salary run. All employees paid via NEFT. Bank reconciliation complete. No discrepancies."
  → externalNarrative: "Monthly salary expense per approved payroll structure."
  
APPROVAL
  → approvalLevel: "MANAGER"
  → status: "PENDING_APPROVAL"
  → requiresAudit: false
```

**Accountant clicks: "LOCK NARRATIVE"**

```
Status changes from DRAFT → RECORDED (if auto-approve)
           or DRAFT → PENDING_APPROVAL (if needs manager)

auditTrail appends:
{
  action: "narrative_controlled",
  by: accountant_user_id,
  at: now,
  changes: {
    controlledNarrative: false → true,
    narrativeLockedAt: null → now,
    coaCode: null → "2030",
    // ... all 30+ fields
  }
}
```

**Result**: Transaction is now "controlled" with complete narrative locked. Cannot be changed without accountant unlock.

---

## PART 4: COMPLETE FIELD MAPPING BY LIFECYCLE STAGE

### Data Entry Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 1: USER ENTRY (5 fields)                                  │
├─────────────────────────────────────────────────────────────────┤
│ Input Fields:                                                    │
│ • description: "Feb salary run"                                 │
│ • amount: 90000                                                 │
│ • isIncome: false (it's an expense)                            │
│ • date: 2024-02-15                                             │
│ • paymentMethod: "NEFT"                                         │
│                                                                 │
│ Auto Fields:                                                    │
│ • organizationId, createdBy, createdAt, id, status             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 2: ACCOUNTANT CONTROL (60+ fields)                        │
├─────────────────────────────────────────────────────────────────┤
│ SECTION A: Classification                                       │
│ • coaCode, coaName, accountingType, subtype                    │
│                                                                 │
│ SECTION B: Source Tracking                                     │
│ • sourceType, sourceId, sourceReference                        │
│ • relatedEntityType, relatedEntityId                           │
│                                                                 │
│ SECTION C: Bank & Payment                                      │
│ • bankAccountId, bankTransactionRef                            │
│ • chequeNumber, clearanceDate, bankCharges                     │
│ • reconciliationStatus, reconciliationDate                     │
│                                                                 │
│ SECTION D: GST & Tax Compliance                                │
│ • gstRate, gstAmount, taxableAmount                            │
│ • complianceCategory, obligationType, obligationId             │
│ • requiresAudit, riskFlag                                      │
│                                                                 │
│ SECTION E: Budget & Allocation                                 │
│ • budgetCode, budgetAllocationId, budgetVariance              │
│ • departmentId, costCenterId, bucketId                         │
│                                                                 │
│ SECTION F: Approval & Control                                  │
│ • approvalLevel, approvedBy, approvalDate                      │
│ • workflowStage, controlledNarrative, narratureLockedAt       │
│                                                                 │
│ SECTION G: Narrative & Documentation                           │
│ • accountantNotes, internalNarrative, externalNarrative       │
│ • violationFlags, impactOnCashFlow, impactOnProfit            │
│                                                                 │
│ SECTION H: Calculation Details                                 │
│ • calculationFormula, systemCalculatedAmount                  │
│ • vendorCustomerName, notes                                   │
│                                                                 │
│ SECTION I: Audit Trail                                         │
│ • auditTrail (JSONB with all changes)                         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 3: MANAGER APPROVAL                                       │
├─────────────────────────────────────────────────────────────────┤
│ • Approves narrative (all fields read-only)                    │
│ • Can only add approval comments                               │
│ • Status → APPROVED                                            │
│ • Audit trail records approval                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 5: DATABASE MIGRATION SCRIPT

```sql
-- ADD 38 NEW FIELDS TO TRANSACTIONS TABLE

-- A. Source/Origin Tracking (5 fields)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS sourceType VARCHAR,
  ADD COLUMN IF NOT EXISTS sourceId UUID,
  ADD COLUMN IF NOT EXISTS sourceReference VARCHAR,
  ADD COLUMN IF NOT EXISTS relatedEntityType VARCHAR,
  ADD COLUMN IF NOT EXISTS relatedEntityId UUID;

-- B. Obligation & Compliance (6 fields)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS obligationId UUID,
  ADD COLUMN IF NOT EXISTS obligationType VARCHAR,
  ADD COLUMN IF NOT EXISTS complianceCategory VARCHAR,
  ADD COLUMN IF NOT EXISTS riskFlag VARCHAR,
  ADD COLUMN IF NOT EXISTS requiresAudit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auditedBy UUID;

-- C. Budget & Allocation (5 fields)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS budgetCode VARCHAR,
  ADD COLUMN IF NOT EXISTS budgetAllocationId UUID,
  ADD COLUMN IF NOT EXISTS budgetVariance DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS departmentId UUID,
  ADD COLUMN IF NOT EXISTS costCenterId VARCHAR;

-- D. Workflow & Control State (6 fields)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS workflowStage VARCHAR,
  ADD COLUMN IF NOT EXISTS accountantReviewedAt TIMESTAMP,
  ADD COLUMN IF NOT EXISTS accountantReviewedBy UUID,
  ADD COLUMN IF NOT EXISTS controlledNarrative BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS narrativeLockedAt TIMESTAMP,
  ADD COLUMN IF NOT EXISTS narrativeLockedBy UUID;

-- E. Bank Flow Details (7 fields)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS bankStatementDate DATE,
  ADD COLUMN IF NOT EXISTS bankTransactionRef VARCHAR,
  ADD COLUMN IF NOT EXISTS reconciliationStatus VARCHAR,
  ADD COLUMN IF NOT EXISTS reconciliationDate TIMESTAMP,
  ADD COLUMN IF NOT EXISTS chequeNumber VARCHAR,
  ADD COLUMN IF NOT EXISTS clearanceDate DATE,
  ADD COLUMN IF NOT EXISTS bankCharges DECIMAL(15,2);

-- F. Narrative & Context (4 fields)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS accountantNotes TEXT,
  ADD COLUMN IF NOT EXISTS internalNarrative TEXT,
  ADD COLUMN IF NOT EXISTS externalNarrative TEXT,
  ADD COLUMN IF NOT EXISTS violationFlags JSONB;

-- G. Calculation & Impact (5 fields)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS impactOnCashFlow DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS impactOnProfit DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS impactOnTaxes DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS calculationFormula VARCHAR,
  ADD COLUMN IF NOT EXISTS systemCalculatedAmount DECIMAL(15,2);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_sourceType ON transactions(sourceType);
CREATE INDEX IF NOT EXISTS idx_transactions_obligationType ON transactions(obligationType);
CREATE INDEX IF NOT EXISTS idx_transactions_budgetCode ON transactions(budgetCode);
CREATE INDEX IF NOT EXISTS idx_transactions_workflowStage ON transactions(workflowStage);
CREATE INDEX IF NOT EXISTS idx_transactions_controlledNarrative ON transactions(controlledNarrative);
CREATE INDEX IF NOT EXISTS idx_transactions_reconciliationStatus ON transactions(reconciliationStatus);
```

---

## PART 6: IMPLEMENTATION PRIORITY & PHASES

### Phase 1: Foundation (Week 1)
- Add 38 new database fields
- Create indexes for performance
- Update transaction create API endpoint

### Phase 2: Stage 1 - User Entry Form (Week 2)
- Create simple 5-field entry form (description, amount, type, date, method)
- Show transaction in "ENTRY" status
- Send notification to accountant

### Phase 3: Stage 2 - Accountant Control Form (Week 2-3)
- Create 60-field control form (grouped by sections)
- Implement field dependencies (e.g., if sourceType=PAYROLL, auto-fill obligationType=PAYROLL_TAX)
- "Lock Narrative" button functionality
- Auto-populate audit trail

### Phase 4: Validations & Business Rules (Week 3)
- Validate GST based on CoA
- Calculate impacts (cash, profit, tax)
- Check budget allocation
- Flag compliance requirements
- Set risk flags

### Phase 5: Integration with Other Flows (Week 4)
- Link to Payroll → auto-create transactions
- Link to Invoices → auto-create transactions
- Link to Budget → auto-populate budget fields
- Link to Bank Reconciliation → auto-populate bank fields

---

## PART 7: UI FORM STRUCTURE

### Stage 1: User Entry Form (5 minutes to fill)
```
┌──────────────────────────────────────────┐
│ ADD NEW TRANSACTION                      │
├──────────────────────────────────────────┤
│                                          │
│ Description *                            │
│ [________________________________________] │
│ "What is this transaction for?"          │
│                                          │
│ Type * (dropdown)                        │
│ [ Revenue ] [ ✓ Expense ]               │
│                                          │
│ Amount *                                 │
│ [________] INR                          │
│                                          │
│ Date *                                   │
│ [2024-02-15]                            │
│                                          │
│ Payment Method                           │
│ [NEFT] [Cheque] [Cash] [Card]          │
│                                          │
│                                          │
│ [Cancel] [✓ Create Transaction]         │
│                                          │
│ → Transaction created as DRAFT           │
│ → Awaiting accountant review            │
│                                          │
└──────────────────────────────────────────┘
```

### Stage 2: Accountant Control Form (20-30 minutes to fill)

**SECTION A: CLASSIFICATION & CODING**
```
Chart of Accounts *
[Search...] → Auto-complete from 50 CoAs
Selected: 2030 - Employee Compensation

Accounting Type
[Revenue] [Expense] [✓ Asset] [Liability]

Subtype
[✓ Payroll] [Bonus] [Gratuity] [Retrenchment]
```

**SECTION B: SOURCE TRACKING**
```
Source of Transaction *
[PAYROLL] [INVOICE] [BUDGET] [MANUAL] [BANK_STATEMENT]
Selected: PAYROLL

Source Reference
[PR-2024-02-001]
(Auto-populated from linked payroll run)

Related Entity
[EMPLOYEE] [VENDOR] [CUSTOMER] [BANK]
```

**SECTION C: BANK & PAYMENT**
```
Bank Account *
[HDFC Current Account - 1234567890]

Bank Transaction Reference
[TXN-54321]

Payment Method
[✓ NEFT] [Cheque] [RTGS] [Cash]

Cheque Number (if applicable)
[_________]

Expected Clearance Date
[2024-02-21]
```

**SECTION D: GST & TAX**
```
GST Rate
[✓ 0% (Exempt)] [5%] [12%] [18%] [28%]
(Auto-calculated based on CoA)

Calculated GST Amount
[₹0.00] (Read-only)

Taxable Amount
[₹90,000.00] (Read-only)

Compliance Category
[TAX] [LEGAL] [REGULATORY] [✓ AUDIT]

Requires External Audit?
[✓ No] [Yes]
```

**SECTION E: BUDGET & ALLOCATION**
```
Budget Line Item
[SALARY_2024_Q1]

Department
[HR Department]

Cost Center
[CC-SALARY]

Budget vs Actual Status
Allocated: ₹100,000
Spent: ₹90,000
Remaining: ₹10,000
Status: ✓ ON TRACK
```

**SECTION F: NARRATIVE & NOTES**
```
Accountant Notes
[_________________________________
___________________________________
___________________________________]

"Verified against payroll register. 50 employees, ₹1,800/emp average. GST-exempt per compliance."

Internal Narrative (for auditor)
[_________________________________
___________________________________]

External Narrative (for compliance filing)
[_________________________________
___________________________________]
```

**SECTION G: IMPACT CALCULATION**
```
Impact on Cash Flow
[₹90,000] (Cash out)

Impact on Profit
[-₹90,000] (Expense reduces profit)

Impact on Taxes
[-₹5,400] (GST if applicable)

Over System Calculation?
System Calculated: ₹88,000
Accountant Calculated: ₹90,000
Difference: +₹2,000 [Reason: ___________]
```

**SECTION H: CONTROL & LOCK**
```
☑ All fields verified and correct
☑ Narrative locked and cannot be changed

[← Back] [Save Draft] [✓ LOCK NARRATIVE]

Locks transaction.
Status changes to APPROVED or PENDING_APPROVAL
Audit trail records all 30+ field changes
```

---

## PART 8: API ENDPOINTS FOR TRANSACTION CONTROL

### Create Transaction (Stage 1)
```
POST /api/transactions/create

Request:
{
  "description": "Feb salary run",
  "amount": 90000,
  "isIncome": false,
  "date": "2024-02-15",
  "paymentMethod": "NEFT"
}

Response:
{
  "id": "txn_001",
  "status": "ENTRY",
  "workflowStage": "ENTRY",
  "createdAt": "2024-02-15T09:00:00Z",
  "message": "Transaction created. Awaiting accountant review."
}
```

### Get Transaction for Accountant Review
```
GET /api/transactions/{id}/review

Response:
{
  "id": "txn_001",
  "description": "Feb salary run",
  "amount": 90000,
  // ... existing fields ...
  "status": "ENTRY",
  "workflowStage": "ENTRY",
  // All control fields are null
}
```

### Update Transaction (Stage 2 - Accountant Control)
```
PUT /api/transactions/{id}/control

Request:
{
  "coaCode": "2030",
  "coaName": "Employee Compensation",
  "sourceType": "PAYROLL",
  "sourceId": "pr_xyz",
  "bankAccountId": "bank_001",
  "budgetCode": "SALARY_2024_Q1",
  "gstRate": 0,
  "accountantNotes": "Verified against payroll register...",
  "internalNarrative": "February 2024 salary...",
  "controlledNarrative": false,  // Not locked yet
  // ... 30+ other fields ...
}

Response:
{
  "id": "txn_001",
  "message": "Transaction updated. Review before locking."
}
```

### Lock Narrative (Finalize)
```
PUT /api/transactions/{id}/lock-narrative

Request:
{
  "confirmed": true
}

Response:
{
  "id": "txn_001",
  "status": "APPROVED",  // or PENDING_APPROVAL
  "workflowStage": "CONTROL",
  "controlledNarrative": true,
  "narrativeLockedAt": "2024-02-15T10:30:00Z",
  "narrativeLockedBy": "accountant_001",
  "message": "Narrative locked. Transaction cannot be edited without unlock."
}
```

### Unlock Narrative (Accountant only)
```
PUT /api/transactions/{id}/unlock-narrative

Request:
{
  "reason": "Found discrepancy in amount"
}

Response:
{
  "id": "txn_001",
  "status": "ENTRY",
  "controlledNarrative": false,
  "narratureLockedAt": null,
  "message": "Narrative unlocked. Can now edit fields."
}
```

---

## PART 9: COMPLETE TRANSACTION LIFECYCLE

```
START
  ↓
[1] USER CREATES MINIMAL TRANSACTION
    Input: Description, Amount, Type, Date, Method
    Status: ENTRY
    Narrative: Unlocked
  ↓
[2] ACCOUNTANT RECEIVES NOTIFICATION
    "New transaction waiting for review"
  ↓
[3] ACCOUNTANT REVIEWS & CONTROLS (30 min)
    Fill 60+ fields:
    - Classification (CoA, Type)
    - Source tracking (Payroll/Invoice/etc)
    - Bank details (Account, Ref, Cheque)
    - Tax & Compliance (GST, Audit flag)
    - Budget & Allocation (Department, Cost Center)
    - Narrative & Notes
    - Impact Calculation
  ↓
[4] ACCOUNTANT LOCKS NARRATIVE
    Status: CONTROLLED
    Narrative: LOCKED (Cannot edit)
    All fields frozen
  ↓
[5] APPROVAL CHECK
    If amount < ₹10K → Auto-approve
    If amount ₹10K-₹100K → Needs Manager
    If amount > ₹100K → Needs Org Admin
  ↓
[6] MANAGER APPROVES (if needed)
    Reviews entire narrative
    Can only add approval comment
    Cannot edit any field
    Status: APPROVED
  ↓
[7] TRANSACTION RECORDED
    Transaction now included in:
    - Financial Statements
    - Budget vs Actual
    - Bank Reconciliation
    - GST Returns
    - Audit Trail
  ↓
[8] MONTHLY CLOSING
    Transaction locked for month
    Can only be edited by Org Admin
  ↓
[9] AUDITOR REVIEW
    Views transaction details
    Verifies narrative
    Signs off on accuracy
  ↓
END

Total Time: 5 min (user) + 30 min (accountant) + 10 min (manager) = 45 min
```

---

## PART 10: SUMMARY TABLE

| Component | Current Status | New Status | Impact |
|-----------|---|---|---|
| Transaction Fields | 27 | 65 (+38) | Complete control |
| User Entry Fields | 5 fields | 5 fields | Simple, fast |
| Accountant Control Fields | Limited | 60+ fields | Full narrative |
| Workflow Stages | 3 (DRAFT/PENDING/APPROVED) | 5 (ENTRY/REVIEW/CONTROL/APPROVED/RECORDED) | Clear progression |
| Source Tracking | Partial | Complete | Know origin |
| Bank Integration | Partial | Complete | Full bank flow |
| Compliance Tracking | Partial | Complete | Tax ready |
| Budget Tracking | Partial | Complete | Variance visible |
| Audit Trail | Basic | Advanced (JSONB) | Full history |
| Lock Mechanism | No | Yes | Narrative protected |

**Result**: Unified Transaction Control Model creates single source of truth for all financial data with clear two-stage workflow.
