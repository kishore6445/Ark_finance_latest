# Warrior Finance - Complete Data Flow Diagrams

## Data Flow 1: Transaction Entry to P&L Statement

### High-Level Flow
```
USER INPUT
    ↓
[Accountant enters transaction]
  Date: 2024-02-15
  Amount: ₹50,000
  Type: Sales
  Description: "Invoice #001 from ABC Corp"
    ↓
PROCESSING LAYER
    ├─ Keyword Extraction
    │   └─ Extract keywords: ["Sales", "ABC Corp", "Invoice"]
    │
    ├─ Chart of Accounts Mapping
    │   ├─ Keyword "Sales" found → Account Code 1010
    │   ├─ Keyword "Invoice" found → Account 7030 (Receivable)
    │   └─ Best Match: 1010 (Sale of Goods)
    │
    ├─ Validation
    │   ├─ Amount > 0? YES
    │   ├─ Date valid? YES
    │   ├─ Type selected? YES
    │   └─ Status: VALID
    │
    └─ Classification
        └─ Category: Revenue from Operations
           Account: 1010
           Taxable: ₹50,000
           GST (18%): ₹9,000
    ↓
DATA STORAGE
    ├─ Save to App State
    │   transactions: [{
    │     id: "txn_001",
    │     organizationId: "org_001",
    │     date: "2024-02-15",
    │     amount: 50000,
    │     accountCode: "1010",
    │     status: "PENDING_APPROVAL",
    │     gstSplit: { taxable: 50000, gst: 9000 }
    │   }]
    │
    └─ Database
        └─ INSERT INTO transactions (...)
    ↓
AGGREGATION LAYER
    ├─ Filter transactions for date range
    │   └─ DateRange: Feb 1 - Feb 29, 2024
    │      Find all APPROVED transactions
    │      Count: 47 transactions
    │
    ├─ Group by Chart of Accounts
    │   Account 1010 (Sales): [Txn1: ₹50K, Txn2: ₹30K, Txn3: ₹45K]
    │   Account 3010 (Salaries): [Txn4: ₹60K, Txn5: ₹60K]
    │   Account 5010 (Power): [Txn6: ₹5K]
    │
    └─ Sum by Account
        Account 1010: ₹125,000
        Account 3010: ₹120,000
        Account 5010: ₹5,000
    ↓
CALCULATION LAYER
    ├─ P&L Calculation
    │   Revenue from Operations (1010+1020+1030): ₹125,000
    │   Cost of Materials (2010+2020+...): -₹40,000
    │   Gross Profit: ₹85,000
    │   Employee Benefits (3010+3020+...): -₹120,000
    │   Depreciation (4010+4020+...): -₹5,000
    │   Other Expenses (5010+5020+...): -₹8,000
    │   ───────────────────────────
    │   EBIT: -₹48,000
    │   Finance Costs: -₹500
    │   ───────────────────────────
    │   Profit Before Tax: -₹48,500
    │   Tax (30%): ₹14,550 (refund as loss)
    │   ───────────────────────────
    │   Net Profit: -₹33,950
    │
    ├─ Balance Sheet Calculation
    │   Assets:
    │     Cash: ₹5,50,000 (from bank account balance)
    │     Receivables: ₹45,000 (unpaid invoices)
    │     Inventory: ₹20,000 (CoA 7020)
    │     Fixed Assets: ₹2,00,000 (CoA 7050)
    │   ───────────────────────────
    │   Total Assets: ₹8,15,000
    │
    │   Liabilities:
    │     Payables: ₹35,000 (unpaid bills)
    │     Short-term Loans: ₹1,00,000
    │   ───────────────────────────
    │   Total Liabilities: ₹1,35,000
    │
    │   Equity:
    │     Share Capital: ₹5,00,000
    │     Retained Earnings: ₹1,80,000
    │   ───────────────────────────
    │   Total Equity: ₹6,80,000
    │
    │   Verification: Assets = Liabilities + Equity
    │   ₹8,15,000 = ₹1,35,000 + ₹6,80,000 ✓
    │
    └─ Cash Flow Calculation
        Operating Activities:
          Net Profit: -₹33,950
          Depreciation: +₹5,000
          Increase in Receivables: -₹10,000
          Increase in Payables: +₹5,000
        ───────────────────────────
        Net Operating Cash Flow: -₹33,950
    ↓
DISPLAY LAYER
    ├─ Update Financial Statements Screen
    │   ├─ Schedule - P&L tab
    │   │   Shows all line items with calculated values
    │   │
    │   ├─ Final Account tab
    │   │   Shows Balance Sheet
    │   │
    │   └─ Cash Flow tab
    │       Shows Cash Flow Statement
    │
    └─ Real-time Updates
        ├─ Dashboard: P&L Summary
        ├─ Snapshot: Financial metrics
        └─ Reports: Updated totals
    ↓
END

Real-time: Transaction recorded → P&L updates in <100ms
Audit Trail: All steps logged with user, timestamp, values
```

