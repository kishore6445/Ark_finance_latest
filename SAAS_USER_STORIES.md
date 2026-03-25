# Warrior Finance - User Stories by Role

## SUPER ADMIN User Stories

### Story 1: Onboard New Organization
**As a** Super Admin  
**I want to** onboard a new organization into the platform  
**So that** they can start using Warrior Finance immediately  

**Acceptance Criteria**
- Can create new organization with company details
- Can assign Org Admin automatically
- Can set subscription tier
- Organization becomes active immediately
- Can see organization in dashboard

**Data Flow**
```
Super Admin → Create Org Screen → Organization Context
→ Save to Database → Activate Org → Org Admin notified
```

---

### Story 2: Manage Subscriptions
**As a** Super Admin  
**I want to** manage organization subscriptions and billing  
**So that** I can track revenue and usage  

**Acceptance Criteria**
- View all subscriptions and their status
- Upgrade/downgrade plans
- Apply promotional codes
- View payment history
- Set billing alerts

---

### Story 3: Monitor Platform Health
**As a** Super Admin  
**I want to** monitor system performance and logs  
**So that** I can ensure platform stability  

**Acceptance Criteria**
- View system logs in real-time
- See organization count and active users
- Monitor API performance
- View error logs and alerts
- Export compliance reports

---

## ORG ADMIN User Stories

### Story 4: Set Up Organization
**As an** Org Admin  
**I want to** configure my organization settings  
**So that** the system reflects my business accurately  

**Acceptance Criteria**
- Set company name, GSTIN, PAN, address
- Choose accounting standard (Ind AS / Schedule VI)
- Enable/disable GST, TDS
- Set fiscal year
- Configure currency and timezone

**Data Flow**
```
Org Admin → Org Settings Screen → Organization Context
→ Validate Settings → Save to Database → Update all screens
```

---

### Story 5: Invite Team Members
**As an** Org Admin  
**I want to** invite team members and assign roles  
**So that** my team can collaborate on financial management  

**Acceptance Criteria**
- Send invitations by email
- Assign roles (Accountant, Manager, Auditor, Viewer)
- Revoke invitations
- Remove team members
- View team activity

**Data Flow**
```
Org Admin → Team Management Screen
→ Send Invitation Email → Team Member accepts
→ Create User Record → Assign Role → User gets access
```

---

### Story 6: Create Bank Accounts
**As an** Org Admin  
**I want to** add bank accounts to the system  
**So that** I can track all my organization's accounts  

**Acceptance Criteria**
- Add account details (name, number, bank, IFSC)
- Mark primary account
- Link to expense buckets
- View balances
- Edit account details

**Data Flow**
```
Org Admin → Bank Accounts Screen → Form Input
→ Validate IFSC → Save Account → Update Balance
→ Link to Buckets → Create reconciliation records
```

---

### Story 7: Approve High-Value Transactions
**As an** Org Admin  
**I want to** approve high-value transactions  
**So that** I maintain control over significant expenses  

**Acceptance Criteria**
- View approval queue
- See transaction details before approving
- Add approval comments
- Reject with reason if needed
- See audit trail of approvals

**Data Flow**
```
Transaction Created → Requires Approval Flag
→ Appears in Org Admin Queue
→ Org Admin Reviews → Approves/Rejects
→ Updates Transaction Status → Notifies user
```

---

### Story 8: View Organization Dashboard
**As an** Org Admin  
**I want to** see organization-wide financial overview  
**So that** I know the health of my business  

**Acceptance Criteria**
- See real-time financial metrics
- View P&L summary
- See cash flow overview
- View pending approvals
- See team activity summary

---

## ACCOUNTANT User Stories

### Story 9: Record Transactions
**As an** Accountant  
**I want to** record daily business transactions  
**So that** financial records are accurate and up-to-date  

**Acceptance Criteria**
- Create transaction with date, amount, type
- Auto-categorize using Chart of Accounts
- Attach invoice/document
- Add GST split
- Save transaction locally (draft)

