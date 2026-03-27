# COMPLETE TRANSACTION VISUAL FLOW - Add/Edit Through Application

## Executive Overview: How a Transaction Flows Through Ark Finance

This guide shows the **complete visual journey** of a single transaction as it moves through the entire application - from user entry through accountant control to final recording in all modules.

### Key Concept: Single Source of Truth
Every transaction starts at the bank account and flows through all dependent modules. When an accountant "controls" a transaction, it automatically updates:
- Bank balance
- Budget utilization
- Cash flow forecasts
- Financial statements (P&L, Balance Sheet)
- Payroll records
- Invoice matching
- Tax calculations
- Compliance obligations

---

## PART 1: TRANSACTION ENTRY INTERFACE (Stage 1 - User)

### Screen 1.1: Add Transaction (Minimal Entry)

**URL**: `/transactions/add`

**Form Fields Visible to User** (Only 5 fields):

```
┌─────────────────────────────────────────────────────┐
│  ADD TRANSACTION                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Description *                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ February salary run for 50 employees        │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Transaction Type *                                 │
│  ○ Income    ● Expense                              │
│                                                     │
│  Amount *                                           │
│  ┌──────────────────────────────────────────────┐  │
│  │ 90000                                        │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Date *                                             │
│  ┌──────────────────────────────────────────────┐  │
│  │ 2024-02-15                                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Payment Method *                                   │
│  ┌──────────────────────────────────────────────┐  │
│  │ [Select payment method] ▼                    │  │
│  │ - Bank Transfer (NEFT/RTGS)                 │  │
│  │ - Cheque                                    │  │
│  │ - Cash                                      │  │
│  │ - Credit Card                               │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌────────────┬──────────────┐                      │
│  │ SAVE DRAFT │ SUBMIT FOR   │                      │
│  │            │ REVIEW       │                      │
│  └────────────┴──────────────┘                      │
│                                                     │
│  All other fields locked - Will be filled by        │
│  Chartered Accountant in Stage 2                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Data Saved to Database** (Stage 1 Entry):

```json
{
  "id": "txn_20240215_001",
  "description": "February salary run for 50 employees",
  "amount": 90000,
  "isIncome": false,
  "paymentMethod": "NEFT",
  "date": "2024-02-15",
  "workflowStage": "ENTRY",
  "status": "DRAFT",
  "createdBy": "user_5678",
  "createdAt": "2024-02-15 09:00:00",
  "createdFromModule": "payroll",  // Where it originated
  "sourceType": "PAYROLL",
  "sourceId": "payroll_run_2024_feb"
}
```

**What's NOT Visible** (All Locked - Reserved for Accountant):
- Chart of Accounts code
- GST rate & calculation
- Bank account assignment
- Budget allocation
- Budget code
- Department/Cost center
- Obligation tracking
- Compliance flags
- Tax implications
- Narrative & notes

---

### Screen 1.2: Transaction Created - Awaiting Accountant Review

**URL**: `/transactions/{id}/review`

**What User Sees** (Locked Fields):

```
┌─────────────────────────────────────────────────────┐
│  TRANSACTION PENDING REVIEW                         │
│  Status: DRAFT → Awaiting Accountant Review         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ✓ SUBMITTED BY YOU                                 │
│  User: John (Finance Coordinator)                   │
│  Time: 2024-02-15 09:05 AM                          │
│                                                     │
│  YOUR ENTERED DETAILS (Locked - Cannot Edit)        │
│  ├─ Description: Salary run for 50 employees       │
│  ├─ Amount: ₹90,000                                │
│  ├─ Type: Expense                                  │
│  ├─ Date: 2024-02-15                               │
│  └─ Payment Method: Bank Transfer (NEFT)           │
│                                                     │
│  ⏳ AWAITING ACCOUNTANT CONTROL                      │
│  │                                                  │
│  │ An accountant will now:                          │
│  │ ├─ Verify budget allocation                     │
│  │ ├─ Assign Chart of Accounts                     │
│  │ ├─ Calculate GST if applicable                  │
│  │ ├─ Link to payroll records                      │
│  │ ├─ Verify bank account availability             │
│  │ ├─ Flag compliance requirements                 │
│  │ └─ Lock all details ("control" the narrative)   │
│  │                                                  │
│  └─ Once controlled, you cannot edit               │
│                                                     │
│  [BACK TO TRANSACTIONS LIST]                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## PART 2: ACCOUNTANT CONTROL INTERFACE (Stage 2 - Chartered Accountant)

