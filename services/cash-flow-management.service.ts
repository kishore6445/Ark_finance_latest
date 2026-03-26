import { BankAccountFlowService } from './bank-account-flow.service';
import { PayrollProcessingService } from './payroll-processing.service';
import { BudgetManagementService } from './budget-management.service';

/**
 * Cash Flow Management Service
 * Complete orchestration of all financial flows
 * Shows the complete picture: Bank -> Commitments (Payroll + Budgets) -> Cash Available
 */

export interface CashFlowProjection {
  currentDate: Date;
  projectionDays: number;
  currentBalance: number;
  projectedBalance30Days: number;
  projectedBalance90Days: number;
  inflowProjection: {
    daily: number;
    weekly: number;
    monthly: number;
    source: Array<{
      type: string;
      amount: number;
      date?: Date;
    }>;
  };
  outflowProjection: {
    daily: number;
    weekly: number;
    monthly: number;
    breakdown: Array<{
      category: string;
      amount: number;
      date?: Date;
    }>;
  };
  criticalDates: Array<{
    date: Date;
    event: string;
    impact: number;
    type: 'PAYROLL' | 'INVOICE' | 'TAX' | 'OTHER';
  }>;
}

export interface CashFlowAlert {
  id: string;
  type: 'LIQUIDITY_RISK' | 'BUDGET_OVERRUN' | 'PAYROLL_AT_RISK' | 'FORECAST_WARNING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  actionRequired: string;
  dueDate?: Date;
  affectedAmount?: number;
}

export interface TransactionFlowSummary {
  bankBalance: {
    current: number;
    available: number;
    committed: number;
  };
  commitments: {
    pendingPayroll: {
      amount: number;
      employees: number;
      dueDate: Date;
    };
    pendingBudgets: {
      amount: number;
      departments: number;
      endDate: Date;
    };
    pendingInvoices: {
      amount: number;
      invoices: number;
      dueDate: Date;
    };
    reservedAmount: {
      amount: number;
      reason: string;
    };
  };
  flows: {
    monthlyPayroll: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    netMonthlyFlow: number;
  };
  healthStatus: 'HEALTHY' | 'CAUTION' | 'ALERT' | 'CRITICAL';
  recommendations: string[];
}

export class CashFlowManagementService {
  private bankFlowService: BankAccountFlowService;
  private payrollService: PayrollProcessingService;
  private budgetService: BudgetManagementService;

  constructor(
    bankFlowService: BankAccountFlowService,
    payrollService: PayrollProcessingService,
    budgetService: BudgetManagementService
  ) {
    this.bankFlowService = bankFlowService;
    this.payrollService = payrollService;
    this.budgetService = budgetService;
  }

  /**
   * Get complete cash flow picture
   * Integrates: Bank Account + Payroll + Budgets + Invoices
   */
  async getCompleteCashFlowView(
    bankAccountId: string,
    organizationId: string
  ): Promise<TransactionFlowSummary> {
    console.log(`[CashFlow] Getting complete cash flow view for org: ${organizationId}`);

    // Get bank status
    const bankAnalysis = await this.bankFlowService.getCashFlowAnalysis(bankAccountId);

    // Get pending payroll commitments
    const pendingPayroll = await this.getPendingPayrollCommitments(organizationId);

    // Get budget allocations
    const budgetStatus = await this.budgetService.getOrganizationBudgetStatus(organizationId);

    // Get pending invoices
    const pendingInvoices = await this.getPendingInvoicePayments(organizationId);

    // Calculate flows
    const flows = {
      monthlyPayroll: pendingPayroll.totalAmount,
      monthlyRevenue: bankAnalysis.inflow.monthly,
      monthlyExpenses: bankAnalysis.outflow.monthly + pendingPayroll.totalAmount,
      netMonthlyFlow:
        bankAnalysis.inflow.monthly - bankAnalysis.outflow.monthly - pendingPayroll.totalAmount,
    };

    // Determine health status
    const healthStatus = this.determineHealthStatus(
      bankAnalysis.availableBalance,
      bankAnalysis.commitments,
      flows
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      bankAnalysis,
      pendingPayroll,
      budgetStatus,
      flows
    );

    const summary: TransactionFlowSummary = {
      bankBalance: {
        current: bankAnalysis.currentBalance,
        available: bankAnalysis.availableBalance,
        committed: Object.values(bankAnalysis.commitments).reduce((sum, val) => sum + val, 0),
      },
      commitments: {
        pendingPayroll: {
          amount: pendingPayroll.totalAmount,
          employees: pendingPayroll.employeeCount,
          dueDate: pendingPayroll.dueDate,
        },
        pendingBudgets: {
          amount: budgetStatus.totalBudgeted,
          departments: budgetStatus.budgets.length,
          endDate: this.getEndOfCurrentMonth(),
        },
        pendingInvoices: {
          amount: pendingInvoices.totalAmount,
          invoices: pendingInvoices.count,
          dueDate: pendingInvoices.dueDate,
        },
        reservedAmount: {
          amount: bankAnalysis.commitments.reserved || 0,
          reason: 'Emergency reserve (10% of bank balance)',
        },
      },
      flows,
      healthStatus,
      recommendations,
    };

    console.log(`[CashFlow] Summary: Balance ₹${bankAnalysis.currentBalance}, Health: ${healthStatus}`);
    return summary;
  }

