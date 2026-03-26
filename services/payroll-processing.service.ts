import { ApprovalChainService } from './approval-chain.service';
import { BankAccountFlowService } from './bank-account-flow.service';

/**
 * Payroll Processing Service
 * Handles complete payroll workflow connected to bank account
 * Flow: Salary Structure -> Approval -> Bank Debit -> Employee Payment
 */

export interface Employee {
  id: string;
  name: string;
  designation: string;
  baseSalary: number;
  bankAccount?: string;
  department: string;
}

export interface PayrollRun {
  id: string;
  organizationId: string;
  month: string; // YYYY-MM
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  employees: PayrollEntry[];
  totalSalary: number;
  totalDeductions: number;
  netPayable: number;
  approvalStatus: string;
  approvalLevel?: 'NONE' | 'MANAGER' | 'ADMIN' | 'ADMIN_AUDITOR';
  bankAccountId: string;
  bankTransactionId?: string;
  paymentDate?: Date;
}

export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  allowances: {
    hra: number;
    dearness: number;
    special: number;
  };
  deductions: {
    providentFund: number;
    tax: number;
    insurance: number;
    other: number;
  };
  grossSalary: number;
  netSalary: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentReferenceId?: string;
}

export interface SalaryBudget {
  departmentId: string;
  departmentName: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number; // Actual - Budgeted
  variancePercent: number;
  status: 'ON_TRACK' | 'OVER_BUDGET' | 'UNDER_BUDGET';
}

export class PayrollProcessingService {
  private approvalService: ApprovalChainService;
  private bankFlowService: BankAccountFlowService;

  constructor(
    approvalService: ApprovalChainService,
    bankFlowService: BankAccountFlowService
  ) {
    this.approvalService = approvalService;
    this.bankFlowService = bankFlowService;
  }

  /**
   * Create payroll run from employee salary structures
   * Status: DRAFT -> Ready for approval
   */
  async createPayrollRun(
    organizationId: string,
    month: string,
    employees: Employee[],
    bankAccountId: string
  ): Promise<PayrollRun> {
    console.log(`[Payroll] Creating payroll run for ${month}, ${employees.length} employees`);

    const payrollEntries = employees.map((emp) => this.calculateSalary(emp));
    const totalSalary = payrollEntries.reduce((sum, e) => sum + e.netSalary, 0);
    const totalDeductions = payrollEntries.reduce((sum, e) => sum + this.getTotalDeductions(e), 0);

    const payrollRun: PayrollRun = {
      id: `PR_${organizationId}_${month}`,
      organizationId,
      month,
      status: 'DRAFT',
      employees: payrollEntries,
      totalSalary,
      totalDeductions,
      netPayable: totalSalary,
      approvalStatus: 'PENDING',
      bankAccountId,
    };

    console.log(`[Payroll] Created payroll: ${payrollRun.id}, Net Payable: ₹${totalSalary}`);
    return payrollRun;
  }

  /**
   * Submit payroll for approval
   * Triggers approval chain based on total salary amount
   * Status: DRAFT -> SUBMITTED
   */
  async submitForApproval(payrollRun: PayrollRun): Promise<{
    payrollRun: PayrollRun;
    approvalLevel: string;
    assignedTo: string;
  }> {
    console.log(`[Payroll] Submitting payroll for approval: ${payrollRun.id}`);

    // Determine approval level based on total salary amount
    const approvalLevel = this.approvalService.determineApprovalLevel(
      payrollRun.totalSalary,
      'Payroll'
    );

    payrollRun.status = 'SUBMITTED';
    payrollRun.approvalLevel = approvalLevel;
    payrollRun.approvalStatus = 'AWAITING_APPROVAL';

    console.log(`[Payroll] Approval level required: ${approvalLevel}`);

    return {
      payrollRun,
      approvalLevel,
      assignedTo: this.getApproverRole(approvalLevel),
    };
  }

