# PAYROLL MANAGEMENT SYSTEM - DESIGN & INTEGRATION PLAN

## 1. PAYROLL MODULE OVERVIEW

### 1.1 Purpose
Automate employee salary management, statutory deductions, compliance, and integration with financial statements for Indian companies.

### 1.2 Key Features
- Employee & salary structure management
- Automatic salary calculation & slip generation
- Statutory deductions (PF, ESI, TDS, PT)
- Attendance & leave management
- Tax calculations
- Compliance reporting (Form 16, DSC, Monthly returns)
- Integration with invoice/expense tracking
- Bank reconciliation for salary transfers

### 1.3 Compliance Standards
- Income Tax Act, 1961
- Employees' Provident Fund Scheme (EPF)
- Employee State Insurance Act (ESI)
- Professional Tax (PT) - state-wise
- Gratuity Act
- Labor Laws (Attendance, Leave)

---

## 2. DATA STRUCTURES

### 2.1 Core Entities

```typescript
// Employee Master
interface Employee {
  id: string;
  organizationId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pan: string;
  aadhar: string;
  dob: string;
  gender: 'M' | 'F' | 'Other';
  joiningDate: string;
  departmentId: string;
  designationId: string;
  reportingManager: string;
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountType: 'Savings' | 'Current';
  };
  status: 'Active' | 'Inactive' | 'On Leave' | 'Separated';
  separationDate?: string;
  baseCtc: number; // Annual CTC
  createdDate: string;
}

// Salary Structure
interface SalaryStructure {
  id: string;
  organizationId: string;
  employeeId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  payrollFrequency: 'Monthly' | 'Weekly' | 'Fortnightly';
  components: {
    basic: number;
    da: number; // Dearness Allowance
    hra: number; // House Rent Allowance
    conveyance: number;
    medical: number;
    otherAllowances: number;
  };
  deductions: {
    pfContribution: number; // Employee contribution
    esiContribution: number;
    incomeTax: number;
    professionTax: number;
    otherDeductions: number;
  };
  earnedLeaves: number;
  sickLeaves: number;
}

// Salary Slip / Payroll Record
interface PayrollRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  payrollMonth: string; // 'YYYY-MM'
  payrollDate: string; // Actual salary disbursement date
  grossSalary: number;
  earnings: {
    basic: number;
    da: number;
    hra: number;
    conveyance: number;
    medical: number;
    otherAllowances: number;
    earnedLeaveEncashment: number;
  };
  deductions: {
    pfEmployee: number;
    pfEmployer: number; // For compliance tracking
    esiEmployee: number;
    esiEmployer: number;
    incomeTax: number;
    professionTax: number;
    otherDeductions: number;
  };
  netSalary: number;
  attendance: {
    workingDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    paidLeaves: number;
    unpaidLeaves: number;
  };
  status: 'Draft' | 'Generated' | 'Approved' | 'Processed' | 'Paid';
  approvedBy?: string;
  approvalDate?: string;
  processedDate?: string;
  paidDate?: string;
  bankTransferRef?: string;
  notes?: string;
}

// Attendance Record
interface AttendanceRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Holiday' | 'WeekOff';
  leaveType?: 'Paid' | 'Unpaid' | 'Sick' | 'Casual' | 'Earned';
  hoursWorked?: number;
  remarks?: string;
}

// Leave Balance
interface LeaveBalance {
  id: string;
  organizationId: string;
  employeeId: string;
  year: string; // Financial year
  earnedLeaves: { allocated: number; used: number; balance: number };
  sickLeaves: { allocated: number; used: number; balance: number };
  casualLeaves: { allocated: number; used: number; balance: number };
  unpaidLeaves: { allocated: number; used: number; balance: number };
  maternity: { allocated: number; used: number; balance: number };
}

// Tax Settings (Organization-level)
interface TaxSettings {
  id: string;
  organizationId: string;
  state: string;
  pfRegistration: string;
  esiRegistration: string;
  pfDeductionRate: number; // 12% default
  esiThreshold: number; // Rs 21000 limit
  ptSlabs: Array<{
    salaryRange: { from: number; to: number };
    rate: number;
  }>;
  tdsRates: Record<string, number>; // Slabs as per income tax
  gratuityFactor: number; // Days per year
  esiEnabled: boolean;
  pfEnabled: boolean;
  ptEnabled: boolean;
}
```