### Screen 2.1: Accountant's Transaction Control Panel

**URL**: `/accountant/transactions/{id}/control`

**What Accountant Sees** (All Fields Editable Until Locked):

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TRANSACTION CONTROL - ACCOUNTANT REVIEW & EDIT                          │
│  Transaction: Feb Salary Run | Amount: ₹90,000 | Status: DRAFT           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  SECTION 1: USER SUBMITTED DATA (Read-Only)                               │
│  ════════════════════════════════════════════                             │
│  Description: February salary run for 50 employees                        │
│  Amount: ₹90,000                                                          │
│  Type: Expense                                                            │
│  Date: 2024-02-15                                                         │
│  Payment Method: Bank Transfer (NEFT)                                     │
│                                                                            │
│                                                                            │
│  SECTION 2: SOURCE & ORIGIN (Accountant Fills)                            │
│  ═════════════════════════════════════════════                            │
│  Source Type: [PAYROLL ▼]                                                │
│  Source Reference: PR-2024-02-001                                         │
│  Source ID/Payroll Run: [payroll_run_feb_001 ▼]                          │
│  Related Entity: EMPLOYEES                                                │
│  Related Entity List: [50 employees selected]                             │
│                                                                            │
│                                                                            │
│  SECTION 3: BANK & CASH FLOW (Accountant Verifies)                        │
│  ════════════════════════════════════════════════                         │
│  Bank Account: [Primary Bank Account ▼]                                   │
│    Current Balance: ₹5,00,000                                             │
│    Available (after committed): ₹4,10,000                                 │
│    ✓ Sufficient funds available                                           │
│                                                                            │
│  Bank Statement Tracking:                                                 │
│    Expected Bank Date: 2024-02-20                                         │
│    Bank Transaction Ref: [TBD - After execution]                          │
│    Reconciliation Status: PENDING                                         │
│                                                                            │
│  Payment Execution Details:                                               │
│    Cheque Number: [Optional - if cheque]                                  │
│    Expected Clearance: [Optional]                                         │
│                                                                            │
│                                                                            │
│  SECTION 4: CHART OF ACCOUNTS & CLASSIFICATION                            │
│  ═══════════════════════════════════════════════                          │
│  Accounting Type: [Expense ▼]                                             │
│  Chart of Accounts: [4050 - Salary & Wages ▼]                            │
│  Sub-Classification: [Employee Salaries ▼]                               │
│  Cost Center: [CC-001 ▼]                                                  │
│  Confidence Score: 98%                                                    │
│  ✓ Auto-classified by AI - Accountant confirms                            │
│                                                                            │
│                                                                            │
│  SECTION 5: BUDGET ALLOCATION & TRACKING                                  │
│  ═══════════════════════════════════════════                              │
│  Budget Code: [SALARY_2024_Q1 ▼]                                          │
│  Allocation ID: budget_alloc_sal_q1_001                                   │
│  Department: [Finance Department ▼]                                       │
│  Budget for Feb: ₹90,000                                                  │
│  Already Spent in Feb: ₹0                                                 │
│  Remaining: ₹90,000                                                       │
│  Impact if approved: ₹90,000 / ₹90,000 = 100% of budget                  │
│  ⚠️  WARNING: This will FULLY UTILIZE budget for February                  │
│                                                                            │
│  Budget Variance (after this txn): ₹0 (On budget)                         │
│  Forecast if approved: ₹0 remaining                                       │
│                                                                            │
│                                                                            │
│  SECTION 6: TAX & COMPLIANCE                                              │
│  ════════════════════════════                                             │
│  GST Applicable: ○ Yes  ● No (Salary is GST-exempt)                      │
│  GST Rate: N/A                                                            │
│  Taxable Amount: ₹90,000                                                  │
│  GST Amount: ₹0                                                           │
│  Total with Tax: ₹90,000                                                  │
│                                                                            │
│  Compliance Category:                                                     │
│    ✓ Payroll Tax (PF, ESI, ESIC deductions)                              │
│    ✓ TDS Applicable: Yes (10% if contractor)                             │
│    ✓ Compliance Requirement: GST-Exempt, Payroll Tax Required            │
│                                                                            │
│  Obligation Type: [PAYROLL_TAX ▼]                                         │
│  Risk Flag: [LOW ▼]                                                       │
│  Requires Audit: ○ Yes  ● No                                             │
│  Audit Notes: Routine salary processing                                   │
│                                                                            │
│                                                                            │
│  SECTION 7: CASH FLOW IMPACT                                              │
│  ═════════════════════════════                                            │
│  Impact on Cash: -₹90,000 (Cash outflow)                                  │
│  Impact on Profit/Loss: -₹90,000 (Salary Expense)                         │
│  Impact on Taxes: ₹0 (GST not applicable)                                │
│  Impact on Available Cash: Reduces from ₹4,10,000 to ₹3,20,000           │
│                                                                            │
│  30-Day Forecast Impact: Reduces runway from 35 days to 28 days           │
│  ⚠️  Monitor: If more expenses come, may need funding                      │
│                                                                            │
│                                                                            │
│  SECTION 8: ACCOUNTANT'S CONTROL NARRATIVE                                │
│  ═════════════════════════════════════════════                            │
│  Internal Notes (For team):                                               │
│  ┌──────────────────────────────────────────────────────────┐             │
│  │ Monthly salary run verified against HR records.          │             │
│  │ 50 employees, standard salary structure.                 │             │
│  │ Budget adequate for Q1. No GST implication.              │             │
│  │ Bank balance sufficient. Expected clearance by Feb 20.   │             │
│  │ All mandatory deductions verified.                       │             │
│  │ Compliance: Within payroll tax deadlines.                │             │
│  └──────────────────────────────────────────────────────────┘             │
│                                                                            │
│  External Narrative (For audit/compliance):                               │
│  ┌──────────────────────────────────────────────────────────┐             │
│  │ Monthly salary payment to 50 employees for Feb 2024.     │             │
│  │ Approved by HR and Finance Manager.                      │             │
│  │ Recorded under "Salary & Wages" (CoA 4050).              │             │
│  │ Standard payroll processing, no exceptions.              │             │
│  └──────────────────────────────────────────────────────────┘             │
│                                                                            │
│  Violation Flags:  [None]                                                 │
│                                                                            │
│                                                                            │
│  SECTION 9: APPROVAL & CONTROL                                            │
│  ═════════════════════════════                                            │
│  Approval Level Required: MANAGER (Amount: ₹90,000 between ₹10K-₹1L)      │
│  Assigned to: Priya Sharma (Finance Manager)                              │
│                                                                            │
│  ┌─────────────────────────────────┐                                      │
│  │ ✓ LOCK NARRATIVE & CONTROL      │  <- Click when ready                │
│  │                                 │     (Freezes all fields)             │
│  └─────────────────────────────────┘                                      │
│                                                                            │
│  Once locked:                                                             │
│  ├─ Transaction moves to REVIEW status                                   │
│  ├─ Manager sees locked details (cannot change)                          │
│  ├─ Manager can only approve/reject (not edit)                           │
│  ├─ All dependent modules are updated (budgets, cash flow, P&L)          │
│  └─ Transaction enters the financial system                              │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## PART 3: APPLICATION RIPPLE EFFECTS (What Happens After "Lock Narrative")

