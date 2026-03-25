# Warrior Finance - Core Workflows & State Diagrams

## Workflow 1: Transaction to Financial Statement

**Description**: Complete flow from transaction entry to appearing in financial statements

### State Diagram
```
START
  ↓
[1] TRANSACTION CREATED
    - Date: 2024-02-15
    - Amount: ₹50,000
    - Type: Revenue from Sales
    - Status: DRAFT
  ↓
[2] AUTO-CLASSIFICATION
    - Keywords: "Sales" 
    - Matched to: Chart of Accounts 1010 (Sale of Goods)
    - Confidence: 95%
  ↓
[3] USER REVIEW
    - Accountant reviews classification
    - Confirms or changes Chart of Accounts
    - Adds GST split if applicable
    - Status: PENDING_APPROVAL (if amount > ₹10K)
    - Status: RECORDED (if amount < ₹10K)
  ↓
[4] APPROVAL CHAIN (if needed)
    - Manager reviews
    - Approves/Rejects
    - Status: APPROVED or REJECTED
  ↓
[5] FINANCIAL CALCULATION
    - System aggregates all APPROVED transactions by CoA
    - P&L = Revenue - COGS - Expenses
    - Balance Sheet updates
    - Cash Flow updates
  ↓
[6] REPORT GENERATION
    - Financial Statements updated in real-time
    - Shows in Schedule - P&L tab
    - Shows in Final Account tab
  ↓
END

Actors: Accountant → Manager → Auditor
Time: Real-time
Data Path: App State → Database → Back to Financial Statements
```

### Data Flow Details
```
Transaction Entry Form
    ↓
Input: Date, Amount, Description, Type
    ↓
Keyword Extraction
    ↓
CoA Mapping (50 accounts)
    ↓
Validation
    ├─ Valid? → Status = PENDING_APPROVAL
    └─ Invalid? → Status = NEEDS_INFO
    ↓
Approval Check
    ├─ Amount > ₹100K? → Requires Org Admin
    ├─ Amount ₹10K-100K? → Requires Manager
    └─ Amount < ₹10K? → Auto-recorded
    ↓
Aggregation Function
    ├─ Sum by CoA Code
    ├─ Filter by Date Range
    └─ Apply Accounting Formula
    ↓
P&L Statement
    ├─ Revenue: ₹X
    ├─ COGS: -₹Y
    ├─ Expenses: -₹Z
    └─ Net Profit: ₹(X-Y-Z)
```

---

## Workflow 2: Invoice to Payment Matching

**Description**: How invoices are created and matched to payments

### State Diagram
```
START
  ↓
[1] INVOICE CREATED
    - Invoice #INV-001
    - Party: ABC Corp
    - Amount: ₹1,00,000
    - Type: Expense (Bill from vendor)
    - Due Date: 2024-03-15
    - Status: UNPAID
  ↓
[2] RECORD TRANSACTION
    - Accountant enters payment transaction
    - Date: 2024-02-20
    - Amount: ₹1,00,000
    - Paid via: Bank Account
    - Type: Payment
  ↓
[3] MATCH INVOICE TO PAYMENT
    - System suggests matches (amount, date, party)
    - Accountant confirms match
    - Status: PARTIALLY_PAID or PAID
  ↓
[4] UPDATE BALANCE
    - Invoice.balanceDue = 0
    - Invoice.paidAmount = ₹1,00,000
    - Status: PAID
  ↓
[5] UPDATE TRANSACTION
    - Transaction.matchedInvoiceId = INV-001
    - Transaction.status = MATCHED
  ↓
[6] RECONCILE
    - Bank statement shows payment
    - Accountant marks as cleared
    - Status: RECONCILED
  ↓
[7] FINANCIAL IMPACT
    - Transaction appears in P&L
    - Updates Cash Flow
    - Updates Balance Sheet (Payables)
  ↓
END

Actors: Accountant, Bank statement
Time: Can span multiple days
Critical: Matching accuracy for audit trail
```