### 2.2 Financial Integration

```typescript
// Payroll Expense (Auto-created transaction)
interface PayrollExpense {
  id: string;
  organizationId: string;
  payrollRecordId: string;
  transactionDate: string;
  expenses: {
    salaryExpense: {
      transactionId: string;
      amount: number;
      account: 'Salary Expense' | '3010' // Chart of Accounts code
    };
    pfExpense: {
      transactionId: string;
      amount: number; // Employer contribution
      account: 'Employee Benefits Expense'
    };
    esiExpense: {
      transactionId: string;
      amount: number; // Employer contribution
      account: 'Employee Benefits Expense'
    };
  };
  liabilities: {
    pfPayable: {
      transactionId: string;
      amount: number;
      account: 'Employee Benefits Payable' | '8040'
    };
    esiPayable: {
      transactionId: string;
      amount: number;
      account: 'Employee Benefits Payable'
    };
    taxPayable: {
      transactionId: string;
      amount: number;
      account: 'Tax Deductible'
    };
  };
  bankTransfer: {
    transactionId: string;
    amount: number;
    fromAccountId: string;
    toAccountId: string; // Salary account or direct employee transfers
    date: string;
  };
}
```

---

## 3. LEFT MENU STRUCTURE

### 3.1 Proposed Menu Category

```
PAYROLL MANAGEMENT (New Category)
├── Employees
├── Salary Structures
├── Payroll Processing
├── Attendance & Leaves
├── Salary Slips
├── Compliance & Reports
└── Payroll Settings
```

### 3.2 Menu Items Details

| Item | Purpose | Key Features |
|------|---------|--------------|
| **Employees** | Employee master management | Add/edit employees, bank details, tax info, separation |
| **Salary Structures** | Define salary components | Create structure templates, multiple structures per employee |
| **Payroll Processing** | Generate payroll | Monthly salary processing, bulk generation, approval workflow |
| **Attendance & Leaves** | Track attendance | Daily attendance, leave requests, leave approval, balance tracking |
| **Salary Slips** | View/Generate slips | Generate PDF slips, email to employees, archive |
| **Compliance & Reports** | Tax & statutory reports | Form 16, Form 16A, DSC, Monthly returns, PF statements |
| **Payroll Settings** | Config management | Tax slabs, PF/ESI rates, company holidays, working days |

---

## 4. INTEGRATION WITH EXISTING SYSTEMS

### 4.1 With Financial Statements (P&L)

```
Payroll → Employee Benefits Expense
├── Salary Expense (3010): Basic + Allowances
├── Gratuity & Severance (3020): Gratuity provision
├── Staff Welfare (3030): Medical, insurance
└── Employer Contributions
    ├── PF Employer (3030): 13% of basic
    └── ESI Employer (3030): 3.25% up to salary limit
```

**Data Flow:**
```
Payroll Processing
    ↓
Create Transactions (Auto)
    ├── Salary Expense Transaction (Dr: 3010)
    ├── PF Payable (Cr: 8040)
    ├── ESI Payable (Cr: 8040)
    ├── Tax Payable (Cr: Tax Deductible)
    └── Bank Transfer (Cr: Bank)
    ↓
Updated in Financial Statements
    ├── P&L shows Salary as expense
    ├── Balance Sheet shows payables
    └── Cash Flow shows outflows
```

### 4.2 With Bank Reconciliation

```
Salary Payment → Bank Transaction
├── Match employee ID with bank transfer
├── Mark as "Payroll" category
├── Auto-reconcile with payroll record
└── Create bank transaction in Inbox
    ↓
Bank Reconciliation Screen
    ├── Show payroll transfers
    ├── Mark as reconciled
    └── Track pending transfers
```

### 4.3 With Invoice/Expense Tracking

```
Payroll Expense → Similar to vendor payments
├── Create "Salary Payable" invoice
├── Link to multiple transactions (one per employee)
├── Track payments
└── Status: Pending → Paid (upon bank transfer)
```

### 4.4 With Approval Workflow

```
Payroll Approval Chain:
├── Accountant: Creates payroll draft
├── Manager/HR: Approves attendance
├── Admin: Approves payroll release
└── Finance: Verifies bank transfer
```