### Step 1: Transaction Status Changes to REVIEW

```
Transaction Record Updated:
  workflowStage: ENTRY → REVIEW
  status: DRAFT → PENDING_APPROVAL
  controlledNarrative: false → true
  narrativeLockedAt: 2024-02-15 10:00 AM
  narrativeLockedBy: accountant_user_002
  accountantReviewedAt: 2024-02-15 10:00 AM
```

### Step 2: All Dependent Systems Update Automatically

**2.1 BUDGET MODULE UPDATED**

```
Before:
  Budget: SALARY_2024_Q1
  Allocated: ₹2,70,000 (for entire Q1)
  Used in Jan: ₹90,000
  Available: ₹1,80,000

After Transaction Locked:
  Budget: SALARY_2024_Q1
  Allocated: ₹2,70,000
  Used in Jan: ₹90,000
  Used in Feb: ₹90,000 ← NEW TRANSACTION
  Available: ₹90,000 (March only)
  Variance: On Budget
  Alert: 🟡 YELLOW - Only March salary remaining in Q1
  Forecast: If March expenses similar, budget will be tight
```

**2.2 CASH FLOW MODULE UPDATED**

```
Before:
  Current Bank Balance: ₹5,00,000
  Allocated to Budgets: ₹1,50,000
  Pending Payroll: ₹90,000 (from Jan)
  Available: ₹2,60,000

After Transaction Locked:
  Current Bank Balance: ₹5,00,000
  Allocated to Budgets: ₹1,50,000
  Pending Payroll: ₹90,000 (Feb - just locked)
  Available: ₹2,60,000 ← SAME (pending approval)
  
  Once APPROVED:
  Current Bank Balance: ₹4,10,000 ← UPDATED
  Allocated to Budgets: ₹1,50,000
  Pending Payroll: ₹0 (now processed)
  Available: ₹2,60,000
  
  30-Day Forecast:
    Current runway: 28 days (down from 35)
    Alert: No liquidity crisis, but monitor
```

