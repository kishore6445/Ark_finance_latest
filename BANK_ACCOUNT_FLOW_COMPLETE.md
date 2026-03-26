# Bank Account Flow - Complete Business Logic Architecture

## Executive Summary

All money flows through the **Bank Account** as the central hub. This document shows how every business process connects to and depends on the bank account flow.

---

## Complete Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BANK ACCOUNT (Primary)                          │
│                     Current Balance: ₹5,00,000                           │
│                     Available: ₹4,50,000 (after commitments)             │
│                                                                          │
│  INFLOW ←──────────────────────────────────────────→ OUTFLOW            │
│  • Client Payments     ₹2,50,000/month              • Payroll ₹90K/mo   │
│  • Loans/Investment    ₹1,00,000/month              • Invoices ₹60K/mo  │
│  • Interest            ₹5,000/month                 • Taxes ₹15K/mo     │
│                                                     • Expenses ₹50K/mo  │
└─────────────────────────────────────────────────────────────────────────┘
         ↓                ↓                ↓                ↓
    ┌────────────────┬────────────────┬──────────────┬─────────────────┐
    │   PAYROLL      │    BUDGETS     │   INVOICES   │  TRANSACTIONS   │
    │   SYSTEM       │   MANAGEMENT   │   PAYMENTS   │  RECONCILIATION │
    └────────────────┴────────────────┴──────────────┴─────────────────┘
```

---

## 1. PAYROLL FLOW (Bank → Employees)

### Process Flow:
```
Step 1: Create Payroll Run
├─ Input: 50 employees, salaries ₹90,000 total
├─ Calculate: Gross + Allowances - Deductions
└─ Status: DRAFT

Step 2: Submit for Approval
├─ Amount Check: ₹90,000 < ₹1L → Manager Approval needed
├─ Route to: Department Manager
└─ Status: SUBMITTED

Step 3: Approval (Manager approves)
├─ Validation: Payroll integrity check
└─ Status: APPROVED (NOT YET PROCESSED TO BANK)

Step 4: Process to Bank (Critical Step!)
├─ Validate: Bank has ₹90,000 available
├─ Debit Bank: ₹90,000 (BANK TRANSACTION CREATED)
├─ Allocate: Employee 1 → ₹1,800, Employee 2 → ₹1,500, ...
├─ Update: Bank balance ₹5,00,000 → ₹4,10,000
└─ Status: PROCESSED

Step 5: Employee Payments
├─ NEFT: ₹50,000 to 25 employees (BANK TRANSFER)
├─ Cheque: ₹20,000 to 15 employees (PENDING CLEARING)
└─ Cash: ₹20,000 (IMMEDIATE)

Output:
├─ Bank Transaction ID: BT_20240315_001
├─ New Bank Balance: ₹4,10,000
├─ Payroll Status: PROCESSED
└─ Employee Records Updated
```

### Services Involved:
- **PayrollProcessingService**: calculateSalary(), createPayrollRun(), submitForApproval(), approvePayroll(), processPayrollToBank()
- **ApprovalChainService**: determineApprovalLevel() - Routes to Manager for ₹90K payroll
- **BankAccountFlowService**: processPayrollDebit() - Actual debit from bank
- **CashFlowManagementService**: getPendingPayrollCommitments() - Tracks payroll as a commitment

### Key Connections:
- Payroll is a **COMMITMENT** on bank account (reduces available balance)
- Cannot process payroll if available balance < total salary
- Every payroll creates a bank transaction (audit trail)
- Payroll history links to bank statements for reconciliation

---

## 2. BUDGET ALLOCATION FLOW (Bank → Departments)

### Process Flow:
```
Step 1: Create Budget from Bank
├─ Allocation: ₹5,00,000 bank balance → 5 departments
├─ Sales: ₹2,00,000
├─ Operations: ₹1,50,000
├─ Engineering: ₹1,00,000
├─ Admin: ₹50,000
└─ Reserve: ₹0 (will allocate after approvals)

Step 2: Bank Allocation
├─ Check: Bank available ≥ ₹5,00,000? YES
├─ Create: Budget records in each department
├─ Update: Available bank balance = Current balance (not reduced until spent!)
└─ Link: Each budget → Bank account

Step 3: Department Spending
├─ Sales records expense: ₹50,000 on advertising
├─ Approval: Expense approved by Sales Manager
├─ Debit: Sales budget now ₹1,50,000 (was ₹2,00,000)
├─ Link: Expense → Bank transaction (if paid immediately)
└─ Alert: Sales at 75% utilization

Step 4: Budget Tracking
├─ Daily: Sales spent ₹50K of ₹2,00K (25% used)
├─ Weekly: Track variance vs actual spend
├─ Monthly: Generate budget vs actual report
└─ Alert: If any department > 100% spent