### 4.5 With Tax/Compliance

```
Payroll Data → Compliance Module
├── Track TDS collected
├── Calculate annual income for Form 16
├── Monthly DSC filing data
├── PF/ESI statements generation
└── PT calculations (state-wise)
```

### 4.6 With Vendor Management

```
Employees ≈ Special Vendor Type
├── Employee created as vendor
├── Payment terms: Monthly on salary date
├── GST: Not applicable (employee)
├── TDS: Applicable (income tax)
└── Auto-payment on payroll processing
```

### 4.7 With Budget Management

```
Salary Budget → Budget Tracking
├── Set monthly salary budget
├── Compare against payroll
├── Track variance
└── Alert if overspend
```

---

## 5. SCREEN DESIGNS & DATA FLOW

### 5.1 Employees Screen

**Purpose:** Manage employee master data

**Key Sections:**
- Employee list (table with search/filter)
- Employee details (add/edit modal)
- Bank account mapping
- Tax information
- Document upload

**Data Flow:**
```
Create Employee
    ↓
Save to Employee[] in AppState
    ↓
Create Default Leave Balances
    ↓
Create Tax Settings (copy from org defaults)
    ↓
Display in employee list
```

**Actions:** Add, Edit, View Details, Deactivate, Export

---

### 5.2 Salary Structure Screen

**Purpose:** Define salary components for employees

**Key Sections:**
- Structure list
- Create new structure (form-based)
- Component breakdown
- Cost breakdown

**Data Flow:**
```
Create Salary Structure
    ↓
Link to Employee
    ↓
Calculate gross salary:
  Gross = Basic + DA + HRA + Conveyance + Medical + Other
    ↓
Store in SalaryStructure[]
    ↓
Used in Payroll Processing
```

**Formula:**
```
Gross CTC = (Basic × 12 + Allowances × 12) / 12
Employee PF = Basic × 12%
Employer PF = Basic × 13%
```

---

### 5.3 Payroll Processing Screen

**Purpose:** Monthly payroll generation and approval

**Key Sections:**
- Month selector
- Employee filter
- Payroll status table
- Bulk actions

**Data Flow:**
```
Month Selection (e.g., "Feb 2024")
    ↓
Load all active employees
    ↓
For each employee:
  1. Get attendance data
  2. Apply salary structure
  3. Calculate deductions (PF, ESI, TDS, PT)
  4. Generate payroll record
    ↓
Display summary:
  - Gross salary total
  - Deductions total
  - Net salary total
  - Employer contribution total
    ↓
Approval Chain:
  HR Manager → Accountant → Finance
    ↓
On Approval:
  1. Create expense transactions
  2. Create liability transactions
  3. Create bank transfer transactions
  4. Mark status as "Processed"
    ↓
Payroll becomes part of P&L
```

**Calculation Algorithm:**
```
For each employee:
  1. Get basic + allowances
  2. Multiply by attendance %: Salary × (Present Days / Working Days)
  3. Add/Subtract adjustments
  4. Deduct PF: (Basic × 12%) capped at max
  5. Deduct ESI: if salary < 21000 then (Salary × 4.75%)
  6. Deduct TDS: based on income tax slabs
  7. Deduct PT: state-wise slabs
  8. Deduct other: loan recovery, advances
  9. Net Salary = Gross - Total Deductions
```

---

### 5.4 Attendance & Leaves Screen

**Purpose:** Track daily attendance and manage leave requests

**Key Sections:**
- Calendar view (daily attendance)
- Leave balance summary
- Leave request form
- Leave approval queue

**Data Flow:**
```
Employee marks attendance (Daily)
    ↓
Store in AttendanceRecord[]
    ↓
Leave Request (Employee)
    ↓
Goes to LeaveApproval queue
    ↓
HR/Manager approves
    ↓
Update LeaveBalance[]
    ↓
Used in Payroll calculation:
  - Present days
  - Leave days
  - Calculation of leave encashment
```

---

### 5.5 Salary Slips Screen

**Purpose:** View and manage salary slips

**Key Sections:**
- Slip list (employee filter, month selector)
- Slip viewer (PDF preview)
- Download/Email options