  /**
   * Project cash flow for next 30/90 days
   * Shows: Will we have liquidity? When do we need additional funding?
   */
  async projectCashFlow(
    bankAccountId: string,
    organizationId: string,
    projectionDays: number = 30
  ): Promise<CashFlowProjection> {
    console.log(`[CashFlow] Projecting cash flow for ${projectionDays} days`);

    const bankAnalysis = await this.bankFlowService.getCashFlowAnalysis(bankAccountId);
    const historicalFlows = await this.getHistoricalFlows(organizationId);
    const payrollSchedule = await this.getPayrollSchedule(organizationId);
    const invoiceSchedule = await this.getInvoicePaymentSchedule(organizationId);

    // Calculate daily average flows
    const dailyInflow = bankAnalysis.inflow.monthly / 30;
    const dailyOutflow = bankAnalysis.outflow.monthly / 30;

    // Project balance at different intervals
    const projectedBalance30 = bankAnalysis.currentBalance + dailyInflow * 30 - dailyOutflow * 30;
    const projectedBalance90 = bankAnalysis.currentBalance + dailyInflow * 90 - dailyOutflow * 90;

    // Identify critical dates
    const criticalDates = this.buildCriticalDatesTimeline(
      payrollSchedule,
      invoiceSchedule,
      projectionDays
    );

    const projection: CashFlowProjection = {
      currentDate: new Date(),
      projectionDays,
      currentBalance: bankAnalysis.currentBalance,
      projectedBalance30Days: projectedBalance30,
      projectedBalance90Days: projectedBalance90,
      inflowProjection: {
        daily: dailyInflow,
        weekly: dailyInflow * 7,
        monthly: bankAnalysis.inflow.monthly,
        source: historicalFlows.inflowBySource,
      },
      outflowProjection: {
        daily: dailyOutflow,
        weekly: dailyOutflow * 7,
        monthly: bankAnalysis.outflow.monthly,
        breakdown: historicalFlows.outflowByCategory,
      },
      criticalDates,
    };

    console.log(`[CashFlow] Projected balance in 30 days: ₹${projectedBalance30}`);
    return projection;
  }

