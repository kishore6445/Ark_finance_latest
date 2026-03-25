# WARRIOR FINANCE - CLIENT DEMO GUIDE
**Status: Ready for Demo** ✓

---

## Quick Pre-Demo Checklist (2 minutes)

- [ ] Browser cache cleared or use incognito mode
- [ ] Navigate to snapshot - verify data loads
- [ ] Click through 2-3 different screens to confirm responsiveness
- [ ] Verify no console errors (F12 → Console)

---

## DEMO SCRIPT (15-20 minutes)

### OPENING (1 min)
*"This is Warrior Finance - a financial operations platform that helps businesses know where their money is and where it should go. I'll walk through the core functionality showing real-time data flow."*

---

### SECTION 1: Dashboard Overview (2 min)

**Go to:** Dashboard/Snapshot Screen

*Say:* "This is the real-time financial health dashboard. It shows:"
- Cash position
- Monthly runway (how many months until cash runs out)
- Transaction status
- Key alerts

**Action:** Point to the metrics and explain what each means in business terms.

---

### SECTION 2: Create and Track Invoice (4 min)

**Go to:** Invoices Screen

**Demo Flow:**

1. **Show existing invoices**
   - *"We have 3 sample invoices to demonstrate the system"*
   - Point out: Invoice #, Party Name, Amount, Balance Due, Status

2. **Click "Create Invoice" button**
   - Modal opens with form fields
   - *"Let me create a new invoice to show how data flows through the system"*

3. **Fill in the form:**
   - Invoice Number: `INV-2024-100`
   - Party Name: `Acme Corporation`
   - Type: `Revenue` (select from dropdown)
   - Amount: `75000`
   - Due Date: Pick tomorrow's date

4. **Click "Create Invoice"**
   - Modal closes
   - New invoice appears in table at bottom
   - Status: "Unpaid", Balance Due: "75000"

5. **Click on the invoice row**
   - Shows invoice details in side panel
   - Balance Due: "75000"
   - Paid Amount: "0"

---

### SECTION 3: Link Payment and Match (4 min)

**Still on:** Invoices Screen, Invoice Detail View

**Demo Flow:**

1. **Click "Link Transaction" button**
   - *"Now let's match this invoice to a payment from the bank"*
   - Shows available bank transactions

2. **Show the matching panel:**
   - *"We have several incoming transactions that could match this invoice"*
   - Select the transaction for Acme Corporation (75000)
   - Click "Match" button

3. **Show the calculation:**
   - *"The system shows me the real-time balance:"*
   - Invoice Amount: 75,000
   - Paid: 75,000
   - Balance Remaining: 0
   - Status should update to "Paid"

4. **Click "Confirm Matches"**
   - Payment matched
   - Balance due updates to 0
   - Status changes from "Unpaid" → "Paid"
   - *"Everything is automatically updated"*

---

### SECTION 4: Create Bucket (2 min)

**Go to:** Buckets Screen

**Demo Flow:**

1. **Click "Create Bucket" button**
   - Modal opens
   - *"Buckets are where we allocate money for different purposes"*

2. **Fill in form:**
   - Bucket Name: `Demo Marketing Fund`
   - Type: `Operating` (select from dropdown)
   - Monthly Target: `50000` (optional)

3. **Click "Create Bucket"**
   - Modal closes
   - New bucket appears in table
   - Shows: Name, Type, Current Balance, Monthly Target, Status

---

### SECTION 5: Financial Statements - Real Data (4 min)

**Go to:** Financial Statements Screen

**Demo Flow:**

1. **Show the professional tab interface:**
   - *"We have 15 different financial statement tabs"*
   - Point out the color-coded tabs (blue for primary, red for important)
   - Show: FINAL ACCOUNT, Cash Flow, Notes, Audit Entries, etc.

2. **Click "Sch - P&L" tab**
   - *"This shows the Profit & Loss statement"*
   - **CRITICAL: This data is calculated from transactions we added in Inbox**
   - Show Revenue from Operations
   - Show Cost of Materials
   - Show Employee Benefits
   - Show Profit Before Tax
   - Show Net Profit

