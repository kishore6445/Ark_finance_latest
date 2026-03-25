# Warrior Finance - Screen Mapping by Role

## All 27 Screens with Role Access & Permissions

### Dashboard Screens (3)

#### 1. Snapshot Screen (Dashboard)
| Role | Access | Actions | Visibility |
|------|--------|---------|------------|
| Super Admin | ✓ FULL | View all orgs | All data |
| Org Admin | ✓ FULL | View own org | Own org only |
| Accountant | ✓ VIEW | View dashboard | Summary only |
| Manager | ✓ FULL | View + manage | All org data |
| Auditor | ✓ VIEW | View only | All org data (read) |
| Viewer | ✓ LIMITED | View summary | Published only |

**Data Shown**
- P&L Summary (YTD)
- Cash position (last updated)
- Pending approvals (count)
- Team activity (last 7 days)
- Budget vs actual summary

**User Flows**
- Click metric → Drill-down to detail screen
- Export dashboard as PDF
- Customize dashboard widgets

---

#### 2. Organization Dashboard (Org Admin Only)
| Role | Access | Actions |
|------|--------|---------|
| Org Admin | ✓ FULL | All actions |
| Super Admin | ✓ OVERRIDE | All actions |
| Others | ✗ NO | - |

**Data Shown**
- Organization stats (employee count, modules used)
- Subscription status
- Team composition
- Usage metrics
- Billing overview

---

#### 3. Notifications Screen
| Role | Access | Actions |
|------|--------|---------|
| All | ✓ | Mark read, delete own |

**Types of Notifications**
- Approval requests
- Reconciliation alerts
- Budget warnings
- System messages

---

### Transaction Screens (4)

#### 4. Inbox Screen (Transaction Entry)
| Role | Create | Edit | Delete | Approve |
|------|--------|------|--------|---------|
| Accountant | ✓ Own | ✓ Own | ✗ | ✗ |
| Manager | ✓ All | ✓ All | ✓ | ✓ |
| Org Admin | ✓ All | ✓ All | ✓ | ✓ |
| Auditor | ✗ | ✗ | ✗ | ✗ |
| Viewer | ✗ | ✗ | ✗ | ✗ |

**Features**
- AI classification (Chart of Accounts)
- GST split calculator
- Attachment upload
- Bulk entry
- Transaction templates

**Data Fields**
- Date, Amount, Type, Description
- GST Rate, Taxable Amount
- Account mapping (auto or manual)
- Reference invoice
- Notes

---

#### 5. Invoices Screen
| Role | Create | Edit | Delete | Match |
|------|--------|------|--------|-------|
| Accountant | ✓ Own | ✓ Own | ✗ | ✓ |
| Manager | ✓ All | ✓ All | ✓ | ✓ |
| Org Admin | ✓ All | ✓ All | ✓ | ✓ |
| Auditor | ✗ | ✗ | ✗ | ✓ View |
| Viewer | ✗ | ✗ | ✗ | ✗ |

**Invoice Types**
- Revenue invoices (sales to customers)
- Expense invoices (bills from vendors)
- Credit notes
- Debit notes

**Features**
- Invoice template management
- Auto-numbering
- Payment matching
- Invoice aging report
- Dunning management

---

#### 6. Bank Reconciliation Screen
| Role | Access | Actions |
|------|--------|---------|
| Accountant | ✓ FULL | Reconcile, upload statement |
| Manager | ✓ REVIEW | Review, approve |
| Org Admin | ✓ OVERRIDE | All |
| Auditor | ✓ VIEW | View only |
| Viewer | ✗ | - |

**Process**
1. Upload bank statement (CSV)
2. System auto-matches transactions
3. Accountant reviews discrepancies
4. Marks uncleared items
5. Generates reconciliation report
6. Manager approves

**Output**
- Reconciliation statement
- Outstanding items list
- Variance analysis
- Audit trail

---

#### 7. Transactions Detail Screen
| Role | View | Edit | Delete | Comment |
|------|------|------|--------|---------|
| Creator | ✓ Own | ✓ Own | ✗ | ✓ |
| Manager | ✓ All | ✓ | ✗ | ✓ |
| Org Admin | ✓ All | ✓ | ✓ | ✓ |
| Auditor | ✓ All | ✗ | ✗ | ✓ Read-only |

**Shows**
- Transaction details (all fields)
- Approval history
- Attachment preview
- Linked invoice
- Audit log comments

---

### Approval Screens (2)

