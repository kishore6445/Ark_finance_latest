import { Transaction } from '@/types/business-logic.types';

/**
 * Bank Account Flow Service
 * Central hub that orchestrates all financial flows through the bank account
 * All money flows through here: Salary -> Budgets -> Payroll -> Invoices -> Reconciliation
 */

export interface BankAccount {
  id: string;
  organizationId: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  currentBalance: number;
  availableBalance: number; // currentBalance - pending commitments
  isPrimary: boolean;
}

export interface BalanceSnapshot {
  bankAccountId: string;
  timestamp: Date;
  currentBalance: number;
  availableBalance: number;
  allocations: {
    toBudgets: number;
    toPayroll: number;
    toInvoices: number;
    reserved: number;
  };
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  type: 'CREDIT' | 'DEBIT'; // CREDIT = money in, DEBIT = money out
  amount: number;
  description: string;
  linkedType?: 'SALARY' | 'INVOICE_PAYMENT' | 'FUND_TRANSFER' | 'EXPENSE' | 'GST_PAYMENT';
  linkedId?: string; // Links to payroll_run, invoice, transaction, etc
  timestamp: Date;
  status: 'PENDING' | 'CLEARED' | 'FAILED';
}

export class BankAccountFlowService {
  /**
   * Process salary payroll debit from bank account
   * Flow: Bank Account -> Payroll -> Multiple Employee Transfers
   */
  async processPayrollDebit(
    bankAccountId: string,
    payrollRunId: string,
    totalSalaryAmount: number,
    employeeDetails: Array<{ employeeId: string; amount: number }>
  ): Promise<{
    success: boolean;
    bankTransactionId: string;
    allocations: Array<{
      employeeId: string;
      amount: number;
      status: string;
    }>;
    remainingBalance: number;
  }> {
    console.log(
      `[Bank Flow] Processing payroll debit: ${bankAccountId}, Amount: ₹${totalSalaryAmount}`
    );

    // 1. Validate bank account has sufficient balance
    const availableBalance = await this.getAvailableBalance(bankAccountId);
    if (availableBalance < totalSalaryAmount) {
      return {
        success: false,
        bankTransactionId: '',
        allocations: [],
        remainingBalance: availableBalance,
      };
    }

    // 2. Create bank transaction record (DEBIT)
    const bankTx = {
      id: `BT_${Date.now()}`,
      bankAccountId,
      type: 'DEBIT' as const,
      amount: totalSalaryAmount,
      description: `Payroll Run - ${payrollRunId}`,
      linkedType: 'SALARY' as const,
      linkedId: payrollRunId,
      timestamp: new Date(),
      status: 'CLEARED' as const,
    };

    // 3. Allocate to individual employees
    const allocations = employeeDetails.map((emp) => ({
      employeeId: emp.employeeId,
      amount: emp.amount,
      status: 'ALLOCATED',
    }));

    // 4. Update bank balance
    const newBalance = availableBalance - totalSalaryAmount;

    console.log(
      `[Bank Flow] Payroll processed. New balance: ₹${newBalance}, Allocated to ${employeeDetails.length} employees`
    );

    return {
      success: true,
      bankTransactionId: bankTx.id,
      allocations,
      remainingBalance: newBalance,
    };
  }

  /**
   * Process invoice payment debit from bank account
   * Flow: Bank Account -> Invoice Payment -> Vendor
   */
  async processInvoicePayment(
    bankAccountId: string,
    invoiceId: string,
    amount: number,
    vendorId: string,
    paymentMode: 'BANK_TRANSFER' | 'CHECK' | 'NEFT' | 'RTGS'
  ): Promise<{
    success: boolean;
    bankTransactionId: string;
    paymentStatus: string;
    remainingBalance: number;
  }> {
    console.log(`[Bank Flow] Processing invoice payment: ${invoiceId}, Amount: ₹${amount}`);

    // 1. Validate bank account has funds
    const availableBalance = await this.getAvailableBalance(bankAccountId);
    if (availableBalance < amount) {
      return {
        success: false,
        bankTransactionId: '',
        paymentStatus: 'INSUFFICIENT_FUNDS',
        remainingBalance: availableBalance,
      };
    }

    // 2. Create bank transaction record (DEBIT)
    const bankTx = {
      id: `BT_${Date.now()}`,
      bankAccountId,
      type: 'DEBIT' as const,
      amount,
      description: `Payment for Invoice ${invoiceId} to Vendor ${vendorId}`,
      linkedType: 'INVOICE_PAYMENT' as const,
      linkedId: invoiceId,
      timestamp: new Date(),
      status: paymentMode === 'CHECK' ? 'PENDING' : 'CLEARED',
    };

    // 3. Record payment method for reconciliation
    const paymentRecord = {
      paymentMode,
      clearedDate: paymentMode === 'CHECK' ? null : new Date(),
      referenceNumber: `REF_${Date.now()}`,
    };

    const newBalance = availableBalance - amount;

    console.log(
      `[Bank Flow] Invoice payment processed via ${paymentMode}. New balance: ₹${newBalance}`
    );

    return {
      success: true,
      bankTransactionId: bankTx.id,
      paymentStatus: bankTx.status,
      remainingBalance: newBalance,
    };
  }