**Data Flow:**
```
Payroll Processed
    ↓
Generate Salary Slip HTML
    ↓
Store slip data with PayrollRecord
    ↓
On Access:
  1. Generate PDF (dynamic)
  2. Show earnings breakdown
  3. Show deductions breakdown
  4. Show net salary
  5. Show bank details
    ↓
Actions:
  - Download PDF
  - Email to employee
  - Archive
```

---

### 5.6 Compliance & Reports Screen

**Purpose:** Generate tax and statutory reports

**Key Sections:**
- Report selector dropdown
- Date range selector
- Report preview/download

**Reports to Generate:**

| Report | Purpose | Frequency | Data Source |
|--------|---------|-----------|-------------|
| **Form 16** | Annual tax certificate | Yearly | PayrollRecord (cumulative) |
| **Form 16A** | TDS certificate | Yearly | Deductions |
| **DSC** | Monthly tax deposit | Monthly | PF + ESI + TDS |
| **FORM 12BA** | Professional tax monthly | Monthly | PT deductions |
| **EPF Statement** | Employee PF details | Monthly | PF deductions |
| **Salary Register** | Monthly payroll summary | Monthly | PayrollRecord[] |

**Data Flow for Form 16:**
```
Select Employee + Year
    ↓
Filter PayrollRecords for that year
    ↓
Calculate:
  - Total Earnings
  - Total Salary
  - Total TDS deducted
  - Total PF contributed
    ↓
Generate Form 16 PDF
  - Pre-filled with employee & org data
  - Auto-calculated values
  - Ready to sign and submit
```

---

### 5.7 Payroll Settings Screen

**Purpose:** Configure tax and compliance settings

**Key Sections:**
- Organization tax details
- Statutory rates
- Tax slabs
- Company calendar
- Working days config

**Data Stored:**
```
TaxSettings:
  - PF Registration #
  - ESI Registration #
  - State (for PT calculation)
  - PF rates (employee/employer)
  - ESI threshold
  - Professional tax slabs
  - TDS slabs
  - Company holidays
  - Working days per week
```

---

## 6. MENU INTEGRATION IMPLEMENTATION

### 6.1 Add to Navigation Categories

**Current structure in app-shell.tsx:**
```javascript
navCategories = [
  { id: 'dashboard', label: 'DASHBOARD', items: [...] },
  { id: 'operations', label: 'CORE OPERATIONS', items: [...] },
  { id: 'cash', label: 'CASH MANAGEMENT', items: [...] },
  { id: 'obligations', label: 'COMPLIANCE & OBLIGATIONS', items: [...] },
  { id: 'automation', label: 'AUTOMATION & PLANNING', items: [...] },
  { id: 'analysis', label: 'ANALYSIS & REPORTS', items: [...] },
  // NEW:
  { id: 'payroll', label: 'PAYROLL MANAGEMENT', items: [
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'salary-structures', label: 'Salary Structures', icon: Target },
    { id: 'payroll-process', label: 'Payroll Processing', icon: Clock },
    { id: 'attendance', label: 'Attendance & Leaves', icon: Calendar },
    { id: 'salary-slips', label: 'Salary Slips', icon: FileText },
    { id: 'payroll-compliance', label: 'Compliance & Reports', icon: BarChart3 },
    { id: 'payroll-settings', label: 'Payroll Settings', icon: Settings },
  ], defaultExpanded: false },
  // EXISTING:
  { id: 'approvals', label: 'TEAM & APPROVALS', items: [...] },
  { id: 'admin', label: 'ADMINISTRATION', items: [...] },
]
```

### 6.2 Position in Menu

**Location:** Between "COMPLIANCE & OBLIGATIONS" and "ANALYSIS & REPORTS"

**Rationale:**
- Payroll is an obligatory compliance area (PF, ESI, TDS)
- Data needed for financial statements
- Reports derived from payroll
- Organized hierarchically: Obligations → Payroll → Analysis

---

## 7. STATE MANAGEMENT ADDITIONS

### 7.1 Extend AppState Interface

```typescript
export interface AppState {
  // ... existing ...
  
  // PAYROLL DATA
  employees: Employee[];
  salaryStructures: SalaryStructure[];
  payrollRecords: PayrollRecord[];
  attendanceRecords: AttendanceRecord[];
  leaveBalances: LeaveBalance[];
  taxSettings: TaxSettings;
  payrollExpenses: PayrollExpense[];
}
```