Step 5: Reallocation (If needed)
├─ Operations used only ₹30K of ₹1,50K budgeted
├─ Reallocate: ₹50K from Operations → Sales
├─ Result: Sales now ₹2,50K, Operations ₹1,00K
└─ Bank impact: ZERO (already allocated)
```

### Services Involved:
- **BudgetManagementService**: createBudget(), recordExpense(), getBudgetVariance(), getBudgetForecast(), reallocateBudget()
- **BankAccountFlowService**: allocateFundsToBudgets() - Allocate from bank
- **ApprovalChainService**: Approves large budget allocations
- **CashFlowManagementService**: Tracks budget as part of commitments

### Key Connections:
- Budget is allocated FROM bank account (reduces available for other uses)
- Each department expense reduces their budget (but updates bank only when actually paid)
- Budgets can be reallocated between departments without affecting bank
- Unspent budget at end of month reverts to bank available balance

---

## 3. INVOICE PAYMENT FLOW (Bank → Vendors)

### Process Flow:
```
Step 1: Invoice Received
├─ Vendor: ABC Supplies
├─ Amount: ₹75,000
├─ Due Date: 15 days
└─ Status: AWAITING_PAYMENT

Step 2: Match to Delivery
├─ Invoice reconciliation: ₹75,000
├─ Check: Goods received? YES
└─ Status: VERIFIED

Step 3: Approval for Payment
├─ Amount Check: ₹75,000 < ₹1L → Auto-approve
├─ Validation: Vendor approved, invoice genuine
└─ Status: APPROVED_FOR_PAYMENT

Step 4: Process Payment
├─ Select: Bank transfer via NEFT
├─ Check: Bank available balance ≥ ₹75,000? YES
├─ Debit: Bank ₹5,00,000 → ₹4,25,000
├─ Create: Bank transaction BT_INV_20240315_001
├─ Send: Payment to vendor
└─ Status: PAYMENT_CLEARED

Step 5: Reconciliation
├─ Bank statement: Confirm ₹75,000 debit on 16th
├─ Invoice: Mark as PAID
├─ Match: Invoice payment ↔ Bank debit = ₹75,000 ✓
└─ Archive: Close invoice
```

### Services Involved:
- **InvoiceMatchingService**: matchPaymentToInvoice(), validateMatch(), recordPayment()
- **BankAccountFlowService**: processInvoicePayment() - Debit from bank
- **ApprovalChainService**: Approves payment if > amount threshold
- **BankReconciliationService**: Matches payment to bank statement
- **CashFlowManagementService**: Tracks invoice as pending commitment

### Key Connections:
- Invoice payment is a bank DEBIT (reduces available immediately)
- Links to vendor (for payment tracking)
- Links to bank transaction (for reconciliation)
- Reduces budget if expense is from departmental budget
- Updates cash flow forecasts

---

## 4. CASH FLOW TRACKING (Bank ↔ Forecasts ↔ Alerts)

### Real-time Dashboard:
```
BANK ACCOUNT SNAPSHOT
├─ Current Balance: ₹5,00,000
├─ Available Balance: ₹4,10,000
│   ├─ Committed to Payroll (pending): ₹90,000
│   └─ Committed to Budgets (allocated): ₹0 (already in budget categories)
│
├─ 30-Day Forecast: ₹4,80,000
│   ├─ Expected Inflow: ₹2,50,000 (client payments)
│   ├─ Expected Outflow: ₹2,15,000 (payroll ₹90K + expenses ₹75K + taxes ₹15K + invoices ₹35K)
│   └─ Net Flow: +₹35,000 (HEALTHY)
│
├─ Critical Dates (Next 30 Days):
│   ├─ 20th: Payroll ₹90,000 (CRITICAL)
│   ├─ 15th: Invoice Payment ₹75,000
│   ├─ 25th: Client Payment ₹2,00,000 (INCOME)
│   └─ 28th: GST Payment ₹15,000
│
├─ Health Status: HEALTHY
│   ├─ Liquidity Ratio: 2.1x (Available/Monthly Expenses)
│   ├─ Budget Utilization: 65%
│   ├─ Payroll Coverage: 4.5 months (Current / Monthly payroll)
│   └─ Forecast Confidence: 85%
│
└─ Alerts: NONE
```

### Services Involved:
- **CashFlowManagementService**: getCompleteCashFlowView(), projectCashFlow(), checkCashFlowAlerts(), getFinancialHealthScorecard()
- **BankAccountFlowService**: getCashFlowAnalysis() - Core bank analysis
- **PayrollProcessingService**: getPendingPayrollCommitments()
- **BudgetManagementService**: getOrganizationBudgetStatus()
- **FinancialCalculationsService**: P&L and statements for trend analysis

### Key Connections:
- All flows feed into cash flow analysis
- Alerts trigger when bank balance risks dropping below thresholds
- Forecasts help predict when additional funding needed
- Health scorecard summarizes everything for executives

---

## 5. RECONCILIATION FLOW (Bank ↔ Statements ↔ Verification)

### Process Flow:
```
Step 1: Import Bank Statement
├─ Format: CSV from bank
├─ Period: 1-31 March 2024
├─ Transactions: 145 lines
└─ Status: UPLOADED