#### 8. Approvals Screen
| Role | Access | Actions |
|------|--------|---------|
| Manager | ✓ QUEUE | Approve/Reject own queue |
| Org Admin | ✓ ALL | Approve all |
| Super Admin | ✓ OVERRIDE | All orgs |
| Others | ✗ | - |

**Queue Management**
- Filter by amount, type, date
- Sort by priority
- Bulk approve/reject
- Add comments
- Delegate approval

**Approval Rules**
- < ₹10K: Auto-approved
- ₹10-100K: Manager
- > ₹100K: Org Admin
- Critical (Payroll, Legal): Admin + Auditor

---

#### 9. Approval History Screen
| Role | View |
|------|------|
| All | ✓ Own + org data |

**Shows**
- Approval trail per transaction
- Approver comments
- Approval timestamp
- Rejection reasons
- Re-submission history

---

### Invoice Management Screens (2)

#### 10. Invoices List Screen
| Role | Create | Export | Report |
|------|--------|--------|--------|
| Accountant | ✓ Own | ✓ | ✓ Summary |
| Manager | ✓ | ✓ | ✓ Detailed |
| Org Admin | ✓ | ✓ | ✓ All |
| Auditor | ✗ | ✓ | ✓ Audit |

**Filters**
- Status (Paid, Unpaid, Partial, Overdue)
- Date range
- Party name
- Amount range
- Invoice type

---

#### 11. Invoice Aging Report Screen
| Role | Access |
|------|--------|
| Accountant | ✓ View |
| Manager | ✓ View + export |
| Org Admin | ✓ Full control |
| Auditor | ✓ View |
| Viewer | ✓ Summary |

**Shows**
- Current (0-30 days)
- 31-60 days
- 61-90 days
- 90+ days
- Total receivables/payables

---

### Bank & Bucket Screens (2)

#### 12. Bank Accounts Screen
| Role | Create | Edit | Delete | Link |
|------|--------|------|--------|------|
| Accountant | ✗ | ✗ | ✗ | ✓ View |
| Manager | ✓ | ✓ | ✗ | ✓ |
| Org Admin | ✓ | ✓ | ✓ | ✓ |
| Auditor | ✗ | ✗ | ✗ | ✓ View |

**Features**
- Add account (name, number, bank, IFSC)
- Link to expense buckets
- Set as primary
- View balance
- Transaction history

---

#### 13. Buckets Screen (Expense Allocation)
| Role | Create | Edit | Delete | Allocate |
|------|--------|------|--------|----------|
| Accountant | ✓ | ✓ | ✗ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✓ |
| Org Admin | ✓ | ✓ | ✓ | ✓ |
| Auditor | ✗ | ✗ | ✗ | ✓ View |

**Bucket Types**
- Department buckets (HR, Marketing, Ops)
- Project buckets (Project A, Project B)
- Cost center buckets
- Budget allocation buckets

**Features**
- Set allocation %
- Set budget limit
- Track spending vs budget
- Rebalance allocations
- Generate bucket report

---

### Budget & Planning Screens (2)

#### 14. Budget Management Screen (Future)
| Role | Create | Edit | Monitor |
|------|--------|------|---------|
| Manager | ✓ | ✓ | ✓ |
| Org Admin | ✓ | ✓ | ✓ |
| Accountant | ✗ | ✗ | ✓ View |
| Viewer | ✗ | ✗ | ✓ Summary |

**Features**
- Set annual budgets by category
- Monthly breakdown
- Variance tracking
- Alert thresholds
- Rollover settings

---

#### 15. Budget vs Actual Screen (Future)
| Role | View |
|------|------|
| Manager | ✓ All |
| Org Admin | ✓ All |
| Accountant | ✓ Own dept |
| Viewer | ✓ Summary |

**Shows**
- Budget vs actual by category
- Variance % and amount
- Trend graphs
- Forecast
- Exception items

---

### Financial Statement Screens (6)

#### 16. Final Account Screen (Balance Sheet)
| Role | View | Edit | Finalize |
|------|------|------|----------|
| All | ✓ | - | - |
| Org Admin | ✓ | - | ✓ |
| Manager | ✓ | - | ✗ |

**Shows**
- Assets (Current + Fixed)
- Liabilities (Current + Non-current)
- Equity
- Key ratios
- Comparisons (YoY)

---

#### 17. Profit & Loss Screen
| Role | View | Notes |
|------|------|-------|
| All | ✓ | - |
| Auditor | ✓ | + Audit annotations |