### 7.2 New Context Methods

```typescript
// Employee management
addEmployee(employee: Employee)
updateEmployee(id: string, updates: Partial<Employee>)
deactivateEmployee(id: string, date: string)
getActiveEmployees(): Employee[]

// Salary structure
createSalaryStructure(structure: SalaryStructure)
updateSalaryStructure(id: string, updates: Partial<SalaryStructure>)
getEmployeeSalaryStructure(employeeId: string): SalaryStructure

// Payroll processing
generatePayroll(month: string, organizationId: string): PayrollRecord[]
calculateNetSalary(employeeId: string, month: string): PayrollRecord
approvePayroll(payrollIds: string[], approver: string)
processPayroll(payrollIds: string[]): void
  - Create transactions
  - Create bank transfers
  - Update financial data

// Attendance
recordAttendance(record: AttendanceRecord)
requestLeave(employeeId: string, startDate: string, endDate: string, type: string)
approveLeave(leaveRequestId: string)
getAttendance(employeeId: string, month: string): AttendanceRecord[]
updateLeaveBalance(employeeId: string, updates: Partial<LeaveBalance>)

// Tax & Compliance
updateTaxSettings(settings: TaxSettings)
generateForm16(employeeId: string, year: string): PDF
generateDSC(month: string): PDF
calculateTDS(salary: number): number
calculatePT(salary: number, state: string): number
```

---

## 8. INTEGRATION POINTS WITH EXISTING MODULES

### 8.1 With Inbox (Transaction Entry)

```
When payroll is processed:
  1. Create multiple expense transactions
  2. Each appears in Inbox with type: "Payroll"
  3. Can be matched to actual bank transfers
  4. Accountant can review and approve
```

### 8.2 With Invoices Screen

```
Option: Show "Payroll as Payable"
  - Create payable invoice for salary
  - Employee is "vendor"
  - Invoice amount = net salary
  - Status: Pending → Paid
```

### 8.3 With Bank Reconciliation

```
When salary is transferred:
  1. Create bank transaction
  2. Mark as "Payroll" category
  3. Link to payroll record
  4. Bank rec screen shows:
     - All salary transfers
     - Reconciliation status
     - Unreconciled amounts
```

### 8.4 With Financial Statements

```
P&L automatically updated:
  - Employee Benefits Expense (3010, 3020, 3030)
  - Depreciation section
  - Other Expenses: Employer PF/ESI

Balance Sheet:
  - Current Liabilities
  - Salary Payable (8040)
  - Employee Benefits Payable (8040)
  - Gratuity Liability (future provision)
```

### 8.5 With Approval Workflow

```
Payroll Approval Chain:
  1. HR creates payroll (draft)
  2. Manager approves attendance
  3. Accountant approves deductions
  4. Finance authorizes payment
  5. On final approval:
     - Transactions created
     - Bank transfer initiated
     - Salary slips generated
```

### 8.6 With Compliance Module

```
Compliance items automatically created:
  - Monthly DSC filing
  - Monthly PT return
  - Quarterly ESI return
  - Yearly Form 16 generation
  
Auto-linked to payroll data:
  - No manual data entry needed
  - Forms pre-filled
  - Audit trail maintained
```

### 8.7 With Budget Management

```
Salary Budget vs Actual:
  - Set monthly salary budget
  - Compare with actual payroll
  - Alert on variance
  - Year-end analysis
```

---

## 9. PHASE-WISE IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)
- Create Employee data structure
- Build Employees management screen
- Extend AppState with payroll entities
- Add payroll menu to sidebar

### Phase 2: Salary Management (Weeks 3-4)
- Create salary structure templates
- Build salary structure UI
- Implement salary calculation engine
- Link to employee records

### Phase 3: Payroll Processing (Weeks 5-7)
- Implement payroll calculation algorithm
- Build payroll processing screen
- Create approval workflow integration
- Auto-generate transactions

### Phase 4: Attendance & Leaves (Weeks 8-9)
- Build attendance tracking UI
- Implement leave request system
- Create leave approval workflow
- Integrate with payroll calculations

### Phase 5: Reports & Compliance (Weeks 10-12)
- Implement salary slip generation
- Create Form 16 generation
- Build DSC report
- Integrate with compliance module

