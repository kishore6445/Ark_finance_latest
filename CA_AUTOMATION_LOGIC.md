## FINANCIAL STATEMENTS AUTOMATION LOGIC
## Complete Data Flow Documentation for Chartered Accountants

---

## EXECUTIVE SUMMARY

The Warrior Finance platform automates financial statement generation following Indian Accounting Standards (Ind AS). Every transaction entered in the Inbox is automatically mapped to the Chart of Accounts and aggregated to generate real-time P&L, Balance Sheet, and Cash Flow statements.

**Key Principle:** One source of truth (Transactions) → Multiple financial statements through intelligent categorization and aggregation

---

## LAYER 1: DATA ENTRY (INBOX)

### Transaction Structure

When a CA/user enters a transaction in Inbox, they specify:

```
Transaction {
  date: string              // When the transaction occurred
  description: string       // Transaction detail (e.g., "Acme Studios - Project Delivery")
  amount: number           // Amount in rupees
  isIncome: boolean        // TRUE for income, FALSE for expense
  accountingType: 'Revenue' | 'Expense' | 'Asset' | 'Liability'  // Classification
  subtype: string          // Specific category (e.g., "Sales", "Operating", "COGS")
  matchedInvoiceId?: string // Links to specific invoice if applicable
  gstSplit: { taxable, gst } // GST tax split for compliance
  allocationStatus: 'Allocated' | 'Partially Allocated' | 'Unallocated'
  status: 'Recorded' | 'Needs Info' | 'Action Required'
}
```

### Example Transaction Entry

**Scenario:** Your company receives ₹45,000 from Acme Studios for project delivery

```
Date: Feb 4, 2024
Description: "Acme Studios - Project Delivery"
Amount: 45,000
Income/Expense: Income (isIncome = TRUE)
Type: Revenue
Subtype: Sales
GST: ₹6,865 (tax) + ₹38,135 (taxable) = ₹45,000
Invoice Link: INV-001 (for reconciliation)
Status: Recorded
```

---

## LAYER 2: AUTOMATED CHART OF ACCOUNTS MAPPING

### How Transactions Get Classified

The system uses keyword-based intelligent mapping to automatically classify each transaction.

**Chart of Accounts Structure (50+ line items following Ind AS):**

```
REVENUE SECTION (Codes 1000-1100)
├─ 1010: Sale of Goods → Keywords: sales, sale, goods, products
├─ 1020: Service Revenue → Keywords: service, revenue, professional, consulting
├─ 1030: Other Operating Revenue → Keywords: other income, misc revenue, rental
├─ 1100: Interest Income → Keywords: interest, bank interest, investment income

COST OF MATERIALS SECTION (Codes 2000-2040)
├─ 2010: Opening Stock of Raw Materials
├─ 2020: Purchases of Raw Materials → Keywords: purchase, material, raw
├─ 2030: Closing Stock of Raw Materials
├─ 2040: Cost of Materials Consumed

EMPLOYEE BENEFITS SECTION (Codes 3000-3030)
├─ 3010: Salary and Wages → Keywords: salary, wages, payroll, compensation
├─ 3020: Gratuity and Severance
├─ 3030: Staff Welfare and Benefits → Keywords: welfare, benefits, insurance, medical

DEPRECIATION SECTION (Codes 4000-4040)
├─ 4010: Depreciation - Building → Keywords: depreciation, building
├─ 4020: Depreciation - Plant & Machinery → Keywords: depreciation, machinery, equipment
├─ 4030: Depreciation - Vehicles

OPERATING EXPENSES SECTION (Codes 5000-5110)
├─ 5010: Power and Fuel → Keywords: power, fuel, electricity, gas
├─ 5020: Repairs and Maintenance
├─ 5030: Rent → Keywords: rent, lease, occupancy
├─ 5040: Rates and Taxes
├─ 5050: Insurance
├─ 5060: Advertisement and Promotion → Keywords: advertisement, marketing, promotion
├─ 5070: Travelling and Conveyance → Keywords: travel, conveyance, transportation
├─ 5080: Telephone and Internet
├─ 5090: Printing and Stationery
├─ 5100: Professional Fees → Keywords: professional, fees, audit, legal, consultant
├─ 5110: Bank Charges

... and more for assets, liabilities, equity
```

### Mapping Algorithm