  /**
   * Approve payroll run
   * Status: SUBMITTED -> APPROVED
   * Note: Still not processed to bank yet - that's a separate step
   */
  async approvePayroll(
    payrollRun: PayrollRun,
    approvedBy: string,
    approvalLevel: string
  ): Promise<PayrollRun> {
    console.log(
      `[Payroll] Approving payroll: ${payrollRun.id} by ${approvedBy} at level ${approvalLevel}`
    );

    // Validate this approval level matches required level
    if (payrollRun.approvalLevel !== approvalLevel) {
      throw new Error(
        `Invalid approval level. Expected: ${payrollRun.approvalLevel}, Got: ${approvalLevel}`
      );
    }

    payrollRun.status = 'APPROVED';
    payrollRun.approvalStatus = 'APPROVED';

    console.log(`[Payroll] Payroll approved. Ready for processing to bank.`);
    return payrollRun;
  }

  /**
   * Process approved payroll - Actual bank debit happens here
   * Status: APPROVED -> PROCESSED
   * Flow: Bank Account -> Debit Total Salary -> Allocate to Employees
   */
  async processPayrollToBank(payrollRun: PayrollRun): Promise<{
    payrollRun: PayrollRun;
    bankTransactionId: string;
    allocations: Array<{
      employeeId: string;
      amount: number;
      status: string;
    }>;
  }> {
    console.log(`[Payroll] Processing payroll to bank: ${payrollRun.id}`);

    // Step 1: Validate payroll is approved
    if (payrollRun.status !== 'APPROVED') {
      throw new Error(`Cannot process payroll with status: ${payrollRun.status}`);
    }

    // Step 2: Debit from bank account
    const bankResult = await this.bankFlowService.processPayrollDebit(
      payrollRun.bankAccountId,
      payrollRun.id,
      payrollRun.netPayable,
      payrollRun.employees.map((emp) => ({
        employeeId: emp.employeeId,
        amount: emp.netSalary,
      }))
    );

    if (!bankResult.success) {
      throw new Error(`Bank debit failed. Insufficient balance: ₹${bankResult.remainingBalance}`);
    }

    // Step 3: Mark employees as paid
    payrollRun.employees.forEach((emp) => {
      emp.paymentStatus = 'PAID';
      emp.paymentReferenceId = bankResult.bankTransactionId;
    });

    payrollRun.status = 'PROCESSED';
    payrollRun.bankTransactionId = bankResult.bankTransactionId;
    payrollRun.paymentDate = new Date();

    console.log(
      `[Payroll] Processed to bank. Transaction: ${bankResult.bankTransactionId}, Bank Balance: ₹${bankResult.remainingBalance}`
    );

    return {
      payrollRun,
      bankTransactionId: bankResult.bankTransactionId,
      allocations: bankResult.allocations,
    };
  }