**Shows**
- Revenue
- COGS
- Gross Profit
- Operating Expenses
- EBIT
- Finance Costs
- PBT & Tax
- Net Profit

---

#### 18. Schedule - BS (Balance Sheet Detail)
| Role | View | Drill-down |
|------|------|-----------|
| All | ✓ | ✓ |
| Auditor | ✓ | ✓ |

**Shows**
- Detailed asset breakdown
- Liability breakdown
- Equity breakdown
- Schedule by Chart of Accounts

---

#### 19. Schedule - P&L (Profit & Loss Detail)
| Role | View |
|------|------|
| All | ✓ |

**Shows**
- Detailed income items
- Detailed expense items
- By Chart of Accounts
- Drill-down to transactions

---

#### 20. Cash Flow Statement Screen
| Role | View |
|------|------|
| All | ✓ |

**Shows**
- Operating activities
- Investing activities
- Financing activities
- Net cash flow
- Cash position

---

#### 21. Financial Statements Summary
| Role | View | Export | Send |
|------|------|--------|------|
| All | ✓ | ✓ | ✗ |
| Org Admin | ✓ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ Stakeholders |

---

### Reporting Screens (5)

#### 22. Reports Screen
| Role | Generate | Export | Schedule |
|------|----------|--------|----------|
| Accountant | ✓ Own | ✓ | ✗ |
| Manager | ✓ All | ✓ | ✓ |
| Org Admin | ✓ All | ✓ | ✓ |
| Auditor | ✓ Audit | ✓ | ✗ |

**Report Types**
- Transaction report
- Invoice aging
- Account summary
- GST summary
- Tax report

---

#### 23. Audit Reports Screen
| Role | Generate | Export | Sign-off |
|------|----------|--------|----------|
| Auditor | ✓ | ✓ | ✓ |
| Org Admin | ✓ View | ✓ | ✗ |
| Others | ✗ | ✗ | ✗ |

**Reports**
- Audit trail report
- Transaction audit
- Compliance report
- GST compliance
- Income tax report

---

#### 24. Activity Log Screen
| Role | View | Export |
|------|------|--------|
| Manager | ✓ Team | ✓ |
| Org Admin | ✓ All | ✓ |
| Super Admin | ✓ All orgs | ✓ |

**Shows**
- Who did what
- When it happened
- What changed
- Reason/comment
- Transaction details

---

#### 25. GST Reports Screen
| Role | Generate | File | Track |
|------|----------|------|-------|
| Accountant | ✓ | ✗ | ✓ |
| Org Admin | ✓ | ✓ | ✓ |
| Manager | ✓ | ✗ | ✓ |

**Reports**
- GSTR-1 (B2B Sales)
- GSTR-2 (B2B Purchases)
- GSTR-3B (Summary)
- Payment status

---

#### 26. Tax Reports Screen
| Role | Generate | Export |
|------|----------|--------|
| Accountant | ✓ | ✓ |
| Manager | ✓ | ✓ |
| Org Admin | ✓ | ✓ |
| Auditor | ✓ | ✓ View-only |

**Reports**
- Provisional tax
- Tax planning
- Deduction summary
- Credits/reliefs

---

### Settings & Admin Screens (1)

#### 27. Organization Settings Screen
| Role | View | Edit | Delete |
|------|------|------|--------|
| Org Admin | ✓ | ✓ | ✗ |
| Super Admin | ✓ | ✓ | ✓ |
| Manager | ✓ | ✗ | ✗ |
| Others | ✗ | ✗ | ✗ |

**Settings**
- Company info (name, GSTIN, PAN)
- Fiscal year setup
- Accounting standard
- Currency
- Language & timezone
- GST/TDS settings
- Notification preferences
- User roles & permissions
- Module access
- API integrations

---

## Summary Table

| Screen | Created | Read | Update | Delete | Key Actors |
|--------|---------|------|--------|--------|-----------|
| Snapshot | ✓ Org Admin | ✓ All | - | - | Dashboard |
| Inbox | ✓ Accountant | ✓ All | ✓ Creator | - | Data Entry |
| Invoices | ✓ Accountant | ✓ All | ✓ Creator | - | Invoice Mgmt |
| Bank Recon | ✓ System | ✓ Accountant | ✓ Accountant | - | Reconciliation |
| Approvals | - | ✓ Approver | ✓ Approver | - | Workflow |
| Reports | ✓ User | ✓ All | ✓ Owner | ✓ Org Admin | Reporting |
| Settings | - | ✓ Org Admin | ✓ Org Admin | - | Configuration |