  /**
   * Trigger alerts based on cash flow risks
   * Monitors: Liquidity, Budget overruns, Payroll delays, Forecast warnings
   */
  async checkCashFlowAlerts(
    bankAccountId: string,
    organizationId: string
  ): Promise<CashFlowAlert[]> {
    console.log(`[CashFlow] Checking for cash flow alerts`);

    const alerts: CashFlowAlert[] = [];
    const summary = await this.getCompleteCashFlowView(bankAccountId, organizationId);
    const projection = await this.projectCashFlow(bankAccountId, organizationId, 30);

    // Alert 1: Liquidity Risk
    if (summary.bankBalance.available < summary.commitments.pendingPayroll.amount) {
      alerts.push({
        id: `ALERT_LIQUIDITY_${Date.now()}`,
        type: 'LIQUIDITY_RISK',
        severity: 'CRITICAL',
        message: 'Insufficient funds to cover next payroll',
        actionRequired: 'Defer payroll or arrange emergency funding',
        dueDate: summary.commitments.pendingPayroll.dueDate,
        affectedAmount: summary.commitments.pendingPayroll.amount - summary.bankBalance.available,
      });
    }

    // Alert 2: Budget Overrun
    const overrunBudgets = summary.bankBalance.available < summary.commitments.pendingBudgets.amount ? 1 : 0;
    if (overrunBudgets > 0) {
      alerts.push({
        id: `ALERT_BUDGET_${Date.now()}`,
        type: 'BUDGET_OVERRUN',
        severity: 'HIGH',
        message: `${overrunBudgets} department(s) approaching budget limits`,
        actionRequired: 'Review and reallocate budgets',
        dueDate: summary.commitments.pendingBudgets.endDate,
      });
    }

    // Alert 3: Payroll at Risk
    if (projection.projectedBalance30Days < 0) {
      alerts.push({
        id: `ALERT_PAYROLL_${Date.now()}`,
        type: 'PAYROLL_AT_RISK',
        severity: 'CRITICAL',
        message: 'Projected negative cash balance within 30 days',
        actionRequired: 'Immediate action required - review revenue and expenses',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        affectedAmount: Math.abs(projection.projectedBalance30Days),
      });
    }

    // Alert 4: Forecast Warning
    if (summary.flows.netMonthlyFlow < 0) {
      alerts.push({
        id: `ALERT_FORECAST_${Date.now()}`,
        type: 'FORECAST_WARNING',
        severity: 'HIGH',
        message: 'Monthly outflows exceed inflows - business is burning cash',
        actionRequired: 'Review expense reduction or increase revenue',
        affectedAmount: Math.abs(summary.flows.netMonthlyFlow),
      });
    }

    console.log(`[CashFlow] Generated ${alerts.length} alerts`);
    return alerts;
  }

  /**
   * Get financial health scorecard
   * Summary metrics for executive dashboard
   */
  async getFinancialHealthScorecard(
    bankAccountId: string,
    organizationId: string
  ): Promise<{
    overallScore: number; // 0-100
    metrics: {
      liquidityRatio: number; // Available Balance / Monthly Expenses
      budgetUtilization: number; // % of budgets used
      cashFlowTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
      payrollCoverage: number; // Months of payroll funded
      forecastAccuracy: number; // % confidence in 30-day forecast
    };
    warnings: string[];
    recommendations: string[];
  }> {
    console.log(`[CashFlow] Generating health scorecard`);

    const summary = await this.getCompleteCashFlowView(bankAccountId, organizationId);
    const projection = await this.projectCashFlow(bankAccountId, organizationId, 30);

    // Calculate metrics
    const monthlyExpenses = summary.flows.monthlyExpenses;
    const liquidityRatio = summary.bankBalance.available / Math.max(monthlyExpenses, 1);
    const budgetUtilization = this.calculateBudgetUtilization(summary);
    const payrollCoverage =
      summary.bankBalance.available / Math.max(summary.commitments.pendingPayroll.amount, 1);

    // Determine trend
    const cashFlowTrend = summary.flows.netMonthlyFlow > 0 ? 'IMPROVING' : 'DECLINING';

    // Calculate overall score
    let score = 50; // Start at 50
    if (liquidityRatio > 3) score += 20;
    else if (liquidityRatio > 1) score += 10;
    else score -= 10;

    if (budgetUtilization < 80) score += 15;
    else if (budgetUtilization < 100) score += 5;
    else score -= 15;

    if (payrollCoverage > 1) score += 15;
    else score -= 20;

    score = Math.max(0, Math.min(100, score));

    const warnings: string[] = [];
    if (liquidityRatio < 1) warnings.push('Critical: Liquidity ratio below 1');
    if (budgetUtilization > 100) warnings.push('Alert: Budgets exceeded');
    if (projection.projectedBalance30Days < 0) warnings.push('Warning: Negative cash flow expected');

    return {
      overallScore: score,
      metrics: {
        liquidityRatio: parseFloat(liquidityRatio.toFixed(2)),
        budgetUtilization: parseFloat(budgetUtilization.toFixed(1)),
        cashFlowTrend,
        payrollCoverage: parseFloat(payrollCoverage.toFixed(2)),
        forecastAccuracy: 85, // Placeholder
      },
      warnings,
      recommendations: summary.recommendations,
    };
  }