---

## Data Flow 2: Invoice to Payment Matching

### Detailed Flow with Data Structure
```
STEP 1: INVOICE CREATED
    ├─ Input
    │   Invoice#: INV-2024-001
    │   Party: ABC Corp Private Limited
    │   Type: Expense (Vendor Bill)
    │   Amount: ₹1,00,000
    │   GST: ₹18,000 (18%)
    │   Total: ₹1,18,000
    │   Due Date: 2024-03-15
    │
    └─ Stored as
        {
          id: "inv_001",
          organizationId: "org_001",
          invoiceNo: "INV-2024-001",
          partyName: "ABC Corp Private Limited",
          type: "Expense",
          invoiceAmount: 100000,
          paidAmount: 0,
          balanceDue: 100000,
          dueDate: "2024-03-15",
          status: "UNPAID",
          createdDate: "2024-02-15",
          gstAmount: 18000
        }
    ↓
STEP 2: PAYMENT RECORDED
    ├─ Input (from Bank Statement or Manual Entry)
    │   Date: 2024-02-20
    │   Amount: ₹1,18,000 (including GST)
    │   From: Acme Corp Savings Account
    │   To: ABC Corp
    │   Reference: Check #12345
    │   Type: Payment
    │
    └─ Stored as Transaction
        {
          id: "txn_002",
          organizationId: "org_001",
          date: "2024-02-20",
          description: "Payment to ABC Corp - Vendor Bill",
          amount: 118000,
          isIncome: false,
          accountingType: "Expense",
          subtype: "Payment",
          invoice: "INV-2024-001",
          status: "RECORDED",
          matchedInvoiceId: null,
          allocationStatus: "Unallocated"
        }
    ↓
STEP 3: AUTO-MATCH SUGGESTION
    ├─ System Algorithm
    │   FOR each invoice
    │   FOR each unmatched transaction
    │   
    │   IF (transaction.amount == invoice.total AND
    │       transaction.date >= invoice.createdDate AND
    │       party name similar AND
    │       time delta <= 5 days)
    │   THEN suggest match with confidence score
    │
    ├─ Matching Candidates
    │   Invoice INV-2024-001 (₹1,18,000)
    │   Transaction 2024-02-20 (₹1,18,000)
    │   Confidence: 98%
    │   Reason: Exact amount match, 5 days gap, party match
    │
    └─ Suggested Match
        Match Type: FULL_MATCH
        Confidence: 98%
        Status: AWAITING_CONFIRMATION
    ↓
STEP 4: ACCOUNTANT CONFIRMS MATCH
    ├─ User Action
    │   Accountant reviews suggestion
    │   Verifies against invoice PDF
    │   Confirms: YES, this matches
    │
    └─ System Updates
        Invoice.matchedTransactionId = "txn_002"
        Invoice.paidAmount = 118000
        Invoice.balanceDue = 0
        Invoice.status = "PAID"
        
        Transaction.matchedInvoiceId = "inv_001"
        Transaction.status = "MATCHED"
        Transaction.allocationStatus = "Allocated"
    ↓
STEP 5: PARTIAL PAYMENT SCENARIO
    ├─ If Payment < Invoice Amount
    │   Invoice: ₹1,18,000
    │   Payment 1: ₹60,000 (2024-02-20)
    │   Remaining: ₹58,000
    │
    │   System Updates:
    │   Invoice.paidAmount = 60000
    │   Invoice.balanceDue = 58000
    │   Invoice.status = "PARTIAL"
    │   
    │   Payment 2: ₹58,000 (2024-03-05)
    │   Invoice.paidAmount = 118000
    │   Invoice.balanceDue = 0
    │   Invoice.status = "PAID"
    │
    └─ Financial Impact
        Transaction 1: Expense (₹60K) - included in P&L
        Transaction 2: Expense (₹58K) - included in P&L
        Total Expense recorded: ₹1,18,000
    ↓
STEP 6: RECONCILIATION
    ├─ Bank Statement Check
    │   Bank shows: Debit ₹1,18,000 (2024-02-20)
    │   System shows: Transaction ₹1,18,000 (2024-02-20)
    │   Status: CLEARED (matched to bank statement)
    │
    └─ Final Status
        Invoice: PAID + RECONCILED
        Transaction: MATCHED + RECONCILED
        Balance Sheet: Payables reduced by ₹1,18,000
    ↓
STEP 7: AUDIT TRAIL
    ├─ Log Entry 1
    │   {
    │     action: "INVOICE_CREATED",
    │     user: "Accountant (Raj)",
    │     timestamp: "2024-02-15 09:30",
    │     entity: "inv_001",
    │     changes: { status: "UNPAID", amount: 1000000 }
    │   }
    │
    ├─ Log Entry 2
    │   {
    │     action: "TRANSACTION_RECORDED",
    │     user: "Accountant (Raj)",
    │     timestamp: "2024-02-20 10:15",
    │     entity: "txn_002",
    │     changes: { status: "RECORDED", amount: 118000 }
    │   }
    │
    ├─ Log Entry 3
    │   {
    │     action: "INVOICE_MATCHED",
    │     user: "Accountant (Raj)",
    │     timestamp: "2024-02-20 10:45",
    │     entity: "inv_001",
    │     changes: {
    │       status: "UNPAID" → "PAID",
    │       matchedTransactionId: null → "txn_002"
    │     }
    │   }
    │
    └─ Compliance: Complete history for audit
    ↓
END

Data Consistency: All linked records updated atomically
Impact: P&L and Balance Sheet auto-updated on match
```