```typescript
// Function: mapTransactionToAccount()
INPUT: Transaction description + subtype
PROCESS:
  1. Combine description + subtype into search text
  2. Iterate through Chart of Accounts (50 line items)
  3. Match transaction against account keywords
  4. Return matching account with code and name
OUTPUT: ChartOfAccountsLine (code, name, category, section, keywords)
```

### Example Mapping

**Input Transaction:**
```
Description: "AWS Services - Monthly Bill"
Subtype: "Operating"
```

**Matching Process:**
- Search text: "aws services monthly bill operating"
- Keywords checked against:
  - "power, fuel" ❌
  - "rent, lease" ❌
  - "professional, fees, audit" ❌
  - ... scanning ...
  - "No direct match found" → Falls to generic "Operating Expenses"

**Output Mapped Account:**
```
Code: 5090
Name: "Professional Fees" or "Other Operating Expenses"
Category: "Operating Expenses"
Section: "Other Expenses"
```

---

## LAYER 3: AGGREGATION & CALCULATION

### Transaction Aggregation by Account

Once mapped, the system aggregates all transactions by account code:

```typescript
// Function: aggregateByAccount(transactions[])

// Group transactions by account
const aggregated = {
  "1010_Sale of Goods": 45000,        // From Acme Studios transaction
  "1020_Service Revenue": 12000,      // From other service transactions
  "5010_Power and Fuel": -3500,       // Expenses are negative
  "3010_Salary and Wages": -65000,    // Employee salary
  "4020_Depreciation": -2150,         // Monthly depreciation
  // ... more accounts
};

// Result: A map of Account Code → Net Amount
```

### Key Rules for Aggregation

1. **Income transactions:** Add as positive
2. **Expense transactions:** Add as negative
3. **Multiple transactions to same account:** Sum all amounts
4. **Account not used:** Exclude from statement (no zero lines)
5. **Date filtering:** Only include transactions within statement period

---

## LAYER 4: FINANCIAL STATEMENT GENERATION

### P&L Statement Generation

The system automatically builds Profit & Loss statement from aggregated accounts:

```typescript
// Function: generateEnhancedPLStatement(transactions[], startDate, endDate)

STEP 1: Filter Transactions
  → Keep only transactions between startDate and endDate
  → Example: Jan 1, 2024 to Mar 31, 2024 (Q4)

STEP 2: Aggregate by Account
  → Call aggregateByAccount() → Get account totals

STEP 3: Build Statement Sections

SECTION: Revenue from Operations
  ├─ Sale of Goods (1010):         ₹45,000
  ├─ Service Revenue (1020):       ₹12,000
  ├─ Other Operating Revenue:      ₹2,500
  └─ TOTAL REVENUE:                ₹59,500

SECTION: Cost of Materials Consumed
  └─ TOTAL COGS:                   ₹18,000

SECTION: GROSS PROFIT               ₹41,500
  (Revenue - COGS)

SECTION: Employee Benefits Expense
  ├─ Salary and Wages:            -₹65,000
  ├─ Gratuity:                     -₹2,000
  └─ TOTAL:                        -₹67,000

SECTION: Depreciation
  ├─ Building:                     -₹425
  ├─ Plant & Machinery:            -₹930
  ├─ Vehicles:                     -₹240
  └─ TOTAL:                        -₹1,595

SECTION: Other Operating Expenses
  ├─ Power and Fuel:              -₹3,500
  ├─ Rent:                        -₹8,000
  ├─ Professional Fees:           -₹2,500
  └─ TOTAL:                       -₹14,000

SECTION: Finance Costs
  └─ Interest Expense:            -₹1,200

STEP 4: Calculate Summary Totals

EBIT = Revenue - COGS - Employee Benefits - Depreciation - Other Expenses
     = ₹59,500 - ₹18,000 - ₹67,000 - ₹1,595 - ₹14,000
     = -₹41,095

Profit Before Tax = EBIT - Finance Costs
                  = -₹41,095 - ₹1,200
                  = -₹42,295

Tax Expense (30% if profitable) = ₹0 (no tax on loss)

NET PROFIT = -₹42,295

FINAL P&L STATEMENT OUTPUT:
{
  period: "2024-01-01 to 2024-03-31",
  sections: [
    { name: "Revenue from Operations", total: 59500, items: [...] },
    { name: "Cost of Materials Consumed", total: 18000, items: [...] },
    { name: "Employee Benefits Expense", total: 67000, items: [...] },
    // ... more sections
  ],
  summary: {
    totalRevenue: 59500,
    totalCOGS: 18000,
    grossProfit: 41500,
    totalEmployeeBenefits: 67000,
    totalDepreciation: 1595,
    totalOtherExpenses: 14000,
    totalFinanceCosts: 1200,
    profitBeforeTax: -42295,
    taxExpense: 0,
    netProfit: -42295
  }
}
```