### Data States
```
Invoice States:
  UNPAID → PARTIAL → PAID → RECONCILED

Payment States:
  RECORDED → MATCHED → RECONCILED

Balance Due Calculation:
  balanceDue = invoiceAmount - paidAmount
  
Match Criteria:
  - Amount matches (or within tolerance)
  - Date within 5 days
  - Party name matches
  - Manual override allowed
```

---

## Workflow 3: Bank Reconciliation

**Description**: Monthly bank statement reconciliation

### State Diagram
```
START
  ↓
[1] DOWNLOAD BANK STATEMENT
    - From: Bank website / API
    - Format: CSV / PDF
    - Period: 2024-02-01 to 2024-02-29
    - Statement Date: 2024-02-29
    - Closing Balance: ₹5,50,000
  ↓
[2] PARSE STATEMENT
    - Extract transactions
    - Validate format
    - Create temp records
  ↓
[3] SYSTEM BALANCE CALCULATION
    - Opening Balance: ₹5,00,000
    - + Deposits: ₹1,00,000
    - - Withdrawals: ₹50,000
    - = System Balance: ₹5,50,000
  ↓
[4] MATCH TRANSACTIONS
    - Bank Transaction: Debit ₹25,000 (Feb 20)
    - System Transaction: Payment ₹25,000 (Feb 20)
    - Match Status: MATCHED
    
    [Unmatched]
    - Bank shows: Debit ₹500 (Feb 29) - Interest charged
    - System shows: Nothing
    - Match Status: NOT_IN_SYSTEM
  ↓
[5] IDENTIFY DISCREPANCIES
    - Unmatched amounts: ₹500
    - Timing differences: Check postdated items
    - Outstanding items: Cheques not yet cleared
  ↓
[6] ACCOUNTANT ACTION
    - Create journal entry for missing items
    - Add notes on timing differences
    - Confirm discrepancies acceptable
  ↓
[7] RECONCILIATION COMPLETE
    - Status: RECONCILED
    - Statement Balance = System Balance
    - Audit trail created
  ↓
[8] NEXT MONTH
    - Opening Balance = Previous Closing Balance
    - Repeat process
  ↓
END

Actors: Accountant (reconciliation), Bank (statement)
Time: Monthly, can take 2-4 hours
Critical: Accuracy, completeness
```

---

## Workflow 4: Approval Chain

**Description**: Multi-level transaction approval based on amount

### State Diagram
```
START
  ↓
TRANSACTION CREATED
  - Amount: ₹75,000
  - Type: Equipment Purchase
  - Status: PENDING_APPROVAL
  ↓
DETERMINE APPROVAL LEVEL
  ├─ Amount < ₹10,000? 
  │   └─ Auto-Approve → Status: RECORDED
  │
  ├─ Amount ₹10,001 - ₹1,00,000?
  │   └─ Requires: Manager Approval
  │       ├─ Manager Reviews
  │       ├─ Approves? → Status: APPROVED
  │       └─ Rejects? → Status: REJECTED (Notify Accountant)
  │
  ├─ Amount > ₹1,00,000?
  │   └─ Requires: Org Admin Approval
  │       ├─ Org Admin Reviews
  │       ├─ Approves? → Check if needs Auditor
  │       └─ Rejects? → Status: REJECTED
  │
  └─ Critical Transactions (Payroll, Legal)?
      └─ Requires: Org Admin + Auditor
          ├─ Both Approve? → Status: APPROVED
          └─ Either Rejects? → Status: REJECTED

[In our case: ₹75,000]
  ↓
MANAGER APPROVAL QUEUE
  - Manager sees notification
  - Reviews transaction details
  - Attachment: Invoice PDF
  - Verification: GST, Account code correct
  ↓
MANAGER DECISION
  Option 1: APPROVE
  - Sets status: APPROVED
  - Adds comment: "Approved - Matches budget"
  - Timestamp: 2024-02-15 10:30 AM
  
  Option 2: REJECT
  - Sets status: REJECTED
  - Adds comment: "Need additional approval"
  - Notifies: Accountant
  - Resets to: PENDING_INFO
  
  Option 3: REQUEST_CHANGES
  - Sets status: PENDING_INFO
  - Request: "Verify supplier invoice"
  - Notifies: Accountant
  ↓
IF APPROVED
  - Transaction appears in reports
  - Included in Financial Statements
  - Included in Budget variance calculations
  ↓
AUDIT TRAIL
  - WHO: Manager ID + Name
  - WHAT: Approved transaction ID
  - WHEN: Timestamp
  - WHY: Reason/Comment
  - BEFORE: Previous status
  - AFTER: Current status
  ↓
END

Key Timeouts:
  - Manager: 24 hours to review
  - Org Admin: 12 hours to review
  - Alert: After 12 hours pending
  - Auto-escalate: After 48 hours pending
```