Step 2: Parse Transactions
├─ Credit: ₹2,50,000 (Client payment on 5th)
├─ Debit: ₹90,000 (Payroll on 10th) - MATCHES our record? ✓
├─ Debit: ₹75,000 (Vendor payment on 15th) - MATCHES? ✓
├─ Debit: ₹15,000 (GST payment on 25th) - MATCHES? ✓
└─ Unmatched: ₹5,000 cheque still pending from 1st

Step 3: Match System Records to Bank Statement
├─ Our record: Payroll ₹90,000 on 10th
├─ Bank statement: Debit ₹90,000 on 10th
├─ Result: MATCHED ✓
│
├─ Our record: Cheque #1234 ₹5,000 issued 1st
├─ Bank statement: Not cleared yet (still pending)
├─ Result: OUTSTANDING ✓ (Wait for clearing)
│
└─ Analysis: 96 of 145 transactions matched

Step 4: Identify Discrepancies
├─ Bank shows: ₹35,000 debit on 12th (UNKNOWN)
├─ Investigation: Call bank → B2B platform error, will reverse
├─ Result: Mark as PENDING_CLARIFICATION
│
├─ Our record: Invoice payment ₹50,000 on 18th
├─ Bank statement: NO MATCHING ENTRY
├─ Result: Not yet cleared (scheduled transfer) - OUTSTANDING
│
└─ Summary: 3 discrepancies identified

Step 5: Final Reconciliation
├─ Bank Balance (Statement): ₹4,80,000
├─ System Balance: ₹4,80,000 (after adjustments)
├─ Match: ✓ RECONCILED
├─ Outstanding Items:
│   ├─ Cheque #1234: ₹5,000 (1 week old)
│   └─ Invoice payment: ₹50,000 (2 days old)
└─ Status: RECONCILIATION_COMPLETE
```

### Services Involved:
- **BankReconciliationService**: parseStatement(), matchTransactions(), identifyDiscrepancies(), completeReconciliation()
- **FinancialCalculationsService**: Verify balance equation
- **BankAccountFlowService**: validateFlowIntegrity()
- **ApprovalChainService**: Auto-approve reconciliation if < 5% discrepancies

### Key Connections:
- Every bank debit must have a matching system record
- Links transactions to source (payroll, invoice, expense)
- Identifies outstanding items (cheques, pending transfers)
- Validates bank balance matches system balance (financial control)

---

## 6. GST & COMPLIANCE FLOW (Bank ↔ Tax Tracking)

### Process Flow:
```
Step 1: Track GST on Transactions
├─ Sales Invoice: ₹1,00,000 + 18% GST = ₹1,18,000
│   └─ Output Tax: ₹18,000 (to be paid to govt)
│
├─ Purchase Invoice: ₹50,000 + 18% GST = ₹59,000
│   └─ Input Tax: ₹9,000 (to recover from govt)
│
└─ Other: 12%, 5%, 28% rates also tracked

Step 2: Calculate Quarterly Returns (GSTR-1, GSTR-2, GSTR-3B)
├─ Q1 (Jan-Mar):
│   ├─ Total Output Tax: ₹54,000 (all sales tax)
│   ├─ Total Input Tax: ₹27,000 (all purchase tax)
│   └─ Net Tax Payable: ₹27,000
│
├─ Due Date: 20th of April (GSTR-1 & GSTR-2)
│           31st of May (GSTR-3B payment due)
│
└─ Status: CALCULATED, READY_FOR_FILING

Step 3: Approve GST Payment
├─ Amount: ₹27,000 (Q1 payable)
├─ Approval Level: Auto-approve (< ₹1L)
└─ Status: APPROVED

Step 4: Process Bank Payment for GST
├─ Check: Bank available ≥ ₹27,000? YES
├─ Debit: Bank ₹5,00,000 → ₹4,73,000
├─ Create: Bank transaction BT_GST_Q1_2024
├─ Pay: Government tax account
└─ Status: PAYMENT_CLEARED