---

## LAYER 5: REAL-TIME DISPLAY IN FINANCIAL STATEMENTS SCREEN

### How Data Flows to Display

```
INBOX SCREEN              DATA STORE              CALCULATIONS              DISPLAY
(User entry)              (App State)             (Real-time)               (Reports)

Enter Transaction  ──→   state.transactions[]  ──→  generateEnhancedPLStatement()  ──→  Sch-P&L Tab
                                                     ├─ Filter by date
                                                     ├─ Aggregate by account
                                                     ├─ Calculate totals
                                                     └─ Format output

                                                  generateBalanceSheet()      ──→  Final Account Tab
                                                     ├─ Assets = Liability + Equity
                                                     ├─ Group by type
                                                     └─ Calculate balances

                                                  generateCashFlowStatement() ──→  Cash Flow Tab
```

### Real-Time Reactivity

The financial statements use React `useMemo` for automatic updates:

```typescript
// In financial-statements-screen.tsx

// Every time transactions change, recalculate P&L
const realPLStatement = useMemo(() => {
  const { start, end } = getDateRange('year');
  return generateEnhancedPLStatement(
    state.transactions,  // ← If this changes
    state.invoices,
    start,
    end
  );
}, [state.transactions, state.invoices]);  // ← Re-calculate automatically

// Component renders new data immediately
<td className="px-4 py-2">{realPLStatement.summary.netProfit}</td>
```

**Result:** User adds transaction in Inbox → Automatically appears in Financial Statements

---

## COMPLETE WORKFLOW EXAMPLE

### Scenario: Quarterly Report for Q4 (Oct-Dec 2023)

#### STEP 1: User Enters Transactions in Inbox

```
Oct 5:  Customer ABC Payment      ₹50,000  [Income, Sales]
Oct 10: Salary Payment            -₹60,000 [Expense, Salaries]
Oct 15: Office Rent               -₹10,000 [Expense, Rent]
Oct 20: AWS Cloud Services        -₹5,000  [Expense, Professional Fees]
Oct 25: Materials Purchase        -₹15,000 [Expense, COGS]
Nov 3:  Customer DEF Payment      ₹30,000  [Income, Sales]
Nov 10: Salary Payment            -₹60,000 [Expense, Salaries]
Nov 15: Office Rent               -₹10,000 [Expense, Rent]
... more transactions through Dec
```

#### STEP 2: System Maps Each Transaction

```
Oct 5 (₹50,000) + "Sales" 
  → Keyword match: "sales"
  → Account: 1010_Sale of Goods
  → Store: aggregated["1010_Sale of Goods"] += 50000

Nov 3 (₹30,000) + "Sales"
  → Account: 1010_Sale of Goods
  → Store: aggregated["1010_Sale of Goods"] += 30000
  
Oct 10 (₹60,000) + "Salaries"
  → Account: 3010_Salary and Wages
  → Store: aggregated["3010_Salary and Wages"] += 60000

... all transactions mapped and aggregated
```

#### STEP 3: System Calculates Period Totals

```
For Oct 1 - Dec 31, 2023:

aggregated = {
  "1010_Sale of Goods": 145000,        // Oct(50k) + Nov(30k) + Dec(65k)
  "3010_Salary and Wages": -180000,    // 3 months × 60k
  "5030_Rent": -30000,                 // 3 months × 10k
  "5100_Professional Fees": -15000,    // AWS and other services
  "2040_Cost of Materials": -45000,    // Materials purchases
  "4020_Depreciation": -6450,          // 3 months × 2150
}
```

#### STEP 4: Generate P&L Statement

```
PROFIT & LOSS STATEMENT
For Quarter Oct 1 - Dec 31, 2023
(Rs in 000's)

Revenue from Operations:
  Sale of Goods                 145.00
─────────────────────────────────────
Cost of Materials Consumed       45.00
─────────────────────────────────────
GROSS PROFIT                    100.00

Expenses:
  Employee Benefits (Salaries)  180.00
  Rent                           30.00
  Professional Fees              15.00
  Depreciation                    6.45
─────────────────────────────────────
Total Expenses                 231.45
─────────────────────────────────────
PROFIT/(LOSS) BEFORE TAX       (131.45)

Tax Expense (30%)                  0.00
─────────────────────────────────────
NET PROFIT/(LOSS)              (131.45)
═════════════════════════════════════
```