---

## Workflow 5: Monthly Financial Closing

**Description**: Close books for a month and generate financial statements

### State Diagram
```
START (Month End: Feb 29, 2024)
  ↓
[1] PREPARATION
    - Verify all transactions recorded
    - Ensure all invoices matched
    - Complete bank reconciliation
    - Resolve outstanding items
  ↓
[2] REVIEW CHECKLIST
    - All transactions approved? ✓
    - All invoices matched? ✓
    - All accruals recorded? ✓
    - All adjustments made? ✓
    - GST return ready? ✓
  ↓
[3] GENERATE STATEMENTS
    - Locked: Feb 1 - Feb 29
    - Aggregates all APPROVED transactions
    - Calculates P&L
    - Generates Balance Sheet
    - Generates Cash Flow
    - Generates Tax Returns (GST, TDS)
  ↓
[4] ACCOUNTANT REVIEW
    - Reviews all statements
    - Compares with budget
    - Notes discrepancies
    - Adds footnotes
    - Status: REVIEWED_BY_ACCOUNTANT
  ↓
[5] MANAGER APPROVAL
    - Reviews statements
    - Approves or requests changes
    - Status: APPROVED_BY_MANAGER
  ↓
[6] AUDITOR SIGN-OFF
    - Auditor reviews all transactions
    - Verifies accuracy
    - Checks compliance
    - Adds audit notes
    - Status: AUDITOR_SIGN_OFF
  ↓
[7] LOCK PERIOD
    - Period locked for editing
    - Read-only mode for all
    - Exception: Only Org Admin can unlock
    - Audit log records unlock
  ↓
[8] PUBLISH REPORTS
    - Generate PDF reports
    - Archive data
    - Notify stakeholders
    - Store in compliance folder
  ↓
[9] NEXT MONTH BEGINS
    - Opening balance = Previous closing balance
    - Period counter resets
    - New transactions can start
  ↓
END

Duration: 1-2 days
Actors: Accountant → Manager → Auditor
Critical: Data accuracy, compliance
```

---

## Workflow 6: Budget vs Actual

**Description**: Track spending against budget

### State Diagram
```
START (Year: 2024)
  ↓
[1] SET BUDGET
    - Manager sets budget per category
    - Category: Salaries → ₹12,00,000/year (₹1,00,000/month)
    - Category: Rent → ₹6,00,000/year (₹50,000/month)
    - Category: Marketing → ₹3,00,000/year (₹25,000/month)
  ↓
[2] TRACK SPENDING
    - Feb Salary Recorded: ₹95,000
    - Budget: ₹1,00,000
    - Variance: -₹5,000 (5% under budget)
  ↓
[3] CALCULATE METRICS
    - Amount Spent: ₹95,000
    - Budget: ₹1,00,000
    - Remaining: ₹5,000
    - % Used: 95%
    - Status: ON_TRACK
    
    If Spent = ₹1,20,000
    - Remaining: -₹20,000 (OVER BUDGET!)
    - % Used: 120%
    - Status: OVERSPENT
    - Alert: BUDGET_EXCEEDED
  ↓
[4] ALERTS
    - 50% spent? → Info
    - 75% spent? → Warning
    - 90% spent? → Alert
    - 100% spent? → Overspent (Red)
  ↓
[5] MANAGER REVIEW
    - See budget vs actual dashboard
    - Identify overages
    - Take corrective action
    - Adjust future budget if needed
  ↓
[6] YEAR-END ANALYSIS
    - Compare actual vs budget
    - Calculate variance percentage
    - Identify trends
    - Plan next year's budget
  ↓
END

Formula:
  Variance = Budget - Actual
  % Variance = (Variance / Budget) × 100
  Status = "On Track" if ±10% variance
```

