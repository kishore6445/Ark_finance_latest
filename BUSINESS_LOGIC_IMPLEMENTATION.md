# Ark Finance - Business Logic Implementation

## Overview

This document provides a complete guide to the business logic services and API endpoints implemented for Ark Finance. All business logic is implemented in TypeScript services with full type safety and comprehensive error handling.

---

## Services Overview

### 1. Approval Chain Service
**File:** `services/approval-chain.service.ts`

Implements amount-based approval routing with multi-level validation.

**Key Functions:**
- `determineApprovalLevel(amount, transactionType)` - Calculates required approval path
  - < ₹10K: Auto-approve
  - ₹10K-₹1L: Manager approval required
  - > ₹1L: Admin approval required
  - Critical types: Admin + Auditor approval

- `createApprovalRequest(transaction, createdBy)` - Creates approval records
- `processApprovalDecision(approvalId, decision, approverUserId, approverRole, comment)` - Handles approvals
- `checkApprovalStatus(transactionId)` - Validates if transaction is approved
- `getApprovalQueue(organizationId, approverRole, userId)` - Gets pending approvals
- `canApprove(userRole, requiredLevel)` - Permission validation

**Usage Example:**
```typescript
import { approvalChainService } from '@/services/approval-chain.service';

const approvalLevel = approvalChainService.determineApprovalLevel(
  75000,  // amount
  'Expense'  // transactionType
); // Returns: 'MANAGER'

const approval = await approvalChainService.createApprovalRequest(
  transaction,
  userId
);
```

---

### 2. Financial Calculations Service
**File:** `services/financial-calculations.service.ts`

Aggregates approved transactions to generate financial statements.

**Key Functions:**
- `calculatePnL(organizationId, startDate, endDate, transactions)` - P&L Statement
  - Returns: revenue, COGS, expenses, netProfit, byCoA breakdown
  - Only includes APPROVED transactions

- `calculateBalanceSheet(organizationId, asOfDate, transactions)` - Balance Sheet
  - Returns: assets, liabilities, equity (Assets = Liabilities + Equity)

- `calculateCashFlow(organizationId, startDate, endDate, transactions)` - Cash Flow
  - Returns: operating, investing, financing cash flows

- `aggregateByCoA(organizationId, startDate, endDate, transactions)` - Detailed CoA breakdown
- `validateBalanceSheet(balanceSheet)` - Validates accounting equation

**Usage Example:**
```typescript
import { financialCalculationsService } from '@/services/financial-calculations.service';

const pnl = await financialCalculationsService.calculatePnL(
  orgId,
  startDate,
  endDate,
  transactions
);

console.log(`Net Profit: ₹${pnl.netProfit}`);
console.log(`Revenue: ₹${pnl.revenue}`);
```

---

### 3. Invoice Matching Service
**File:** `services/invoice-matching.service.ts`

Automatically matches payments to invoices with fuzzy matching.

**Key Functions:**
- `suggestMatches(invoice, transactions)` - Get ranked match suggestions
  - Scoring: Amount (40%), Party (40%), Date (20%)
  - Tolerance: Amount ±1%, Date ±7 days, Party 80% match

- `matchInvoiceToTransaction(invoiceId, transactionId, matchNote)` - Create match
- `unmatchInvoiceFromTransaction(invoiceId)` - Remove match
- `calculatePartialPayments(invoiceId, transactions)` - Handle multiple payments
- `identifyOverpayments(invoiceId, transactions)` - Detect overpayments
- `getInvoiceMatchingStatus(invoices, transactions)` - Get all matching status

**Usage Example:**
```typescript
import { invoiceMatchingService } from '@/services/invoice-matching.service';

const matches = await invoiceMatchingService.suggestMatches(
  invoice,
  transactions
);

// Match top suggestion
await invoiceMatchingService.matchInvoiceToTransaction(
  invoice.id,
  matches[0].transactionId
);
```

---

### 4. Bank Reconciliation Service
**File:** `services/bank-reconciliation.service.ts`

Reconciles bank statements with system transactions.

**Key Functions:**
- `parseStatement(csvData)` - Parse bank statement CSV
  - Format: Date, Description, Amount, Type

- `calculateSystemBalance(bankAccountId, statementDate, transactions, openingBalance)` - Compute system balance
- `matchStatementTransactions(bankTransactions, systemTransactions)` - Match items
  - Criteria: Exact amount, date ±3 days, type consistency

- `identifyDiscrepancies(bankBalance, systemBalance, matches)` - Find differences
- `createJournalEntry(bankAccountId, description, amount, type)` - Record adjustments
- `identifyOutstandingItems(transactions)` - Cheques, ACHs, deposits in transit
- `generateReconciliationReport(...)` - Complete report

**Usage Example:**
```typescript
import { bankReconciliationService } from '@/services/bank-reconciliation.service';

const transactions = await bankReconciliationService.parseStatement(csvData);

const report = await bankReconciliationService.generateReconciliationReport(
  bankAccountId,
  statementDate,
  bankClosingBalance,
  openingBalance,
  transactions
);

console.log(`Reconciled: ${report.status === 'COMPLETED'}`);
console.log(`Matched: ${report.matchedItems}, Unmatched: ${report.unmatchedItems}`);
```

