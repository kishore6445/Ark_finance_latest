import { BankAccountFlowService } from './bank-account-flow.service';

/**
 * Budget Management Service
 * Handles departmental budgets allocated from bank account
 * Flow: Bank Account -> Department Budgets -> Expense Tracking -> Variance Analysis
 */

export interface DepartmentBudget {
  id: string;
  organizationId: string;
  departmentId: string;
  departmentName: string;
  period: string; // YYYY-MM or YYYY (quarterly)
  budgetedAmount: number;
  allocatedFromBank: number; // Amount transferred from bank account
  spent: number;
  remaining: number;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'COMPLETED';
  categoryBreakdown: BudgetCategory[];
}

export interface BudgetCategory {
  categoryId: string;
  categoryName: string; // e.g., "Salary", "Travel", "Supplies"
  budgetedAmount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface BudgetExpense {
  id: string;
  budgetId: string;
  departmentId: string;
  categoryId: string;
  description: string;
  amount: number;
  date: Date;
  linkedTransactionId?: string; // Links to transaction/invoice that caused the expense
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'WARNING' | 'CRITICAL' | 'EXCEEDED';
  message: string;
  threshold: number; // % of budget used when alert triggered
  actualPercent: number;
  timestamp: Date;
}

export interface BudgetForecast {
  budgetId: string;
  currentSpent: number;
  projectedSpent: number; // Based on rate of spending
  budgetedAmount: number;
  forecastedVariance: number; // Projected - Budgeted
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  daysRemaining: number;
  dailyBurnRate: number; // Current spending per day
}

export class BudgetManagementService {
  private bankFlowService: BankAccountFlowService;

  constructor(bankFlowService: BankAccountFlowService) {
    this.bankFlowService = bankFlowService;
  }

  /**
   * Create departmental budget from bank allocation
   * Flow: Manager requests budget -> Gets allocated from bank account -> Creates budget records
   */
  async createBudget(
    organizationId: string,
    departmentId: string,
    departmentName: string,
    bankAccountId: string,
    budgetAmount: number,
    period: string,
    categoryBreakdown: Array<{ categoryName: string; amount: number }>
  ): Promise<DepartmentBudget> {
    console.log(
      `[Budget] Creating budget for ${departmentName}: ₹${budgetAmount} for period ${period}`
    );

    // Validate bank has sufficient funds
    const bankFlow = new BankAccountFlowService();
    const cashFlow = await bankFlow.getCashFlowAnalysis(bankAccountId);

    if (cashFlow.availableBalance < budgetAmount) {
      throw new Error(
        `Insufficient bank balance. Available: ₹${cashFlow.availableBalance}, Requested: ₹${budgetAmount}`
      );
    }

    // Step 1: Allocate funds from bank
    const allocation = await this.bankFlowService.allocateFundsToBudgets(bankAccountId, [
      {
        budgetId: `B_${departmentId}`,
        departmentName,
        allocatedAmount: budgetAmount,
      },
    ]);

    if (!allocation.success) {
      throw new Error('Failed to allocate funds from bank account');
    }

    // Step 2: Create budget record
    const categories = categoryBreakdown.map((cat) => ({
      categoryId: `CAT_${departmentId}_${cat.categoryName}`,
      categoryName: cat.categoryName,
      budgetedAmount: cat.amount,
      spent: 0,
      remaining: cat.amount,
      percentUsed: 0,
    }));

    const budget: DepartmentBudget = {
      id: `B_${departmentId}_${period}`,
      organizationId,
      departmentId,
      departmentName,
      period,
      budgetedAmount: budgetAmount,
      allocatedFromBank: budgetAmount,
      spent: 0,
      remaining: budgetAmount,
      status: 'ACTIVE',
      categoryBreakdown: categories,
    };

    console.log(
      `[Budget] Budget created and allocated from bank. Categories: ${categories.length}`
    );
    return budget;
  }