  /**
   * Calculate net salary for an employee
   * Includes: Base + Allowances - Deductions
   */
  private calculateSalary(employee: Employee): PayrollEntry {
    const baseSalary = employee.baseSalary;

    // Standard allowances (can be customized)
    const allowances = {
      hra: baseSalary * 0.2, // 20% HRA
      dearness: baseSalary * 0.05, // 5% DA
      special: 0, // Custom allowances
    };

    // Standard deductions (can be customized)
    const deductions = {
      providentFund: baseSalary * 0.12, // 12% PF
      tax: this.calculateIncomeTax(baseSalary), // Progressive tax
      insurance: 0,
      other: 0,
    };

    const grossSalary = baseSalary + allowances.hra + allowances.dearness + allowances.special;
    const totalDeductions =
      deductions.providentFund + deductions.tax + deductions.insurance + deductions.other;
    const netSalary = grossSalary - totalDeductions;

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      baseSalary,
      allowances,
      deductions,
      grossSalary,
      netSalary,
      paymentStatus: 'PENDING',
    };
  }

  /**
   * Calculate progressive income tax
   * Indian tax slabs: Up to 2.5L (nil), 2.5-5L (5%), 5-10L (20%), >10L (30%)
   */
  private calculateIncomeTax(annualSalary: number): number {
    const salaryPerMonth = annualSalary;

    if (salaryPerMonth <= 20833) return 0; // 2.5L / 12
    if (salaryPerMonth <= 41666) return salaryPerMonth * 0.05; // 5L / 12
    if (salaryPerMonth <= 83333) return salaryPerMonth * 0.2; // 10L / 12
    return salaryPerMonth * 0.3;
  }

  /**
   * Get salary budget vs actual tracking
   * Shows: Budget allocated vs actual spent on salaries
   */
  async getSalaryBudgetVariance(
    organizationId: string,
    month: string
  ): Promise<SalaryBudget[]> {
    console.log(`[Payroll] Calculating salary budget variance for ${month}`);

    // TODO: Query actual payroll vs budget
    // This ties to departmental budgets allocated from bank account

    const budgets: SalaryBudget[] = [];
    // Placeholder structure
    return budgets;
  }

  /**
   * Get payroll history with bank transaction linking
   */
  async getPayrollHistory(
    organizationId: string,
    fromMonth: string,
    toMonth: string
  ): Promise<
    Array<{
      payrollRun: PayrollRun;
      bankTransaction: any;
      costAnalysis: {
        totalCost: number;
        costPerEmployee: number;
        departmentBreakdown: Array<{
          department: string;
          cost: number;
          headcount: number;
        }>;
      };
    }>
  > {
    console.log(`[Payroll] Fetching history from ${fromMonth} to ${toMonth}`);

    // TODO: Query database for payroll runs in date range
    return [];
  }

  /**
   * Validate payroll against bank account balance
   * Ensures: Available bank balance >= Total salary amount
   */
  async validatePayrollAgainstBank(
    payrollRun: PayrollRun,
    availableBankBalance: number
  ): Promise<{
    isValid: boolean;
    bankBalance: number;
    salaryRequired: number;
    bufferAmount: number;
    bufferPercent: number;
    issues: string[];
  }> {
    console.log(`[Payroll] Validating payroll against bank balance`);

    const isValid = availableBankBalance >= payrollRun.netPayable;
    const bufferAmount = availableBankBalance - payrollRun.netPayable;
    const bufferPercent = (bufferAmount / availableBankBalance) * 100;

    const issues: string[] = [];
    if (!isValid) {
      issues.push(
        `Insufficient bank balance. Required: ₹${payrollRun.netPayable}, Available: ₹${availableBankBalance}`
      );
    }
    if (bufferPercent < 10) {
      issues.push(`Low bank buffer. Only ${bufferPercent.toFixed(1)}% buffer remaining`);
    }

    return {
      isValid,
      bankBalance: availableBankBalance,
      salaryRequired: payrollRun.netPayable,
      bufferAmount,
      bufferPercent,
      issues,
    };
  }

  /**
   * Get month-on-month salary trends
   * Shows: How salary expenses trend, used for cash flow forecasting
   */
  async getSalaryTrends(organizationId: string, lastNMonths: number = 6): Promise<{
    months: string[];
    totalPayroll: number[];
    averageMonthly: number;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    forecastedNextMonth: number;
  }> {
    console.log(`[Payroll] Calculating salary trends for last ${lastNMonths} months`);

    // TODO: Analyze payroll history
    return {
      months: [],
      totalPayroll: [],
      averageMonthly: 0,
      trend: 'STABLE',
      forecastedNextMonth: 0,
    };
  }

  private getTotalDeductions(entry: PayrollEntry): number {
    return (
      entry.deductions.providentFund +
      entry.deductions.tax +
      entry.deductions.insurance +
      entry.deductions.other
    );
  }

  private getApproverRole(approvalLevel: string): string {
    const roleMap: Record<string, string> = {
      NONE: 'AUTO',
      MANAGER: 'Department Manager',
      ADMIN: 'Organization Admin',
      ADMIN_AUDITOR: 'Admin + Auditor',
    };
    return roleMap[approvalLevel] || 'Unknown';
  }
}