  // Private helper methods

  private async getPendingPayrollCommitments(
    organizationId: string
  ): Promise<{
    totalAmount: number;
    employeeCount: number;
    dueDate: Date;
  }> {
    // TODO: Query pending payroll runs
    return {
      totalAmount: 0,
      employeeCount: 0,
      dueDate: this.getNextSalaryDate(),
    };
  }

  private async getPendingInvoicePayments(
    organizationId: string
  ): Promise<{
    totalAmount: number;
    count: number;
    dueDate: Date;
  }> {
    // TODO: Query pending invoice payments
    return {
      totalAmount: 0,
      count: 0,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    };
  }

  private async getHistoricalFlows(organizationId: string): Promise<{
    inflowBySource: Array<{ type: string; amount: number }>;
    outflowByCategory: Array<{ category: string; amount: number }>;
  }> {
    // TODO: Analyze historical transactions
    return {
      inflowBySource: [],
      outflowByCategory: [],
    };
  }

  private async getPayrollSchedule(organizationId: string): Promise<
    Array<{
      date: Date;
      amount: number;
    }>
  > {
    // TODO: Get scheduled payroll dates
    return [];
  }

  private async getInvoicePaymentSchedule(organizationId: string): Promise<
    Array<{
      date: Date;
      amount: number;
      invoice: string;
    }>
  > {
    // TODO: Get scheduled invoice payments
    return [];
  }

  private buildCriticalDatesTimeline(
    payrollSchedule: Array<{ date: Date; amount: number }>,
    invoiceSchedule: Array<{ date: Date; amount: number; invoice: string }>,
    days: number
  ): Array<{
    date: Date;
    event: string;
    impact: number;
    type: 'PAYROLL' | 'INVOICE' | 'TAX' | 'OTHER';
  }> {
    const critical = [];
    const now = new Date();

    // Add payroll dates
    payrollSchedule.forEach((p) => {
      if (p.date.getTime() <= now.getTime() + days * 24 * 60 * 60 * 1000) {
        critical.push({
          date: p.date,
          event: `Payroll: ₹${p.amount}`,
          impact: -p.amount,
          type: 'PAYROLL' as const,
        });
      }
    });

    // Add invoice payment dates
    invoiceSchedule.forEach((inv) => {
      if (inv.date.getTime() <= now.getTime() + days * 24 * 60 * 60 * 1000) {
        critical.push({
          date: inv.date,
          event: `Invoice: ₹${inv.amount}`,
          impact: -inv.amount,
          type: 'INVOICE' as const,
        });
      }
    });

    return critical.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private determineHealthStatus(
    available: number,
    commitments: any,
    flows: any
  ): 'HEALTHY' | 'CAUTION' | 'ALERT' | 'CRITICAL' {
    if (flows.netMonthlyFlow < 0 && available < flows.monthlyExpenses) return 'CRITICAL';
    if (available < commitments.pendingPayroll.amount) return 'ALERT';
    if (available < commitments.pendingPayroll.amount * 1.5) return 'CAUTION';
    return 'HEALTHY';
  }

  private generateRecommendations(
    bankAnalysis: any,
    payrollData: any,
    budgetStatus: any,
    flows: any
  ): string[] {
    const recs: string[] = [];

    if (flows.netMonthlyFlow < 0) {
      recs.push('Revenue below expenses - consider cost optimization');
    }
    if (bankAnalysis.availableBalance < flows.monthlyExpenses * 1.5) {
      recs.push('Build cash reserves to 1.5x monthly expenses');
    }
    if (budgetStatus.overallUtilization > 80) {
      recs.push('Monitor budget utilization - approaching limits');
    }

    return recs;
  }

  private calculateBudgetUtilization(summary: TransactionFlowSummary): number {
    // Average utilization across all budgets
    return 65; // Placeholder
  }

  private getNextSalaryDate(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 25); // Assume 25th of month
  }

  private getEndOfCurrentMonth(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }
}