  /**
   * Record expense against budget
   * Tracks spending and checks against budget limits
   */
  async recordExpense(
    budgetId: string,
    categoryId: string,
    amount: number,
    description: string,
    linkedTransactionId?: string
  ): Promise<{
    expense: BudgetExpense;
    budgetStatus: DepartmentBudget;
    alerts: BudgetAlert[];
  }> {
    console.log(`[Budget] Recording expense: ${description}, Amount: ₹${amount}`);

    const expense: BudgetExpense = {
      id: `EXP_${Date.now()}`,
      budgetId,
      departmentId: '', // Will be fetched from budget
      categoryId,
      description,
      amount,
      date: new Date(),
      linkedTransactionId,
      status: 'APPROVED',
    };

    // Step 1: Get current budget status
    const budget = await this.getBudgetStatus(budgetId);

    // Step 2: Update category spending
    const category = budget.categoryBreakdown.find((c) => c.categoryId === categoryId);
    if (!category) {
      throw new Error(`Category ${categoryId} not found in budget`);
    }

    category.spent += amount;
    category.remaining -= amount;
    category.percentUsed = (category.spent / category.budgetedAmount) * 100;

    // Step 3: Update budget totals
    budget.spent += amount;
    budget.remaining -= amount;

    // Step 4: Check for alerts
    const alerts = this.checkBudgetAlerts(budgetId, budget, category);

    console.log(`[Budget] Expense recorded. Remaining: ₹${budget.remaining}`);

    return {
      expense,
      budgetStatus: budget,
      alerts,
    };
  }

  /**
   * Get budget variance (Budget vs Actual)
   * Shows: What was budgeted vs what was actually spent
   */
  async getBudgetVariance(budgetId: string): Promise<{
    budgetId: string;
    budgetedAmount: number;
    actualSpent: number;
    variance: number; // Actual - Budgeted
    variancePercent: number;
    status: 'ON_TRACK' | 'OVER_BUDGET' | 'UNDER_BUDGET';
    categories: Array<{
      categoryName: string;
      budgeted: number;
      spent: number;
      variance: number;
      percentUsed: number;
    }>;
  }> {
    console.log(`[Budget] Calculating variance for budget: ${budgetId}`);

    const budget = await this.getBudgetStatus(budgetId);

    const variance = budget.spent - budget.budgetedAmount;
    const variancePercent = (variance / budget.budgetedAmount) * 100;

    let status: 'ON_TRACK' | 'OVER_BUDGET' | 'UNDER_BUDGET' = 'ON_TRACK';
    if (variance > 0) status = 'OVER_BUDGET';
    if (variance < 0) status = 'UNDER_BUDGET';

    const categories = budget.categoryBreakdown.map((cat) => ({
      categoryName: cat.categoryName,
      budgeted: cat.budgetedAmount,
      spent: cat.spent,
      variance: cat.spent - cat.budgetedAmount,
      percentUsed: cat.percentUsed,
    }));

    return {
      budgetId,
      budgetedAmount: budget.budgetedAmount,
      actualSpent: budget.spent,
      variance,
      variancePercent,
      status,
      categories,
    };
  }