  /**
   * Process vendor/income credit to bank account
   * Flow: Vendor/Client -> Bank Account -> Available for Payroll/Expenses
   */
  async processIncomeCredit(
    bankAccountId: string,
    amount: number,
    sourceType: 'INVOICE_RECEIVED' | 'FUND_TRANSFER' | 'LOAN' | 'INVESTMENT',
    sourceId: string,
    description: string
  ): Promise<{
    success: boolean;
    bankTransactionId: string;
    newBalance: number;
    newAvailableBalance: number;
  }> {
    console.log(`[Bank Flow] Processing income credit: ${sourceType}, Amount: ₹${amount}`);

    // 1. Create bank transaction record (CREDIT)
    const bankTx = {
      id: `BT_${Date.now()}`,
      bankAccountId,
      type: 'CREDIT' as const,
      amount,
      description: `${sourceType}: ${description}`,
      linkedType: sourceType,
      linkedId: sourceId,
      timestamp: new Date(),
      status: 'CLEARED' as const,
    };

    // 2. Update bank balance
    const currentBalance = await this.getCurrentBalance(bankAccountId);
    const newBalance = currentBalance + amount;

    console.log(
      `[Bank Flow] Income credit processed. New balance: ₹${newBalance}, Available for allocation`
    );

    return {
      success: true,
      bankTransactionId: bankTx.id,
      newBalance,
      newAvailableBalance: newBalance,
    };
  }

  /**
   * Allocate bank funds to budgets
   * Flow: Bank Account -> Departmental Budgets
   * Example: ₹5,00,000 bank balance -> Sales Budget ₹2L, Ops Budget ₹1.5L, etc
   */
  async allocateFundsToBudgets(
    bankAccountId: string,
    budgetAllocations: Array<{
      budgetId: string;
      departmentName: string;
      allocatedAmount: number;
    }>
  ): Promise<{
    success: boolean;
    totalAllocated: number;
    allocations: Array<{
      budgetId: string;
      status: string;
      allocated: number;
    }>;
    remainingUnallocated: number;
  }> {
    console.log(`[Bank Flow] Allocating funds to ${budgetAllocations.length} budgets`);

    const totalToAllocate = budgetAllocations.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const availableBalance = await this.getAvailableBalance(bankAccountId);

    if (availableBalance < totalToAllocate) {
      console.warn(
        `[Bank Flow] Insufficient balance. Requested: ₹${totalToAllocate}, Available: ₹${availableBalance}`
      );
      return {
        success: false,
        totalAllocated: 0,
        allocations: [],
        remainingUnallocated: availableBalance,
      };
    }

    // Process each budget allocation
    const allocations = budgetAllocations.map((budget) => ({
      budgetId: budget.budgetId,
      status: 'ALLOCATED',
      allocated: budget.allocatedAmount,
    }));

    const remaining = availableBalance - totalToAllocate;

    console.log(
      `[Bank Flow] Allocated ₹${totalToAllocate} across budgets. Remaining: ₹${remaining}`
    );

    return {
      success: true,
      totalAllocated: totalToAllocate,
      allocations,
      remainingUnallocated: remaining,
    };
  }

  /**
   * Get complete cash flow picture
   * Shows: Bank Balance -> What it's committed to -> What's available
   */
  async getCashFlowAnalysis(bankAccountId: string): Promise<{
    currentBalance: number;
    commitments: {
      pendingPayroll: number;
      pendingInvoicePayments: number;
      budgetAllocations: number;
      reserved: number;
    };
    availableBalance: number;
    inflow: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    outflow: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    forecastedBalance30Days: number;
    healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  }> {
    console.log(`[Bank Flow] Calculating cash flow analysis for: ${bankAccountId}`);

    const current = await this.getCurrentBalance(bankAccountId);
    const available = await this.getAvailableBalance(bankAccountId);
    const commitments = await this.getCommitments(bankAccountId);
    const flows = await this.getHistoricalFlows(bankAccountId);

    const forecastedBalance = current + flows.inflow.monthly - flows.outflow.monthly;
    const healthStatus = this.determineHealthStatus(available, commitments, flows);

    return {
      currentBalance: current,
      commitments,
      availableBalance: available,
      inflow: flows.inflow,
      outflow: flows.outflow,
      forecastedBalance30Days: forecastedBalance,
      healthStatus,
    };
  }