---

## Data Flow 3: Approval Chain

### State Machine with Data
```
TRIGGER: Transaction > ₹10,000
    ↓
TRANSACTION CREATED
    {
      id: "txn_003",
      amount: 75000,
      status: "PENDING_APPROVAL",
      requiresApproval: true,
      approvalLevel: "MANAGER",
      approvedBy: null,
      createdAt: "2024-02-15 09:00",
      createdBy: "accountant_001"
    }
    ↓
ROUTE TO APPROVAL QUEUE
    ├─ Amount ₹75,000 falls in: ₹10K - ₹100K range
    ├─ Required Approver: Manager
    ├─ Approver: Raj (Manager)
    ├─ Notification sent to Raj's email
    └─ Appears in Raj's approval queue
    ↓
MANAGER SEES APPROVAL REQUEST
    ├─ Screen: Approvals
    │   ├─ Status: PENDING_APPROVAL
    │   ├─ Amount: ₹75,000
    │   ├─ Description: Equipment Purchase
    │   ├─ Invoice Attached: Yes
    │   ├─ Created by: Accountant (Raj)
    │   ├─ Created date: 2024-02-15
    │   └─ Created time: 09:00
    │
    └─ Manager Reviews
        ├─ Check: Is budget available? YES (₹80K allocated)
        ├─ Check: Is vendor valid? YES (approved vendor list)
        ├─ Check: Is CoA correct? YES (1050 - Equipment)
        ├─ Check: Is GST split correct? YES (18%)
        └─ Decision: APPROVE
    ↓
MANAGER APPROVES
    ├─ Update Transaction
    │   {
    │     status: "APPROVED",
    │     approvalLevel: "MANAGER",
    │     approvedBy: "manager_001",
    │     approvalComment: "Approved - within budget, vendor verified",
    │     approvalDate: "2024-02-15 14:30",
    │     approvalTime: 345 minutes (from creation)
    │   }
    │
    ├─ Create Audit Log
    │   {
    │     action: "TRANSACTION_APPROVED",
    │     actor: "Raj (Manager)",
    │     timestamp: "2024-02-15 14:30",
    │     transactionId: "txn_003",
    │     approvalLevel: "MANAGER",
    │     amount: 75000,
    │     comment: "Approved - within budget"
    │   }
    │
    ├─ Notify Accountant
    │   Email: "Your transaction #txn_003 (₹75,000) has been approved!"
    │
    └─ Update Financial Statements
        Include transaction in P&L calculations
        Include in balance sheet (Fixed Assets)
    ↓
ALTERNATIVE: MANAGER REJECTS
    ├─ Update Transaction
    │   {
    │     status: "REJECTED",
    │     approvalLevel: "MANAGER",
    │     approvedBy: "manager_001",
    │     rejectionReason: "Need additional vendor quote",
    │     approvalDate: "2024-02-15 14:30"
    │   }
    │
    ├─ Notify Accountant
    │   Email: "Your transaction #txn_003 needs revision"
    │   Reason: "Need additional vendor quote"
    │
    └─ Transaction Status
        Reverts to: NEEDS_INFO
        Can be re-submitted after changes
    ↓
ALTERNATIVE: MANAGER REQUESTS INFO
    ├─ Update Transaction
    │   {
    │     status: "PENDING_INFO",
    │     approvalLevel: "MANAGER",
    │     infoRequested: [
    │       "Provide three vendor quotes",
    │       "Verify warranty period",
    │       "Confirm ROI analysis"
    │     ]
    │   }
    │
    ├─ Notify Accountant
    │   Email: "Additional information needed for transaction #txn_003"
    │
    └─ Accountant Provides Info
        Updates transaction
        Re-submits
        Goes back to Manager queue
    ↓
HIGH AMOUNT SCENARIO (> ₹100K)
    ├─ If Amount: ₹5,50,000
    │
    ├─ Manager Approves First (same process)
    │   Status: "PENDING_ADMIN_APPROVAL"
    │
    ├─ Then Appears in Org Admin Queue
    │   Org Admin: CEO reviews
    │   Decides: APPROVE/REJECT/REQUEST_INFO
    │
    └─ After Org Admin Approves
        Status: "APPROVED"
        Included in Financial Statements
        Available for execution
    ↓
END

Timeout Rules:
  - No approval within 24 hrs: Send reminder
  - No approval within 48 hrs: Escalate to Org Admin
  - No approval within 72 hrs: Auto-approve (configurable)

Performance: Approval within 1-3 hours typical
```