**2.3 FINANCIAL STATEMENTS UPDATED**

```
P&L Statement (Feb):
  Before Locking:
    Salary Expense: ₹0
    Total Expenses: ₹X
    Net Income: ₹Y

  After Locking:
    Salary Expense: ₹90,000 ← ADDED
    Total Expenses: ₹X + ₹90,000
    Net Income: ₹Y - ₹90,000 ← REDUCED
    
  Note: P&L updates ONLY when transaction is APPROVED
        (Not just when locked)

Balance Sheet (Feb):
  Before: Total Assets: ₹5,00,000 (Cash)
  After:  Total Assets: ₹5,00,000 (unchanged until processed)
  
  Retained Earnings: Reduced by salary expense (when approved)
```

**2.4 BANK RECONCILIATION READY**

```
Reconciliation Status: PENDING
  Expected Bank Date: 2024-02-20
  Expected Amount: ₹90,000 (for 50 employees - multiple transactions)
  Matching Algorithm Ready:
    - When bank statement arrives, will match on amount ±1%
    - Match on date ±3 days
    - Match on party names (employee names)
  Status: Ready for reconciliation
```

**2.5 TAX/GST TRACKING READY**

```
GST Tracking: Not applicable (salary is exempt)
Payroll Tax Tracking: ACTIVE
  TDS: 10% if contractors
  PF: Company + Employee contribution
  ESI/ESIC: As per govt rules
  Due Dates: 5th of next month (by March 5)
  Alert: Payroll tax filing due in 15 days
```

**2.6 COMPLIANCE CHECKLIST UPDATED**

```
Payroll Processing Compliance:
  ✓ Payroll amount locked and controlled
  ✓ Budget verified sufficient
  ✓ Bank balance verified
  ✓ Approval routing assigned (Manager)
  ✓ Narrative documented
  ✓ Tax implications tracked
  ✓ GST status confirmed (exempt)
  ✓ Ready for approval
  
  Status: AWAITING MANAGER APPROVAL
```

---

## PART 4: MANAGER APPROVAL INTERFACE

### Screen 4.1: Manager's Approval Review (Read-Only View)

**URL**: `/approvals/transactions/{id}/review`

```
┌────────────────────────────────────────────────────────┐
│  TRANSACTION APPROVAL REQUEST                          │
│  To: Priya Sharma (Finance Manager)                    │
│  From: Accountant (Controlled & Locked)                │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ✓ ACCOUNTANT HAS CONTROLLED THIS TRANSACTION           │
│  All fields locked - You can ONLY approve/reject       │
│  Cannot edit any fields                                │
│                                                         │
│  TRANSACTION SUMMARY (All Read-Only)                    │
│  ═══════════════════════════════════════                │
│  Description: Feb salary run for 50 employees          │
│  Amount: ₹90,000                                       │
│  Type: Expense (Salary)                                │
│  Date: 2024-02-15                                      │
│  CoA: 4050 - Salary & Wages                            │
│  Budget Code: SALARY_2024_Q1                           │
│  Bank: Primary Bank Account                            │
│  Payment: NEFT                                         │
│                                                         │
│  ACCOUNTANT'S NARRATIVE (Locked)                        │
│  ════════════════════════════════════                   │
│  "Monthly salary run verified against HR records.       │
│   50 employees, standard salary structure.              │
│   Budget adequate for Q1. No GST implication.           │
│   Bank balance sufficient. Expected clearance by        │
│   Feb 20. All mandatory deductions verified.            │
│   Compliance: Within payroll tax deadlines."            │
│                                                         │
│  IMPACT ANALYSIS (Controlled by Accountant)             │
│  ════════════════════════════════════════               │
│  Budget Impact: Uses 100% of Feb salary budget          │
│  Cash Impact: Reduces available from ₹4,10K to ₹3,20K  │
│  Profit Impact: Reduces net income by ₹90K             │
│  Tax Impact: Payroll tax filing due next month          │
│  Runway Impact: 28 days (down from 35)                  │
│                                                         │
│  YOUR APPROVAL OPTIONS:                                 │
│  ═════════════════════                                  │
│  [ ✓ APPROVE ]  [ ✗ REJECT ]  [ ? REQUEST CHANGES ]    │
│                                                         │
│  Your Decision: [Awaiting your action]                  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Manager Clicks: APPROVE**

---

## PART 5: FINAL PROCESSING & RECORDING

### Step 5.1: Transaction Approved - Moving to Processing

```
Status Update:
  workflowStage: REVIEW → APPROVED
  status: PENDING_APPROVAL → APPROVED
  approvedBy: manager_user_003
  approvalLevel: MANAGER
  approvalDate: 2024-02-15 11:30 AM