### Phase 6: Optimization (Weeks 13-16)
- Bank reconciliation integration
- Budget integration
- Performance optimization
- Testing & bug fixes

---

## 10. KEY INTEGRATION TOUCHPOINTS

### 10.1 Transaction Creation During Payroll Processing

```
For each payroll record:
  Create 5 Transactions:
  
  1. Salary Expense (Dr)
     amount: Gross Salary
     account: 3010 (Salary)
     date: payroll date
     
  2. PF Payable (Cr)
     amount: Total PF (emp + employer)
     account: 8040 (Employee Benefits Payable)
     
  3. ESI Payable (Cr)
     amount: Total ESI
     account: 8040
     
  4. Tax Payable (Cr)
     amount: TDS + PT
     account: Tax Deductible
     
  5. Bank Transfer (Cr)
     amount: Net Salary
     account: 7010 (Bank)
     
  All linked to PayrollRecordId for traceability
```

### 10.2 Financial Statement Impact

```
P&L Line Items Updated:
  - Employee Benefits Expense (3010): +Gross Salary
  - Employee Benefits Expense (3020): +Gratuity Prov
  - Employee Benefits Expense (3030): +Employer PF/ESI
  - Finance Costs: +Interest on loans (if any)
  
Cash Flow:
  - Operating: -Net Salary paid
  - -Statutory: -PF/ESI/Tax payables
  
Balance Sheet:
  - Liabilities: Employee Benefits Payable
  - Cash: Reduced by net salary
```

### 10.3 Compliance Reporting Connection

```
Payroll Data → Compliance Forms
  
  Employee income → Form 16 Pre-fill
  TDS deducted → Form 16A
  Monthly PF/ESI → DSC filing
  Gross salary → EPF statement
  Professional tax → PT monthly return
  Attendance → Labor law compliance
```

---

## 11. SECURITY & AUDIT REQUIREMENTS

### 11.1 Role-Based Access

| Action | Super Admin | Org Admin | Accountant | Manager | Auditor |
|--------|:-----------:|:---------:|:----------:|:-------:|:-------:|
| Add Employee | ✓ | ✓ | ✗ | ✗ | ✗ |
| Edit Salary | ✓ | ✓ | ✓ | ✗ | ✗ |
| Approve Payroll | ✓ | ✓ | ✓ | ✓ | ✗ |
| Process Payroll | ✓ | ✓ | ✓ | ✗ | ✗ |
| View Slips | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export Reports | ✓ | ✓ | ✓ | ✓ | ✓ |
| Modify History | ✓ | ✗ | ✗ | ✗ | ✗ |

### 11.2 Audit Trail

```
Track for every payroll action:
  - Who created/modified
  - When (timestamp)
  - What changed (before/after)
  - Approval chain
  - Bank transfer confirmation
  
Immutable once approved & processed
```

### 11.3 Data Protection

```
Employee data contains:
  - PAN, Aadhar (sensitive)
  - Bank account details
  - Salary information
  
Encryption needed for:
  - At rest (database)
  - In transit (API)
  - PII fields
```

---

## 12. SUMMARY TABLE

| Aspect | Details |
|--------|---------|
| **Menu Location** | New "PAYROLL MANAGEMENT" category in left sidebar |
| **Menu Items** | 7 items (Employees, Salary, Processing, Attendance, Slips, Compliance, Settings) |
| **New Data Entities** | 6 main (Employee, SalaryStructure, PayrollRecord, Attendance, LeaveBalance, TaxSettings) |
| **Integration Points** | 7 (Financial Statements, Bank Rec, Invoices, Approvals, Compliance, Budget, Vendors) |
| **Key Workflows** | Monthly payroll → Transactions → P&L update → Bank transfer → Compliance reports |
| **Implementation Time** | 16 weeks (phased) |
| **Compliance Standards** | Income Tax, PF, ESI, PT, Gratuity, Labor Laws |
| **User Roles** | Super Admin, Org Admin, Accountant, Manager, Auditor |

---

## END OF PAYROLL DESIGN PLAN

This plan provides a complete architectural design for integrating a comprehensive payroll management system into Warrior Finance while maintaining seamless integration with existing financial statement generation, compliance, and approval workflows.