**Data Flow**
```
Accountant → Inbox Screen → Create Transaction
→ Fill form (Date, Amount, Type) → AI Classification
→ Chart of Accounts Mapping → Show suggested account
→ User confirms → Transaction saved to state
→ Auto-updates Financial Statements
```

---

### Story 10: Match Invoices to Payments
**As an** Accountant  
**I want to** match invoices with bank transactions  
**So that** I can track payment status accurately  

**Acceptance Criteria**
- View unmatched invoices
- View unmatched transactions
- Match by amount, date, party name
- Handle partial payments
- See reconciliation status

**Data Flow**
```
Accountant → Invoices Screen
→ Select Invoice + Transaction → Validate match
→ Link them → Update Invoice Status
→ Update Transaction Status → Recalculate P&L
```

---

### Story 11: Reconcile Bank Account
**As an** Accountant  
**I want to** reconcile bank statements with our records  
**So that** I know there are no discrepancies  

**Acceptance Criteria**
- Download bank statement (CSV/PDF)
- See system balance vs bank balance
- Identify discrepancies
- Mark cleared items
- Add notes on uncleared items
- Generate reconciliation report

**Data Flow**
```
Accountant → Bank Reconciliation Screen
→ Upload Bank Statement → Parse transactions
→ Match with system records → Flag discrepancies
→ Mark cleared items → Generate report
→ Save reconciliation → Accountant confirms
```

---

### Story 12: Create Expense Bucket
**As an** Accountant  
**I want to** create expense buckets for cost tracking  
**So that** I can allocate expenses to different departments/projects  

**Acceptance Criteria**
- Create bucket with name and allocation
- Set budget limits
- Assign to bank account
- View bucket balance
- See transaction history

**Data Flow**
```
Accountant → Buckets Screen → Create Bucket
→ Set name, allocation, limits → Save
→ Link to Bank Account → Initialize balance
→ Bucket appears in all transaction screens
```

---

### Story 13: Generate Reports
**As an** Accountant  
**I want to** generate financial reports for review  
**So that** management can make informed decisions  

**Acceptance Criteria**
- Generate P&L, Balance Sheet, Cash Flow
- Filter by date range
- See drill-down details
- Export to PDF/Excel
- Schedule reports

**Data Flow**
```
Accountant → Reports Screen
→ Select Report Type + Date Range
→ System aggregates transactions by Chart of Accounts
→ Calculates P&L (Revenue - Expenses = Profit)
→ Generates Balance Sheet from account balances
→ Generates Cash Flow from transaction flow
→ Display in tabular + visual format
```

---

## MANAGER User Stories

### Story 14: Review Pending Approvals
**As a** Manager  
**I want to** review and approve pending transactions  
**So that** I maintain financial control  

**Acceptance Criteria**
- See all pending approvals
- Filter by amount, type, date
- View transaction details
- Approve/Reject with comments
- See approval history

**Data Flow**
```
Manager → Approvals Screen
→ Filter pending transactions
→ View transaction details
→ Approve/Reject → Update status
→ Notify relevant stakeholders
→ Update Financial Statements
```

---

### Story 15: Monitor Team Activity
**As a** Manager  
**I want to** see what transactions my team is creating  
**So that** I can ensure compliance and accuracy  

**Acceptance Criteria**
- View activity log by team member
- Filter by date, type, amount
- See who created/edited transactions
- View rejected transactions with reasons
- Export activity report

**Data Flow**
```
Manager → Activity Logs Screen
→ Filter by date/user/type
→ Retrieve from Audit Trail in Database
→ Display with user, action, timestamp
→ Allow export to CSV/PDF
```

---

### Story 16: Manage Budget Allocations
**As a** Manager  
**I want to** monitor spending against budgets  
**So that** we don't overspend  

**Acceptance Criteria**
- Set budget limits for categories
- View actual vs budget
- Get alerts when approaching limit
- Forecast spending trends
- Generate budget reports

**Data Flow**
```
Manager → Budget Screen
→ Set category budgets
→ System tracks spending by category
→ Calculates variance (Budget - Actual)
→ Shows percentage used
→ Alerts when >80% spent
```

---

## AUDITOR User Stories