---

### 5. GST Compliance Service
**File:** `services/gst-compliance.service.ts`

Calculates GST obligations and generates tax returns for Indian compliance.

**Key Functions:**
- `classifyGSTRate(description, amount, transactionType)` - Auto-classify rate
  - Returns: 5%, 12%, 18%, 28% or 0 (exempt)

- `calculateGST(amount, rate)` - Calculate tax amount
  - Returns: taxableAmount, gstAmount, totalAmount

- `generateGSTR1(organizationId, year, quarter, transactions)` - B2B Sales Report
- `generateGSTR2(organizationId, year, quarter, transactions)` - B2B Purchases Report
- `generateGSTR3B(organizationId, year, quarter, transactions)` - Quarterly Summary
  - Returns: inputTax, outputTax, netGSTPay

- `getGSTDeadlines(year)` - Filing and payment deadlines
- `trackGSTPayments(organizationId, quarter, year, paidAmount, paidDate)` - Record payments
- `validateGSTCompliance(organizationId, transactions)` - Compliance check

**Quarterly Filing Schedule:**
- Q1 (Jan-Mar): File by Apr 20, Pay by Apr 25
- Q2 (Apr-Jun): File by Jul 20, Pay by Jul 25
- Q3 (Jul-Sep): File by Oct 20, Pay by Oct 25
- Q4 (Oct-Dec): File by Jan 20, Pay by Jan 25

**Usage Example:**
```typescript
import { gstComplianceService } from '@/services/gst-compliance.service';

const classification = gstComplianceService.classifyGSTRate('Office supplies');
// Returns: { rate: 18, confidence: 60 }

const gst = gstComplianceService.calculateGST(10000, 18);
// Returns: { taxableAmount: 10000, gstAmount: 1800, totalAmount: 11800 }

const return_ = await gstComplianceService.generateGSTR3B(
  orgId,
  2024,
  'Q1',
  transactions
);
```

---

### 6. Auto-Classification Service
**File:** `services/auto-classification.service.ts`

Automatically classifies transactions to Chart of Accounts.

**Key Functions:**
- `extractKeywords(description)` - Tokenize and clean transaction text
- `matchToCoA(keywords)` - Fuzzy match against Chart of Accounts
- `suggestClassification(description, amount, transactionType)` - Get top 3 suggestions
  - Returns suggestions with confidence scores

- `acceptSuggestion(transactionId, coaCode, description, manualOverride)` - Record classification
- `learnFromCorrection(description, correctCoaCode)` - ML learning
- `getClassificationConfidence(description, coaCode)` - Get 0-100 score
- `autoClassifyIfConfident(transactionId, description, transactionType)` - Auto-classify if > 90%

**Confidence Thresholds:**
- > 90%: Auto-classify immediately
- 70-90%: Suggest to user (require confirmation)
- < 70%: Flag for manual review

**Chart of Accounts (50 total):**
- Revenue: 1010 (Sales), 1020 (Services), 1030 (Rent), 1040 (Interest)
- Expense: 2010 (COGS), 2020 (Rent), 2030 (Salaries), 2040 (Utilities), 2050 (Marketing), etc.
- Asset: 3010 (Cash), 3020 (Bank), 3030 (AR), 3040 (Inventory), 3050 (Equipment), 3060 (Property)
- Liability: 4010 (AP), 4020 (Short-term Loan), 4030 (Long-term Loan), 4040 (GST Payable)

**Usage Example:**
```typescript
import { autoClassificationService } from '@/services/auto-classification.service';

const suggestions = await autoClassificationService.suggestClassification(
  'Office rent payment to Acme Building',
  50000,
  'Expense'
);
// Returns top 3: 2020 (Rent), 2010 (COGS), 2070 (Office Supplies)

// If high confidence, auto-accept
await autoClassificationService.acceptSuggestion(
  txnId,
  '2020',  // CoA code
  'Office rent payment'
);
```

---

## API Endpoints

### Approval Endpoints

**POST /api/approvals/create**
Create an approval request
```json
{
  "transactionId": "txn_001",
  "organizationId": "org_001",
  "amount": 75000,
  "accountingType": "Expense",
  "createdBy": "user_001"
}
```
Response: Approval record or `{ approved: true }` if auto-approved

**GET /api/approvals/queue**
Get pending approvals for user
```
Query: ?organizationId=org_001&approverRole=MANAGER
```
Response: Array of pending approval requests

**POST /api/approvals/[id]/approve**
Approve a transaction
```json
{
  "approverUserId": "user_002",
  "approverRole": "MANAGER",
  "comment": "Approved - matches budget"
}
```

---

### Financial Statements Endpoints

**GET /api/financial-statements/pnl**
Get P&L Statement
```
Query: ?organizationId=org_001&startDate=2024-01-01&endDate=2024-03-31
```
Response: P&L statement with revenue, expenses, net profit