  /**
   * Get budget forecast
   * Projects: Will we exceed budget based on current spending rate?
   */
  async getBudgetForecast(budgetId: string): Promise<BudgetForecast> {
    console.log(`[Budget] Forecasting budget: ${budgetId}`);

    const budget = await this.getBudgetStatus(budgetId);
    const expenses = await this.getExpenseHistory(budgetId);

    // Calculate days elapsed and remaining
    const periodStart = this.getPeriodStart(budget.period);
    const periodEnd = this.getPeriodEnd(budget.period);
    const today = new Date();
    const daysElapsed = Math.floor((today.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.floor((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = daysElapsed + daysRemaining;

    // Calculate daily burn rate
    const dailyBurnRate = budget.spent / Math.max(daysElapsed, 1);

    // Project spending at current rate
    const projectedSpent = dailyBurnRate * totalDays;
    const forecastedVariance = projectedSpent - budget.budgetedAmount;

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (forecastedVariance > budget.budgetedAmount * 0.1) riskLevel = 'MEDIUM';
    if (forecastedVariance > budget.budgetedAmount * 0.2) riskLevel = 'HIGH';

    return {
      budgetId,
      currentSpent: budget.spent,
      projectedSpent,
      budgetedAmount: budget.budgetedAmount,
      forecastedVariance,
      riskLevel,
      daysRemaining,
      dailyBurnRate,
    };
  }

  /**
   * Get all active budgets and their consolidated status
   * Dashboard view: All departments at a glance
   */
  async getOrganizationBudgetStatus(
    organizationId: string,
    period?: string
  ): Promise<{
    totalBudgeted: number;
    totalAllocatedFromBank: number;
    totalSpent: number;
    totalRemaining: number;
    overallUtilization: number;
    budgets: DepartmentBudget[];
    departmentsSummary: Array<{
      departmentName: string;
      budgeted: number;
      spent: number;
      remaining: number;
      status: string;
    }>;
  }> {
    console.log(`[Budget] Getting organization budget status for ${organizationId}`);

    // TODO: Query all budgets for organization
    const budgets: DepartmentBudget[] = [];

    const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgetedAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + b.remaining, 0);
    const totalAllocatedFromBank = budgets.reduce((sum, b) => sum + b.allocatedFromBank, 0);

    const overallUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    const departmentsSummary = budgets.map((b) => ({
      departmentName: b.departmentName,
      budgeted: b.budgetedAmount,
      spent: b.spent,
      remaining: b.remaining,
      status: b.spent > b.budgetedAmount ? 'OVER_BUDGET' : 'ON_TRACK',
    }));

    return {
      totalBudgeted,
      totalAllocatedFromBank,
      totalSpent,
      totalRemaining,
      overallUtilization,
      budgets,
      departmentsSummary,
    };
  }

  /**
   * Reallocate unused budget between departments
   * Example: Sales had ₹50K unused -> Reallocate ₹30K to Operations
   */
  async reallocateBudget(
    fromBudgetId: string,
    toBudgetId: string,
    amount: number,
    reason: string
  ): Promise<{
    success: boolean;
    fromBudget: DepartmentBudget;
    toBudget: DepartmentBudget;
    reallocatedAmount: number;
  }> {
    console.log(`[Budget] Reallocating ₹${amount} from ${fromBudgetId} to ${toBudgetId}`);

    const fromBudget = await this.getBudgetStatus(fromBudgetId);
    const toBudget = await this.getBudgetStatus(toBudgetId);

    // Validate source budget has available amount
    if (fromBudget.remaining < amount) {
      throw new Error(
        `Cannot reallocate ₹${amount}. Available: ₹${fromBudget.remaining}`
      );
    }

    // Update budgets
    fromBudget.remaining -= amount;
    toBudget.budgetedAmount += amount;
    toBudget.remaining += amount;

    console.log(`[Budget] Reallocation complete. ${reason}`);

    return {
      success: true,
      fromBudget,
      toBudget,
      reallocatedAmount: amount,
    };
  }

  /**
   * Check if budget category exceeds threshold and create alerts
   */
  private checkBudgetAlerts(
    budgetId: string,
    budget: DepartmentBudget,
    category: BudgetCategory
  ): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];

    // Check category level
    if (category.percentUsed > 100) {
      alerts.push({
        id: `ALERT_${budgetId}_${category.categoryId}`,
        budgetId,
        type: 'EXCEEDED',
        message: `${category.categoryName} category exceeded budget`,
        threshold: 100,
        actualPercent: category.percentUsed,
        timestamp: new Date(),
      });
    } else if (category.percentUsed > 90) {
      alerts.push({
        id: `ALERT_${budgetId}_${category.categoryId}`,
        budgetId,
        type: 'CRITICAL',
        message: `${category.categoryName} category at 90% of budget`,
        threshold: 90,
        actualPercent: category.percentUsed,
        timestamp: new Date(),
      });
    } else if (category.percentUsed > 75) {
      alerts.push({
        id: `ALERT_${budgetId}_${category.categoryId}`,
        budgetId,
        type: 'WARNING',
        message: `${category.categoryName} category at 75% of budget`,
        threshold: 75,
        actualPercent: category.percentUsed,
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  private async getBudgetStatus(budgetId: string): Promise<DepartmentBudget> {
    // TODO: Query database
    return {
      id: budgetId,
      organizationId: '',
      departmentId: '',
      departmentName: '',
      period: '',
      budgetedAmount: 0,
      allocatedFromBank: 0,
      spent: 0,
      remaining: 0,
      status: 'ACTIVE',
      categoryBreakdown: [],
    };
  }

  private async getExpenseHistory(budgetId: string): Promise<BudgetExpense[]> {
    // TODO: Query database
    return [];
  }

  private getPeriodStart(period: string): Date {
    // Parse period (YYYY-MM) and return start of month
    const [year, month] = period.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  }

  private getPeriodEnd(period: string): Date {
    // Parse period and return end of month
    const [year, month] = period.split('-');
    return new Date(parseInt(year), parseInt(month), 0); // Day 0 of next month = last day of current
  }
}