#### STEP 5: Display in Financial Statements Screen

User navigates to "Financial Statements" → "Sch - P&L" tab → Sees above statement

**Key Feature:** If user edits any transaction, P&L updates instantly

---

## COMPLIANCE & ACCOUNTING STANDARDS

### Indian Accounting Standards (Ind AS) Compliance

The Chart of Accounts follows Schedule VI of Companies Act, 2013:

```
FORMAT STRUCTURE:
├─ Revenue from Operations (Ind AS 115)
├─ Other Income
├─ Cost of Materials
├─ Employee Benefits (Ind AS 19)
├─ Depreciation (Ind AS 16)
├─ Other Operating Expenses
├─ Finance Costs
└─ Tax Expense (Ind AS 12)
```

### GST Tracking

Every transaction has GST split:
```
Transaction Amount = Taxable Base + GST
₹45,000 = ₹38,135 (taxable) + ₹6,865 (18% GST)
```

For compliance, the system tracks:
- Output GST (from revenue transactions)
- Input GST (from expense transactions)
- Net GST liability for GSTR-3B filing

### Audit Trail

Every transaction records:
- Date/time entered
- User (for approval workflows)
- Original amount
- Matched invoice (for reconciliation)
- Current status (Recorded, Needs Info, Action Required)

---

## CUSTOMIZATION & CONTROL

### CA Can Override Classifications

If automatic mapping doesn't work perfectly:

```
Default Map: "Office Supplies" → Professional Fees (Incorrect)
CA Override: Change to → Rent (Correct)
```

The system allows manual override while maintaining audit trail.

### Add Custom Accounts

CAs can add industry-specific accounts:
```
Example for NBFC:
├─ Commission Income
├─ Loan Loss Provision
├─ Insurance Commission Payable
```

### Adjust Chart of Accounts

Modify account mappings, keywords, and sections per company requirements

---

## SUMMARY TABLE: DATA TRANSFORMATION LAYERS

| Layer | Input | Process | Output |
|-------|-------|---------|--------|
| 1. Entry | Manual transaction entry in Inbox | User specifies description, amount, type, subtype | Transaction object |
| 2. Mapping | Transaction description + subtype | Keyword matching against 50+ account lines | Chart of Accounts code |
| 3. Aggregation | All transactions for period | Group by account code, sum amounts | Account balances |
| 4. Calculation | Account balances | Apply P&L structure, calculate totals | P&L Statement |
| 5. Display | P&L Statement | Format and render in UI | Real-time report |

---

## VALIDATION POINTS

### Before Generating Reports, System Validates:

1. **Transaction Completeness**
   - All transactions have description ✓
   - All amounts are positive ✓
   - All have accounting type and subtype ✓
   - Date is within statement period ✓

2. **Balance Sheet Reconciliation**
   - Assets = Liabilities + Equity ✓
   - No unmatched transactions ✓

3. **P&L Logic**
   - Revenue > 0 ✓
   - Expenses < 0 ✓
   - No double-counting ✓

4. **Completeness**
   - All revenue invoices matched ✓
   - All expense bills matched ✓
   - GST accounted for ✓

---

## ADVANTAGES FOR CHARTERED ACCOUNTANTS

1. **Audit Ready**: Maintains complete audit trail with source transactions
2. **Compliance**: Follows Ind AS and Schedule VI format automatically
3. **Speed**: Generates statements in seconds vs hours of manual work
4. **Accuracy**: No formula errors or typos
5. **Control**: Override any mapping while maintaining documentation
6. **Real-time**: See impact of any transaction immediately
7. **Scalability**: Works with 10 or 10,000 transactions identically

---

## CONCLUSION

The Warrior Finance platform automates financial statement generation by:
1. Capturing transactions in Inbox
2. Intelligently mapping to Chart of Accounts
3. Aggregating by account for period
4. Calculating P&L, Balance Sheet, Cash Flow
5. Displaying real-time in Financial Statements

This reduces manual P&L preparation time from 3-4 hours to seconds while maintaining complete audit trail and accounting standards compliance.