---

## Data Flow 4: Bank Reconciliation Process

### Detailed Flow with Data Matching
```
STEP 1: ACCOUNTANT INITIATES
    ├─ Goes to: Bank Reconciliation Screen
    ├─ Selects: February 2024
    ├─ Bank Selected: Acme Corp Savings Account
    └─ Previous Month Reconciled: YES (Closing: ₹5,50,000)
    ↓
STEP 2: SYSTEM PREPARES
    ├─ Opening Balance
    │   └─ ₹5,50,000 (Previous month closing)
    │
    ├─ Fetch System Transactions (Feb 1-29)
    │   ├─ Deposits: [₹50K, ₹30K, ₹20K]
    │   ├─ Withdrawals: [-₹15K, -₹10K, -₹25K, -₹10K]
    │   ├─ Cheques: [-₹5K pending]
    │   └─ Total: ₹85K
    │
    └─ Calculated System Balance
        = Opening (₹5,50K) + Deposits (₹1,00K) - Withdrawals (₹60K)
        = ₹5,90,000
    ↓
STEP 3: UPLOAD BANK STATEMENT
    ├─ File: Feb 2024 statement (CSV)
    │   Bank: HDFC Bank
    │   Account: 00123456789
    │   Statement Date: 2024-02-29
    │   Closing Balance: ₹5,85,000
    │
    ├─ Parse CSV
    │   Date | Debit | Credit | Description | Balance
    │   2024-02-01 | - | 50,000 | Deposit | 600,000
    │   2024-02-05 | 15,000 | - | ATM Withdrawal | 585,000
    │   2024-02-10 | - | 30,000 | Client Payment | 615,000
    │   2024-02-15 | 10,000 | - | Rent Payment | 605,000
    │   2024-02-20 | - | 20,000 | Sales Invoice | 625,000
    │   2024-02-25 | 25,000 | - | Vendor Payment | 600,000
    │   2024-02-28 | 10,000 | - | Salary | 590,000
    │   2024-02-29 | 500 | - | Bank Charges | 585,000
    │
    └─ Bank Statement Balance: ₹5,85,000
    ↓
STEP 4: MATCH TRANSACTIONS
    ├─ System knows about:
    │   Deposit 2024-02-01: ₹50,000
    │   Withdrawal 2024-02-05: ₹15,000
    │   Deposit 2024-02-10: ₹30,000
    │   Withdrawal 2024-02-15: ₹10,000
    │   Deposit 2024-02-20: ₹20,000
    │   Withdrawal 2024-02-25: ₹25,000
    │   Withdrawal 2024-02-28: ₹10,000
    │
    ├─ Matching Algorithm (Smart Matching)
    │   FOR each bank transaction:
    │     FIND matching system transaction
    │     BY: Amount, Date (±3 days), Description similarity
    │
    │   Match Results:
    │   Bank Deposit 50K (Feb 1) = System Deposit 50K ✓ MATCHED
    │   Bank Debit 15K (Feb 5) = System Debit 15K ✓ MATCHED
    │   Bank Credit 30K (Feb 10) = System Credit 30K ✓ MATCHED
    │   Bank Debit 10K (Feb 15) = System Debit 10K ✓ MATCHED
    │   Bank Credit 20K (Feb 20) = System Credit 20K ✓ MATCHED
    │   Bank Debit 25K (Feb 25) = System Debit 25K ✓ MATCHED
    │   Bank Debit 10K (Feb 28) = System Debit 10K ✓ MATCHED
    │   Bank Debit 500 (Feb 29) = ??? NOT IN SYSTEM ✗
    │
    └─ Discrepancy Found
        Bank shows: ₹500 charges (Feb 29)
        System shows: Nothing
        Status: NOT_IN_SYSTEM
    ↓
STEP 5: IDENTIFY RECONCILING ITEMS
    ├─ Matched Items
    │   Total: 7 transactions matched
    │   Amount: ₹1,35,000
    │   Status: RECONCILED
    │
    ├─ Unmatched in System
    │   Bank Charge: ₹500 (not yet recorded)
    │   Status: NEEDS_ENTRY
    │
    └─ Unmatched in Bank
        Cheque Pending: ₹5,000 (post-dated cheque)
        Status: OUTSTANDING
    ↓
STEP 6: RECONCILIATION CALCULATION
    ├─ System Balance
    │   Opening: ₹5,50,000
    │   + Matched Deposits: ₹1,00,000
    │   - Matched Withdrawals: ₹60,000
    │   = Subtotal: ₹5,90,000
    │   - Outstanding Cheque: ₹5,000
    │   = Adjusted System: ₹5,85,000
    │
    ├─ Bank Balance
    │   Closing: ₹5,85,000
    │
    ├─ Variance
    │   Bank: ₹5,85,000
    │   System: ₹5,85,000
    │   Difference: ₹0 ✓ MATCHED!
    │
    └─ Reconciliation Status: BALANCED
    ↓
STEP 7: ACCOUNTANT ACTION
    ├─ Review Discrepancies
    │   Bank Charge ₹500: Confirmed as interest charge
    │   Action: Create journal entry
    │   
    │   Entry:
    │   Debit: Interest Expense (5110): ₹500
    │   Credit: Bank Account: ₹500
    │
    ├─ Outstanding Cheque
    │   Cheque #12345: ₹5,000 (dated Feb 28, may clear March)
    │   Status: OUTSTANDING
    │   Action: Noted (will track next month)
    │
    └─ Add Notes
        "Reconciliation completed successfully"
        "All items matched"
        "1 outstanding cheque pending"
    ↓
STEP 8: MARK RECONCILED
    ├─ Bank Reconciliation Record
    │   {
    │     id: "recon_001",
    │     organizationId: "org_001",
    │     month: "2024-02",
    │     bankAccount: "Acme Savings",
    │     openingBalance: 550000,
    │     closingBalance: 585000,
    │     systemBalance: 585000,
    │     bankBalance: 585000,
    │     variance: 0,
    │     status: "RECONCILED",
    │     reconciliedBy: "accountant_001",
    │     reconciliedDate: "2024-03-05",
    │     notes: "Clean reconciliation, 1 outstanding cheque"
    │   }
    │
    └─ System Updates
        Transaction: Bank Charge recorded
        P&L: Interest Expense increased by ₹500
        Balance Sheet: Bank Account: ₹5,85,000
        Status: READY FOR NEXT MONTH
    ↓
END

Reconciliation Success Rate: 98% automatic matching
Manual Review Time: 15-20 minutes
Accuracy: 100% (system = bank)
```
