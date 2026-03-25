/**
 * Payroll to Financial Statements Integration
 * Automatically creates financial transactions from payroll processing
 */

import { Transaction } from '@/context/app-state';

export interface PayrollToFinancialTransactions {
  salaryExpenseTransaction: Transaction;
  pfPayableTransaction: Transaction;
  esiPayableTransaction: Transaction;
  ptPayableTransaction: Transaction;
  incomeTaxPayableTransaction: Transaction;
  bankPaymentTransaction: Transaction;
  allTransactions: Transaction[];
}

/**
 * Generate financial transactions from a payroll run
 * Creates double-entry bookkeeping entries automatically
 */
export function generatePayrollFinancialTransactions(
  payrollRunId: string,
  organizationId: string,
  payrollMonth: string,
  payrollData: {
    totalEmployees: number;
    totalGross: number;
    totalPF: number;
    totalESI: number;
    totalIncomeTax: number;
    totalPT: number;
    totalDeductions: number;
    totalNet: number;
    processingDate: string;
  }
): PayrollToFinancialTransactions {
  const baseDate = payrollData.processingDate;
  const description = `Salary & Wages - ${payrollMonth} (${payrollData.totalEmployees} employees)`;

  // 1. Salary Expense Transaction (Debit Expense, Credit Payable/Cash)
  const salaryExpenseTransaction: Transaction = {
    id: `payroll-salary-${payrollRunId}`,
    organizationId,
    date: baseDate,
    description: description,
    amount: payrollData.totalGross,
    isIncome: false,
    accountingType: 'Expense',
    subtype: 'Salary and Wages',
    adjustment: 'Full',
    gstSplit: { taxable: 0, gst: 0 },
    notes: `Payroll Run ID: ${payrollRunId} | Employees: ${payrollData.totalEmployees}`,
    status: 'Recorded',
    allocationStatus: 'Allocated',
    approvalStatus: 'approved',
  };

  // 2. PF Payable Transaction (Credit Liability)
  const pfPayableTransaction: Transaction = {
    id: `payroll-pf-${payrollRunId}`,
    organizationId,
    date: baseDate,
    description: `PF Contribution Payable - ${payrollMonth}`,
    amount: payrollData.totalPF,
    isIncome: false,
    accountingType: 'Liability',
    subtype: 'Employee Benefits Payable',
    adjustment: 'Full',
    gstSplit: { taxable: 0, gst: 0 },
    notes: `Payroll Run ID: ${payrollRunId} | PF Account Code: 3020 | Due within 21 days`,
    status: 'Recorded',
    allocationStatus: 'Allocated',
    approvalStatus: 'approved',
  };

  // 3. ESI Payable Transaction (Credit Liability)
  const esiPayableTransaction: Transaction = {
    id: `payroll-esi-${payrollRunId}`,
    organizationId,
    date: baseDate,
    description: `ESI Contribution Payable - ${payrollMonth}`,
    amount: payrollData.totalESI,
    isIncome: false,
    accountingType: 'Liability',
    subtype: 'Employee Benefits Payable',
    adjustment: 'Full',
    gstSplit: { taxable: 0, gst: 0 },
    notes: `Payroll Run ID: ${payrollRunId} | ESI Account Code: 8040 | Due within 21 days`,
    status: 'Recorded',
    allocationStatus: 'Allocated',
    approvalStatus: 'approved',
  };

  // 4. Income Tax Payable Transaction (Credit Liability)
  const incomeTaxPayableTransaction: Transaction = {
    id: `payroll-it-${payrollRunId}`,
    organizationId,
    date: baseDate,
    description: `Income Tax Withholding Payable - ${payrollMonth}`,
    amount: payrollData.totalIncomeTax,
    isIncome: false,
    accountingType: 'Liability',
    subtype: 'Tax Payable',
    adjustment: 'Full',
    gstSplit: { taxable: 0, gst: 0 },
    notes: `Payroll Run ID: ${payrollRunId} | TDS Account Code: 8030 | Deposit to ITD within 7 days`,
    status: 'Recorded',
    allocationStatus: 'Allocated',
    approvalStatus: 'approved',
  };

  // 5. PT Payable Transaction (Credit Liability) - if applicable
  const ptPayableTransaction: Transaction = {
    id: `payroll-pt-${payrollRunId}`,
    organizationId,
    date: baseDate,
    description: `Professional Tax Payable - ${payrollMonth}`,
    amount: payrollData.totalPT,
    isIncome: false,
    accountingType: 'Liability',
    subtype: 'Tax Payable',
    adjustment: 'Full',
    gstSplit: { taxable: 0, gst: 0 },
    notes: `Payroll Run ID: ${payrollRunId} | PT Account Code: 8050 | Due by 5th of next month`,
    status: 'Recorded',
    allocationStatus: 'Allocated',
    approvalStatus: 'approved',
  };

  // 6. Bank Payment Transaction (Debit Bank, Credit Payable)
  // This will be created when salary is actually paid
  const bankPaymentTransaction: Transaction = {
    id: `payroll-bank-${payrollRunId}`,
    organizationId,
    date: baseDate,
    description: `Salary Transfer - ${payrollMonth}`,
    amount: payrollData.totalNet,
    isIncome: false,
    accountingType: 'Asset',
    subtype: 'Bank Transfer',
    adjustment: 'Full',
    gstSplit: { taxable: 0, gst: 0 },
    notes: `Payroll Run ID: ${payrollRunId} | Net amount transferred to employee bank accounts`,
    status: 'Recorded',
    allocationStatus: 'Allocated',
    approvalStatus: 'approved',
  };

  const allTransactions = [
    salaryExpenseTransaction,
    pfPayableTransaction,
    esiPayableTransaction,
    incomeTaxPayableTransaction,
    ptPayableTransaction,
    bankPaymentTransaction,
  ];

  return {
    salaryExpenseTransaction,
    pfPayableTransaction,
    esiPayableTransaction,
    ptPayableTransaction,
    incomeTaxPayableTransaction,
    bankPaymentTransaction,
    allTransactions,
  };
}