---

## Workflow 7: GST Compliance

**Description**: Track GST and generate GST returns

### State Diagram
```
START
  ↓
[1] CLASSIFY TRANSACTIONS
    - Input GST rate: 5%, 12%, 18%, 28%
    - Calculate: GSTAmount = (Amount × Rate) / 100
    - Taxable Amount = Amount - GST
    - Exempt Amount = 0
  ↓
[2] TRANSACTION EXAMPLE
    - Sale: ₹11,800 (18% GST included)
    - Taxable: ₹10,000
    - GST: ₹1,800 (Output Tax)
    
    - Purchase: ₹1,180 (18% GST included)
    - Taxable: ₹1,000
    - GST: ₹180 (Input Tax/ITC)
  ↓
[3] GST RETURN CALCULATION
    - Output Tax (Sales): ₹1,800
    - Input Tax (Purchases): -₹180
    - Net GST Due: ₹1,620
    - Filing Deadline: 20th of next month
  ↓
[4] QUARTERLY RECONCILIATION
    - Q1 (Jan-Mar): ₹4,860 due
    - Q2 (Apr-Jun): ₹5,200 due
    - Q3 (Jul-Sep): ₹4,500 due
    - Q4 (Oct-Dec): ₹6,100 due
  ↓
[5] GENERATE GST RETURN
    - GSTR-1 (B2B Sales): ₹10,000
    - GSTR-2 (B2B Purchases): -₹1,000
    - GSTR-3B (Summary): ₹1,620 due
  ↓
[6] FILE WITH AUTHORITIES
    - Export return data
    - Verify with GST portal
    - File electronically
    - Receive confirmation
  ↓
[7] PAYMENT
    - Generate challan
    - Pay to government
    - Record payment
    - Update status: PAID
  ↓
END

Actors: Accountant (entry), System (calculation), Org Admin (filing)
Time: Monthly filing, quarterly payment
Critical: Accuracy for compliance
```

---

## Workflow 8: User Invitation & Onboarding

**Description**: Add team members to organization

### State Diagram
```
START
  ↓
[1] ORG ADMIN INITIATES
    - Email: accountant@company.com
    - Role: Accountant
    - Department: Finance
    - Start Date: 2024-03-01
  ↓
[2] SYSTEM SENDS INVITATION
    - Generate unique link
    - Email with instructions
    - Subject: "You've been invited to Warrior Finance"
    - Link expires in: 7 days
  ↓
[3] USER RECEIVES EMAIL
    - Click invitation link
    - Land on: Welcome page
    - Enter: Name, Password
    - Accept: Terms & Conditions
  ↓
[4] USER ACCOUNT CREATED
    - ID: user_001
    - Email: accountant@company.com
    - Organization: Acme Corp
    - Role: Accountant
    - Status: ACTIVE
  ↓
[5] SYSTEM SETUP
    - Initialize user preferences
    - Set timezone from organization
    - Set language: English (India)
    - Set currency: INR
  ↓
[6] ROLE PERMISSIONS ASSIGNED
    - Accountant can:
      ✓ Create transactions
      ✓ Create invoices
      ✓ Reconcile accounts
      ✗ Approve transactions
      ✗ Change organization settings
  ↓
[7] ONBOARDING FLOW
    - Welcome tour
    - Key features explained
    - First transaction demo
    - Shortcuts tutorial
  ↓
[8] ACTIVE IN ORGANIZATION
    - Appears in team list
    - Can access all assigned screens
    - Activities logged in audit trail
    - Notifications enabled
  ↓
[9] ONGOING
    - Daily work in system
    - Manager can see activity
    - Org Admin can change role
    - Org Admin can deactivate
  ↓
END

Email: "Welcome to Warrior Finance! 
You have been invited as Accountant for Acme Corp.
Click here to activate your account: [link]
Link expires in 7 days."
```