Step 5: Record GST Expense
├─ Profit & Loss: Record ₹27,000 as tax expense
├─ Cash Flow: ₹27,000 outflow accounted
└─ Filing: File GSTR-3B with government
```

### Services Involved:
- **GSTComplianceService**: calculateQuarterlyTax(), generateGSTReturns(), trackGSTRates(), getDueDate()
- **BankAccountFlowService**: processOutflow() for tax payment
- **ApprovalChainService**: Approves GST payment
- **FinancialCalculationsService**: Records tax expense in P&L

### Key Connections:
- GST is calculated from all transactions (Sales + Purchases)
- Tax payment is a bank debit (reduces available balance)
- Deadlines trigger alerts in cash flow
- Compliance record needed for audits

---

## Complete Data Model Flow

```
BANK ACCOUNT
├─ Receives: Income credits (client payments, loans, investment)
├─ Disbursements: All payments come from here
│
├─ Links to PAYROLL
│   ├─ Create payroll → Approval → Process to bank → Bank debit
│   ├─ Bank transaction created
│   └─ Updated cash flow forecasts
│
├─ Links to BUDGETS
│   ├─ Allocate funds to departments → Budget records created
│   ├─ Departments spend from budget → Reduces budget balance
│   ├─ Link to bank transaction when paid
│   └─ Variance tracking vs bank
│
├─ Links to INVOICES
│   ├─ Invoice received and approved
│   ├─ Matched to purchase order
│   ├─ Payment approved → Bank debit
│   ├─ Bank transaction created
│   └─ Reconciliation with bank statement
│
├─ Links to TRANSACTIONS
│   ├─ Every debit/credit is a transaction
│   ├─ Classified (auto or manual)
│   ├─ Linked to source (payroll, invoice, expense)
│   └─ Reconciled to bank statement
│
├─ Links to FINANCIAL STATEMENTS
│   ├─ All approved transactions feed P&L
│   ├─ Bank balance = Cash on hand
│   ├─ All expenses traced to bank
│   └─ Generated monthly/quarterly
│
└─ Links to CASH FLOW
    ├─ Current balance
    ├─ Available balance (after commitments)
    ├─ 30/90 day forecast
    ├─ Health alerts
    └─ Executive dashboard
```

---

## Key Business Rules

1. **No Money Without Bank Account**: Every financial transaction must have a bank account context
2. **Approval Before Bank Debit**: No money leaves bank without approval
3. **Balance Must Exist**: Cannot approve payroll if bank balance insufficient
4. **Commitment Tracking**: All pending outflows reduce "available balance"
5. **Reconciliation Required**: Bank statement must match system records monthly
6. **Audit Trail**: Every transaction links to source (payroll/invoice/expense)
7. **Real-time Forecast**: Cash flow updated continuously as transactions approved

---

## Testing Scenarios

### Scenario 1: Happy Path - Normal Month
```
Bank: ₹5,00,000
Income (5th): ₹2,50,000 → Bank: ₹7,50,000
Payroll (10th): -₹90,000 → Bank: ₹6,60,000
Invoices (15th-25th): -₹1,25,000 → Bank: ₹5,35,000
Taxes (28th): -₹25,000 → Bank: ₹5,10,000
Result: All flows normal, budget on track ✓
```

### Scenario 2: Liquidity Alert - Low Balance
```
Bank: ₹5,00,000
Payroll (1st): -₹90,000 → Bank: ₹4,10,000
Large Invoice (2nd): -₹3,50,000 → Bank: ₹60,000
Alert: CRITICAL - Bank below payroll requirement!
Action: Defer invoice payment, arrange working capital ✗
```

### Scenario 3: Budget Overrun - Department Exceeds
```
Sales Budget: ₹2,00,000
Spent (mid-month): ₹1,90,000 (95% utilization)
Alert: WARNING - Sales approaching budget limit
Request: Reallocate ₹50,000 from Operations
Result: Sales ₹2,50,000, Operations ₹1,50,000 → Proceed ✓
```

---

## API Integration Points

All services expose APIs at `/api/`:

- `/api/payroll/` - Create, approve, process payroll
- `/api/budgets/` - Create, track, reallocate budgets
- `/api/invoices/[id]/payment/` - Process invoice payments
- `/api/bank-account/` - Get balance, commitments, health
- `/api/cash-flow/` - Get forecasts, alerts, scorecard
- `/api/reconciliation/` - Upload statement, match transactions
- `/api/gst/` - Calculate, file, payment tracking
- `/api/transactions/` - Record, classify, audit trail

All APIs require:
- Organization context (organizationId)
- Bank account context (bankAccountId)
- User auth (userId, role)
- Approval validation for amounts > threshold

---

## Conclusion

**The Bank Account is the Source of Truth**

Every business decision flows through the bank account:
- Can't pay payroll if bank balance insufficient
- Can't allocate budget from empty bank
- Can't plan cash flow without bank commitments
- Can't file tax returns without reconciled transactions

This architecture ensures:
✓ Financial control (no money moves without approval)
✓ Visibility (complete real-time cash position)
✓ Compliance (audit trail for all transactions)
✓ Forecasting (predict liquidity needs ahead of time)
✓ Execution (automate routine flows like payroll)