### Story 17: Review Transactions for Compliance
**As an** Auditor  
**I want to** review all transactions for compliance  
**So that** I can ensure accuracy and regulatory adherence  

**Acceptance Criteria**
- View all transactions (read-only)
- See complete transaction history
- Verify GST calculations
- Check approval chains
- View audit trail
- Generate compliance report

**Data Flow**
```
Auditor → Transactions Screen
→ View all transactions with filters
→ See audit trail (who, what, when)
→ Verify Chart of Accounts mapping
→ Check GST split correctness
→ Flag discrepancies
→ Generate audit report
```

---

### Story 18: Generate Audit Report
**As an** Auditor  
**I want to** generate comprehensive audit reports  
**So that** I can document findings and recommendations  

**Acceptance Criteria**
- Audit transaction accuracy
- Verify reconciliations
- Check compliance with standards
- Document findings
- Export report with recommendations
- Sign off on audit

**Data Flow**
```
Auditor → Audit Reports Screen
→ Select audit scope (date range, entities)
→ System extracts all transactions
→ Auditor reviews and annotates
→ Generates findings report
→ Documents compliance status
→ Exports signed report
```

---

### Story 19: Verify Financial Statements
**As an** Auditor  
**I want to** verify financial statements are accurate  
**So that** I can ensure reliable reporting  

**Acceptance Criteria**
- Compare financial statements with source data
- Verify calculations
- Check compliance with accounting standards
- Identify discrepancies
- Add audit sign-off
- Export verified statements

**Data Flow**
```
Auditor → Financial Statements Screen
→ Review P&L, Balance Sheet, Cash Flow
→ Verify each line item against transactions
→ Check calculations (totals, formulas)
→ Verify Chart of Accounts compliance
→ Add audit notes/annotations
→ Sign off → Generate audit-certified statements
```

---

## VIEWER User Stories

### Story 20: View Dashboard
**As a** Viewer  
**I want to** see the financial dashboard  
**So that** I understand the business health  

**Acceptance Criteria**
- View summary metrics
- See P&L at a glance
- View cash flow summary
- Cannot access detailed transactions
- Cannot access sensitive data

**Data Flow**
```
Viewer → Dashboard Screen
→ System shows high-level summaries only
→ Cannot drill-down to transactions
→ Cannot see detailed P&L
→ Shows only published information
```

---

### Story 21: View Financial Reports
**As a** Viewer  
**I want to** view financial reports  
**So that** I can understand our financial performance  

**Acceptance Criteria**
- View published reports
- View P&L summary
- View Balance Sheet summary
- Cannot modify reports
- Cannot see transaction details

---

## Summary of User Stories

| # | Story | Role | Epic | Status |
|---|-------|------|------|--------|
| 1 | Onboard Organization | Super Admin | Platform | Design |
| 2 | Manage Subscriptions | Super Admin | Platform | Design |
| 3 | Monitor Platform Health | Super Admin | Platform | Design |
| 4 | Set Up Organization | Org Admin | Setup | Design |
| 5 | Invite Team Members | Org Admin | Team | Design |
| 6 | Create Bank Accounts | Org Admin | Setup | Design |
| 7 | Approve Transactions | Org Admin | Approvals | Design |
| 8 | View Org Dashboard | Org Admin | Dashboard | Design |
| 9 | Record Transactions | Accountant | Operations | Dev |
| 10 | Match Invoices | Accountant | Operations | Dev |
| 11 | Reconcile Bank | Accountant | Operations | Dev |
| 12 | Create Buckets | Accountant | Operations | Dev |
| 13 | Generate Reports | Accountant | Reporting | Dev |
| 14 | Review Approvals | Manager | Approvals | Design |
| 15 | Monitor Activity | Manager | Compliance | Design |
| 16 | Manage Budgets | Manager | Planning | Backlog |
| 17 | Review Compliance | Auditor | Audit | Backlog |
| 18 | Generate Audit Report | Auditor | Audit | Backlog |
| 19 | Verify Statements | Auditor | Audit | Backlog |
| 20 | View Dashboard | Viewer | Dashboard | Design |
| 21 | View Reports | Viewer | Reporting | Design |