/**
 * Calculate financial statement impact from payroll
 * Returns the P&L and Balance Sheet impacts
 */
export function calculatePayrollFinancialImpact(payrollData: {
  totalGross: number;
  totalPF: number;
  totalESI: number;
  totalIncomeTax: number;
  totalPT: number;
  totalDeductions: number;
  totalNet: number;
}) {
  return {
    // P&L Impact (all are expenses/reductions)
    pAndLImpact: {
      operatingExpenseIncrease: payrollData.totalGross, // Salary & Wages expense
      employeeBenefitIncrease: payrollData.totalPF + payrollData.totalESI, // PF + ESI as employee benefits
      netProfitDecrease: payrollData.totalGross, // Total reduction in net profit
    },

    // Balance Sheet Impact (liabilities increase, cash decreases)
    balanceSheetImpact: {
      assetsDecrease: payrollData.totalNet, // Cash outflow for salary payment
      liabilitiesIncrease: {
        pfPayable: payrollData.totalPF,
        esiPayable: payrollData.totalESI,
        incomeTaxPayable: payrollData.totalIncomeTax,
        ptPayable: payrollData.totalPT,
        totalPayablesIncrease: payrollData.totalDeductions,
      },
      equityDecrease: payrollData.totalGross, // Retained earnings decrease
    },

    // Cash Flow Impact
    cashFlowImpact: {
      operatingCashOutflow: payrollData.totalNet, // Immediate salary payment
      taxPaymentCashOutflow: payrollData.totalIncomeTax, // When tax is deposited
      pfPaymentCashOutflow: payrollData.totalPF, // When PF is deposited
      esiPaymentCashOutflow: payrollData.totalESI, // When ESI is deposited
    },
  };
}

/**
 * Generate P&L line items for payroll display in financial statements
 */
export function generatePayrollPLLineItems(payrollData: {
  totalGross: number;
  totalPF: number;
  totalESI: number;
}) {
  return {
    lineItems: [
      {
        code: '3010',
        name: 'Salary and Wages',
        amount: payrollData.totalGross,
        category: 'Operating Expenses',
        section: 'Employee Benefits Expense',
      },
      {
        code: '3030',
        name: 'PF Contribution',
        amount: payrollData.totalPF,
        category: 'Operating Expenses',
        section: 'Employee Benefits Expense',
      },
      {
        code: '3030',
        name: 'ESI Contribution',
        amount: payrollData.totalESI,
        category: 'Operating Expenses',
        section: 'Employee Benefits Expense',
      },
    ],
    totalEmployeeBenefitsExpense: payrollData.totalGross + payrollData.totalPF + payrollData.totalESI,
  };
}

/**
 * Reconcile payroll with financial statement totals
 * Ensures payroll matches the financial records
 */
export function reconcilePayrollWithFinancials(
  payrollRecords: Array<{ grossSalary: number; netSalary: number; deductions: number }>,
  financialTransactions: Transaction[]
) {
  const payrollTotal = payrollRecords.reduce((sum, record) => sum + record.grossSalary, 0);
  const financialTotal = financialTransactions
    .filter(t => t.subtype === 'Salary and Wages')
    .reduce((sum, t) => sum + t.amount, 0);

  const isReconciled = Math.abs(payrollTotal - financialTotal) < 1; // Allow 1 paise variance

  return {
    payrollTotal,
    financialTotal,
    variance: payrollTotal - financialTotal,
    isReconciled,
    reconciliationStatus: isReconciled ? 'Matched' : 'Variance - Review Required',
  };
}

/**
 * Generate compliance report from payroll for statutory filings
 */
export function generatePayrollComplianceReport(
  payrollData: {
    totalGross: number;
    totalPF: number;
    totalESI: number;
    totalIncomeTax: number;
    totalPT: number;
    employeeCount: number;
    payrollMonth: string;
  }
) {
  return {
    month: payrollData.payrollMonth,
    employeeCount: payrollData.employeeCount,
    
    // PF Filing (Form 5 - ESIC)
    pfFiling: {
      totalContribution: payrollData.totalPF,
      employeeContribution: payrollData.totalPF * 0.5, // 50% employee share
      employerContribution: payrollData.totalPF * 0.5, // 50% employer share
      dueDate: '21st of next month',
      filingStatus: 'Pending',
    },

    // ESI Filing
    esiFiling: {
      totalContribution: payrollData.totalESI,
      employerContribution: payrollData.totalESI * 0.75, // 75% employer share
      employeeContribution: payrollData.totalESI * 0.25, // 25% employee share
      dueDate: '21st of next month',
      filingStatus: 'Pending',
    },

    // Income Tax withholding
    incomeTaxFiling: {
      totalTDS: payrollData.totalIncomeTax,
      deposityBy: '7th of next month',
      formNo: '16A',
      filingStatus: 'Pending',
    },

    // Professional Tax
    ptFiling: {
      totalPT: payrollData.totalPT,
      dueDate: '5th of next month',
      filingStatus: payrollData.totalPT > 0 ? 'Pending' : 'Not Applicable',
    },

    // Summary
    totalStatutoryDeductions: payrollData.totalPF + payrollData.totalESI + payrollData.totalIncomeTax + payrollData.totalPT,
    complianceStatus: 'On Track',
  };
}