3. **Say:** *"Notice all these numbers updated automatically when we added transactions in the Inbox and created invoices. There's no manual data entry needed."*

4. **Click "FINAL ACCOUNT" tab**
   - Shows Balance Sheet
   - Assets, Liabilities, Equity

5. **Show the header info:**
   - Shows as of date
   - Shows "Rs in 000's" currency

6. **Click "Export" button (optional)**
   - Show export functionality works

---

### SECTION 6: Highlight Key Features (2 min)

**Key Points to Emphasize:**

1. **Real-time Data Flow**
   - Transaction in Inbox → Invoice created → Payment matched → Financial Statements updated
   - No manual reconciliation needed

2. **Professional Formatting**
   - 15 different financial statement tabs following Indian accounting standards
   - Proper hierarchies and subtotals
   - Audit-ready format

3. **Data Persistence**
   - All created items (invoices, buckets) persist
   - Navigate away and back - data still there
   - Calculations automatically recalculate

4. **User-Friendly Modals**
   - Simple, clean forms
   - Form validation (buttons disabled when required fields empty)
   - Easy to close (X button or Cancel)

---

## HANDLING COMMON QUESTIONS

### Q: "Will our existing data migrate?"
A: "Yes, we have migration tools in the import section. You can upload your existing transactions and invoices."

### Q: "How do we handle multi-currency?"
A: "The system is currently configured for INR, but can be extended for multi-currency support."

### Q: "Can we customize the financial statement templates?"
A: "Yes, the statement formats are configurable. We follow Indian accounting standards by default."

### Q: "How does payment matching work exactly?"
A: "You can match bank transactions to invoices as full or partial payments. The system calculates updated balances automatically."

### Q: "Is there an API for integration?"
A: "This is the foundation. APIs can be built on top of this data model."

---

## DATA FLOW DIAGRAM (What's Actually Happening)

```
INBOX TRANSACTIONS
       ↓
[Transaction created: "Client Payment - Acme", 75000, Revenue]
       ↓
CHART OF ACCOUNTS
       ↓
[Mapped to: Revenue from Operations]
       ↓
FINANCIAL STATEMENTS
       ↓
P&L STATEMENT: Revenue +75,000
       ↓
INVOICES SCREEN
       ↓
[Invoice matched to transaction, Balance Due updated to 0]
       ↓
STATUS UPDATED: "Unpaid" → "Paid"
```

---

## RECOVERY NOTES (If Something Goes Wrong)

### If modal won't close:
- Click X button in top-right
- Or click outside the modal
- Or press Escape key

### If data doesn't appear:
- Refresh the page (F5)
- Make sure you're filling in all required fields
- Check browser console for errors (F12)

### If calculations look wrong:
- Remember all data is sample/demo data
- The calculations are formulas, not hardcoded
- Add different transaction amounts to see them update

### If stuck on a screen:
- Use the navigation on the left sidebar
- Or click the back button if available
- The app doesn't lose state

---

## TIMING GUIDE

| Section | Time | Notes |
|---------|------|-------|
| Opening | 1 min | Set context |
| Dashboard | 2 min | Show metrics |
| Create Invoice | 4 min | Fill form, show in table |
| Match Payment | 4 min | Show real-time update |
| Create Bucket | 2 min | Show allocation |
| Financial Statements | 4 min | Show real data, calculations |
| **TOTAL** | **17 min** | **Leave 3 min for Q&A** |

---

## AFTER DEMO FOLLOW-UP

- Send them access to the app
- Provide API documentation (if building integrations)
- Share the accounting policies document
- Offer to customize statement templates
- Schedule follow-up for questions

---

## DEMO SUCCESS CRITERIA

✓ All modals open and close without errors
✓ Form validation works (buttons disabled when needed)
✓ Created data persists (invoice/bucket visible after creation)
✓ Real-time calculations update correctly
✓ Financial statements show correct totals
✓ No console errors during demo
✓ Demo completes in under 20 minutes

---

**Good Luck with your demo! Remember:**
- **Speak slowly and clearly**
- **Point to what you're clicking**
- **Explain the business value, not just the features**
- **Ask if they have questions**
- **Enjoy showing off the work!**