**GET /api/financial-statements/balance-sheet**
Get Balance Sheet
```
Query: ?organizationId=org_001&asOfDate=2024-03-31
```
Response: Balance sheet with assets, liabilities, equity

---

### Invoice Matching Endpoints

**GET /api/invoices/[id]/suggest-matches**
Get match suggestions for invoice
```
URL: /api/invoices/inv_001/suggest-matches
```
Response: Ranked array of potential matches with confidence

**POST /api/invoices/[id]/match**
Match invoice to transaction
```json
{
  "transactionId": "txn_005",
  "matchNote": "Partial payment"
}
```

**DELETE /api/invoices/[id]/match**
Unmatch invoice from transaction

---

### Bank Reconciliation Endpoints

**POST /api/reconciliation/upload-statement**
Parse bank statement
```json
{
  "csvData": "Date,Description,Amount,Type\n2024-02-15,Deposit,50000,CREDIT",
  "bankAccountId": "bank_001",
  "statementDate": "2024-02-29"
}
```
Response: Parsed transactions

**GET /api/reconciliation/status**
Get reconciliation status
```
Query: ?bankAccountId=bank_001&statementDate=2024-02-29
```
Response: Reconciliation report with matched/unmatched items

**PUT /api/reconciliation/complete**
Complete reconciliation
```json
{
  "bankAccountId": "bank_001",
  "statementDate": "2024-02-29",
  "bankBalance": 550000,
  "systemBalance": 550000
}
```

---

### GST Endpoints

**GET /api/gst/returns**
Get GST return for period
```
Query: ?organizationId=org_001&year=2024&quarter=Q1
```
Response: GSTR-3B with input/output tax and net payable

**POST /api/gst/calculate**
Calculate GST for amount
```json
{
  "amount": 10000,
  "rate": 18,
  "description": "Software services"
}
```
Response: GST calculation

**PUT /api/gst/classify**
Classify GST rate
```
Query: ?description=Office supplies
```
Response: Suggested rate with examples

---

### Classification Endpoints

**POST /api/classification/suggest**
Get CoA suggestions
```json
{
  "description": "Office rent payment",
  "amount": 50000,
  "transactionType": "Expense"
}
```
Response: Top 3 CoA suggestions with confidence

**PUT /api/classification/accept**
Accept a classification
```json
{
  "transactionId": "txn_001",
  "coaCode": "2020",
  "description": "Office rent",
  "manualOverride": false
}
```

**GET /api/classification/confidence**
Get confidence score
```
Query: ?description=Electricity bill&coaCode=2040
```
Response: Confidence score and action

**DELETE /api/classification/chart-of-accounts**
Get all Chart of Accounts
```
Response: Array of 50 CoA mappings with keywords and examples
```

---

## Type Definitions

All types are defined in `types/business-logic.types.ts` for full type safety:

```typescript
interface Transaction {
  id: string;
  organizationId: string;
  amount: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvalLevel?: 'NONE' | 'MANAGER' | 'ADMIN';
  // ... more fields
}

interface PnLStatement {
  revenue: number;
  costOfGoodsSold: number;
  expenses: number;
  netProfit: number;
  byCoA: Record<string, number>;
}

interface InvoiceMatch {
  invoiceId: string;
  transactionId: string;
  overallConfidence: number; // 0-100
  matchType: 'EXACT' | 'PARTIAL' | 'SUGGESTED';
}

// ... more types
```

---

## Integration with Frontend

The services can be used directly in React components via API routes:

```typescript
// In a React component
async function approveTransaction(approvalId: string) {
  const response = await fetch(`/api/approvals/${approvalId}/approve`, {
    method: 'POST',
    body: JSON.stringify({
      approverUserId: userId,
      approverRole: userRole,
      comment: 'Approved'
    })
  });
  
  const result = await response.json();
  setApprovals(prev => prev.filter(a => a.id !== approvalId));
}
```

---

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  const result = await service.operation(params);
} catch (error) {
  console.error('[Service] Error:', error);
  // Error responses include descriptive messages
}
```

---

## Performance Considerations

- **Caching**: Financial calculations should be cached and invalidated on transaction updates
- **Batch Operations**: Use aggregation functions for multiple transactions
- **Lazy Loading**: Classifications loaded on-demand
- **Learning**: Learned patterns stored in-memory (can be persisted to DB)

---

## Testing

Each service includes mock implementations suitable for testing:

```typescript
// Example test
const pnl = await financialCalculationsService.calculatePnL(
  'org_test',
  new Date('2024-01-01'),
  new Date('2024-03-31'),
  mockTransactions
);

assert(pnl.netProfit === expectedProfit);
```

---

## Next Steps

1. **Database Integration**: Connect services to actual database queries
2. **Real-time Updates**: Implement WebSocket for live financial updates
3. **Export Features**: Add PDF/Excel export for statements
4. **Audit Trail**: Log all decisions to audit_log table
5. **ML Improvements**: Implement more sophisticated classification models
6. **Performance**: Add caching layer (Redis) for financial calculations