```

### Step 5.2: Auto-Execute Payment (If Auto-Process Enabled)

```
If auto-process is enabled:
  1. Verify bank balance again: ₹5,00,000 - ₹90,000 = ₹4,10,000 ✓
  2. Create bank transaction record
  3. Debit bank account: ₹5,00,000 → ₹4,10,000
  4. Execute NEFT for employee accounts
  5. Generate payment slips
  6. Update all 50 employee records
  7. Set status: PROCESSED
  8. Update payroll run: status = PROCESSED

Bank Transaction Created:
  id: BT_PAYROLL_20240215_001
  amount: ₹90,000
  type: DEBIT
  date: 2024-02-15
  description: "Payroll for 50 employees - Feb 2024"
  linkedTransaction: txn_20240215_001
  status: PROCESSING
```

### Step 5.3: Final Recording in All Systems

```
PAYROLL MODULE:
  Payroll Run Status: PROCESSED
  All 50 employees: Salary credited
  Bank debit confirmed: ₹90,000
  Next run date: 2024-03-15

BUDGET MODULE:
  Budget Code: SALARY_2024_Q1
  Feb Spending: ₹90,000 (RECORDED)
  Variance: 0 (On budget)
  Alert: Feb fully used, March budget remaining

CASH FLOW MODULE:
  Bank Balance: ₹4,10,000 (Updated)
  Available: ₹2,60,000 (After commitments)
  Runway: 28 days (Recalculated)
  Next Critical Date: March 15 (Next payroll)

FINANCIAL STATEMENTS (P&L):
  Salary Expense: ₹90,000 (Recorded)
  Total Expenses: Increased by ₹90,000
  Net Income: Decreased by ₹90,000
  Status: Updated for Feb close

RECONCILIATION:
  Expected bank date: Feb 20
  Awaiting: Bank statement upload
  Status: PENDING_RECONCILIATION

COMPLIANCE:
  GST: Not applicable (recorded as exempt)
  Payroll Tax: Due March 5 (Alert: 18 days remaining)
  Audit Trail: Complete narrative documented
  Status: COMPLIANT
```

### Step 5.4: Transaction Final Status

```
Transaction Record Final State:

{
  "id": "txn_20240215_001",
  "description": "February salary run for 50 employees",
  "amount": 90000,
  "isIncome": false,
  "workflowStage": "RECORDED",
  "status": "PROCESSED",
  
  // Stage 1 - User Input
  "createdBy": "user_5678",
  "createdAt": "2024-02-15 09:00:00",
  
  // Stage 2 - Accountant Control
  "accountantReviewedBy": "accountant_user_002",
  "accountantReviewedAt": "2024-02-15 10:00:00",
  "controlledNarrative": true,
  "narrativeLockedAt": "2024-02-15 10:00:00",
  
  // Approval
  "approvedBy": "manager_user_003",
  "approvalDate": "2024-02-15 11:30:00",
  
  // Processing
  "processedAt": "2024-02-15 11:45:00",
  "processedBy": "system_auto_process",
  
  // Full Control Fields (All Filled by Accountant)
  "sourceType": "PAYROLL",
  "sourceId": "payroll_run_2024_feb",
  "sourceReference": "PR-2024-02-001",
  "bankAccountId": "bank_001",
  "budgetCode": "SALARY_2024_Q1",
  "budgetAllocationId": "budget_alloc_sal_001",
  "departmentId": "dept_finance",
  "coaCode": "4050",
  "coaName": "Salary & Wages",
  "gstRate": 0,
  "gstAmount": 0,
  "taxableAmount": 90000,
  "obligationType": "PAYROLL_TAX",
  "complianceCategory": "TAX",
  "riskFlag": "LOW",
  "impactOnCashFlow": -90000,
  "impactOnProfit": -90000,
  "impactOnTaxes": 0,
  "accountantNotes": "Verified against HR records, all deductions correct",
  "internalNarrative": "Feb 2024 salary for 50 employees, within budget...",
  "bankTransactionRef": "BT_PAYROLL_20240215_001",
  "reconciliationStatus": "PENDING",
  
  // Audit Trail
  "auditTrail": [
    { action: "CREATED", by: "user_5678", at: "09:00", stage: "ENTRY" },
    { action: "CONTROLLED", by: "accountant_002", at: "10:00", stage: "REVIEW" },
    { action: "APPROVED", by: "manager_003", at: "11:30", stage: "APPROVAL" },
    { action: "PROCESSED", by: "system", at: "11:45", stage: "RECORDING" }
  ]
}
```

---

## PART 6: QUICK REFERENCE - FIELD PROGRESSION

### What Gets Filled at Each Stage

**Stage 1 - User Entry (5 fields)**
```
✓ description
✓ amount
✓ isIncome (Revenue/Expense)
✓ date
✓ paymentMethod
```

**Stage 2 - Accountant Control (55+ fields)**
```
✓ sourceType, sourceId, sourceReference
✓ bankAccountId, bankTransactionRef
✓ coaCode, coaName, accountingType
✓ budgetCode, budgetAllocationId, departmentId
✓ gstRate, gstAmount, taxableAmount
✓ obligationType, complianceCategory, riskFlag
✓ impactOnCashFlow, impactOnProfit, impactOnTaxes
✓ accountantNotes, internalNarrative, externalNarrative
✓ workflowStage: ENTRY → REVIEW
✓ controlledNarrative: true
✓ narrativeLockedAt, narrativeLockedBy
✓ ... (All other control fields)
```

**Stage 3 - Manager Approval (No new fields)**
```
✓ approvedBy
✓ approvalDate
✓ approvalLevel
✓ status: PENDING_APPROVAL → APPROVED
```

**Stage 4 - Processing (3 fields)**
```
✓ workflowStage: APPROVED → RECORDED
✓ status: APPROVED → PROCESSED
✓ processedAt, processedBy
```

---

## PART 7: COMPLETE SCREEN FLOW NAVIGATION

```
User Navigation Path:
├─ /transactions/add
│  └─ User enters description, amount, type, date, payment method
│
├─ /transactions/{id}/review
│  └─ User sees "Awaiting Accountant Review"
│
├─ /accountant/dashboard
│  └─ Accountant sees queue of DRAFT transactions
│
├─ /accountant/transactions/{id}/control
│  └─ Accountant fills all 55+ fields
│  └─ Accountant fills narrative notes
│  └─ Accountant clicks "LOCK NARRATIVE"
│
├─ /approvals/transactions/{id}/review
│  └─ Manager sees locked details (read-only)
│  └─ Manager clicks APPROVE
│
├─ /transactions/{id}
│  └─ Transaction auto-processes
│  └─ All systems updated
│  └─ Status: PROCESSED
│
└─ /bank-reconciliation/
   └─ When bank statement arrives (Feb 20)
   └─ Transaction auto-matches & reconciles
```

---

## PART 8: KEY TAKEAWAYS FOR DEVELOPER

1. **Two-Stage Workflow is CRITICAL**
   - Stage 1 (User): 5 fields only, minimal input
   - Stage 2 (Accountant): All 55+ control fields, lock narrative
   - Manager: Approval only, no editing

2. **Single Source of Truth**
   - Every transaction has complete narrative
   - Every field decision is documented
   - Accountant "controls" the transaction story
   - Auditors can see the complete chain

3. **Ripple Effects Automatic**
   - Lock transaction → Budget updates
   - Approve transaction → Cash flow recalculates
   - Process transaction → P&L updates
   - Bank clears → Reconciliation auto-matches

4. **Complete Traceability**
   - Where it came from (sourceType)
   - Why it was recorded (narrative)
   - What it impacts (cash, profit, tax)
   - Who approved it (approval chain)

5. **All 38 New Fields Needed**
   - Complete this implementation exactly as specified
   - Every field serves a purpose in control narrative
   - No shortcuts - this is audit-trail design

---

This is the complete visual guide your developer needs to implement unified transaction control as the single source of truth for Ark Finance.