  /**
   * Trace complete transaction flow from bank to final recipient
   * Example: Bank Account -> Payroll -> Employee or Bank Account -> Invoice -> Vendor
   */
  async traceTransactionFlow(
    bankAccountId: string,
    transactionId: string
  ): Promise<{
    bankTransaction: BankTransaction;
    linkedWorkflows: Array<{
      type: string;
      id: string;
      status: string;
      amount: number;
      recipients: Array<{
        type: string;
        id: string;
        amount: number;
      }>;
    }>;
  }> {
    console.log(`[Bank Flow] Tracing transaction flow: ${transactionId}`);

    const bankTx = await this.getBankTransaction(transactionId);

    // Get linked workflow based on linkedType
    const workflows = [];

    if (bankTx.linkedType === 'SALARY') {
      const payrollWorkflow = await this.getPayrollWorkflow(bankTx.linkedId);
      workflows.push(payrollWorkflow);
    } else if (bankTx.linkedType === 'INVOICE_PAYMENT') {
      const invoiceWorkflow = await this.getInvoicePaymentWorkflow(bankTx.linkedId);
      workflows.push(invoiceWorkflow);
    }

    return {
      bankTransaction: bankTx,
      linkedWorkflows: workflows,
    };
  }

  /**
   * Validate complete flow integrity
   * Ensures: Bank Balance = Allocations + Available
   * And: All outflows are approved before debit
   */
  async validateFlowIntegrity(bankAccountId: string): Promise<{
    isValid: boolean;
    balanceEquation: {
      currentBalance: number;
      totalAllocations: number;
      availableBalance: number;
      matches: boolean;
    };
    outflowValidation: {
      allOutflowsApproved: boolean;
      unapprovedDebits: number;
    };
    issues: string[];
  }> {
    console.log(`[Bank Flow] Validating flow integrity for: ${bankAccountId}`);

    const current = await this.getCurrentBalance(bankAccountId);
    const available = await this.getAvailableBalance(bankAccountId);
    const allocations = await this.getTotalAllocations(bankAccountId);
    const unapprovedDebits = await this.getUnapprovedDebits(bankAccountId);

    const balanceMatches = current === allocations + available;

    const issues: string[] = [];
    if (!balanceMatches) {
      issues.push(
        `Balance mismatch: ${current} !== ${allocations} + ${available}`
      );
    }
    if (unapprovedDebits > 0) {
      issues.push(`Found ${unapprovedDebits} unapproved debit transactions`);
    }

    return {
      isValid: balanceMatches && unapprovedDebits === 0,
      balanceEquation: {
        currentBalance: current,
        totalAllocations: allocations,
        availableBalance: available,
        matches: balanceMatches,
      },
      outflowValidation: {
        allOutflowsApproved: unapprovedDebits === 0,
        unapprovedDebits,
      },
      issues,
    };
  }

  // Private helper methods
  private async getAvailableBalance(bankAccountId: string): Promise<number> {
    // TODO: Query database for available balance
    // Available = Current - Pending Commitments
    return 500000; // Placeholder
  }

  private async getCurrentBalance(bankAccountId: string): Promise<number> {
    // TODO: Query database for current balance
    return 500000; // Placeholder
  }

  private async getCommitments(bankAccountId: string): Promise<{
    pendingPayroll: number;
    pendingInvoicePayments: number;
    budgetAllocations: number;
    reserved: number;
  }> {
    // TODO: Query database for all commitments
    return {
      pendingPayroll: 0,
      pendingInvoicePayments: 0,
      budgetAllocations: 0,
      reserved: 0,
    };
  }

  private async getHistoricalFlows(bankAccountId: string): Promise<{
    inflow: { daily: number; weekly: number; monthly: number };
    outflow: { daily: number; weekly: number; monthly: number };
  }> {
    // TODO: Analyze transaction history
    return {
      inflow: { daily: 0, weekly: 0, monthly: 0 },
      outflow: { daily: 0, weekly: 0, monthly: 0 },
    };
  }

  private determineHealthStatus(
    available: number,
    commitments: any,
    flows: any
  ): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    const totalCommitments =
      commitments.pendingPayroll +
      commitments.pendingInvoicePayments +
      commitments.budgetAllocations;

    if (available < totalCommitments * 0.5) {
      return 'CRITICAL';
    }
    if (available < totalCommitments) {
      return 'WARNING';
    }
    return 'HEALTHY';
  }

  private async getBankTransaction(id: string): Promise<BankTransaction> {
    // TODO: Query database
    return {
      id,
      bankAccountId: '',
      type: 'DEBIT',
      amount: 0,
      description: '',
      timestamp: new Date(),
      status: 'CLEARED',
    };
  }

  private async getPayrollWorkflow(payrollId: string): Promise<any> {
    // TODO: Get payroll details and employee allocations
    return {};
  }

  private async getInvoicePaymentWorkflow(invoiceId: string): Promise<any> {
    // TODO: Get invoice and vendor details
    return {};
  }

  private async getTotalAllocations(bankAccountId: string): Promise<number> {
    // TODO: Sum all budget allocations
    return 0;
  }

  private async getUnapprovedDebits(bankAccountId: string): Promise<number> {
    // TODO: Count unapproved transactions
    return 0;
  }
}
