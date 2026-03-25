/**
 * Financial calculations for dashboard metrics
 * DSO, DPO, Runway, Cash Cycle, Business Health Score
 */

export interface HealthScoreThresholds {
  minRunwayMonths: number; // e.g., 3
  maxLoanPercentage: number; // e.g., 10
  minCashMonths: number; // e.g., 2
  maxDSODays: number; // e.g., 45
}

export interface CalculatedMetrics {
  cashInHand: number;
  monthlyExpenses: number;
  runwayMonths: number;
  daysToCollect: number; // DSO
  daysToPay: number; // DPO
  cashCycleGap: number;
  healthScore: number;
  healthStatus: 'healthy' | 'fair' | 'at-risk';
}

/**
 * Calculate Days Sales Outstanding (DSO)
 * How long it takes to collect payment from customers
 * DSO = (Unpaid Revenue Invoices Total / Monthly Revenue) × 30
 */
export function calculateDSO(unpaidRevenueAmount: number, monthlyRevenue: number): number {
  if (monthlyRevenue === 0) return 0;
  return Math.round((unpaidRevenueAmount / monthlyRevenue) * 30);
}

/**
 * Calculate Days Payable Outstanding (DPO)
 * How long it takes to pay suppliers
 * DPO = (Unpaid Obligations Total / Monthly Expenses) × 30
 */
export function calculateDPO(unpaidObligationsAmount: number, monthlyExpenses: number): number {
  if (monthlyExpenses === 0) return 0;
  return Math.round((unpaidObligationsAmount / monthlyExpenses) * 30);
}

/**
 * Calculate Cash Cycle Gap
 * Gap = DSO - DPO
 * Negative = favorable (collect before paying)
 * Positive = unfavorable (pay before collecting)
 */
export function calculateCashCycleGap(dso: number, dpo: number): number {
  return dso - dpo;
}

/**
 * Calculate Runway in months
 * Runway = Unallocated Cash / Average Monthly Expenses
 */
export function calculateRunway(cashInHand: number, monthlyExpenses: number): number {
  if (monthlyExpenses === 0) return 0;
  return Number((cashInHand / monthlyExpenses).toFixed(1));
}

/**
 * Calculate Business Health Score (0-100)
 * Weighted formula based on multiple factors
 */
export function calculateHealthScore(
  runwayMonths: number,
  monthlyLoans: number,
  monthlyRevenue: number,
  cashInHand: number,
  monthlyExpenses: number,
  dso: number,
  thresholds: HealthScoreThresholds
): number {
  let totalScore = 0;

  // 1. Runway Score (40% weight)
  let runwayScore = 0;
  if (runwayMonths >= thresholds.minRunwayMonths) {
    runwayScore = 100;
  } else if (runwayMonths >= 1) {
    runwayScore = 60;
  } else {
    runwayScore = 20;
  }
  totalScore += runwayScore * 0.4;

  // 2. Loan Ratio Score (30% weight)
  let loanScore = 0;
  const loanPercentage = monthlyRevenue === 0 ? 0 : (monthlyLoans / monthlyRevenue) * 100;
  if (loanPercentage <= thresholds.maxLoanPercentage) {
    loanScore = 100;
  } else if (loanPercentage <= thresholds.maxLoanPercentage * 2) {
    loanScore = 60;
  } else {
    loanScore = 20;
  }
  totalScore += loanScore * 0.3;

  // 3. Cash Position Score (20% weight)
  let cashScore = 0;
  const cashMonths = monthlyExpenses === 0 ? 0 : cashInHand / monthlyExpenses;
  if (cashMonths >= thresholds.minCashMonths) {
    cashScore = 100;
  } else if (cashMonths >= 1) {
    cashScore = 60;
  } else {
    cashScore = 20;
  }
  totalScore += cashScore * 0.2;

  // 4. DSO Efficiency Score (10% weight)
  let dsoScore = 0;
  if (dso <= thresholds.maxDSODays) {
    dsoScore = 100;
  } else if (dso <= thresholds.maxDSODays * 1.5) {
    dsoScore = 60;
  } else {
    dsoScore = 20;
  }
  totalScore += dsoScore * 0.1;

  return Math.round(totalScore);
}

/**
 * Determine health status based on score
 */
export function getHealthStatus(score: number): 'healthy' | 'fair' | 'at-risk' {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'fair';
  return 'at-risk';
}

/**
 * Get insights for health score
 */
export function getHealthInsights(
  runwayMonths: number,
  loanPercentage: number,
  cashMonths: number,
  dso: number,
  thresholds: HealthScoreThresholds
): string[] {
  const insights: string[] = [];

  if (runwayMonths >= thresholds.minRunwayMonths) {
    insights.push(`Strong runway of ${runwayMonths.toFixed(1)} months provides operational cushion.`);
  } else if (runwayMonths < 1) {
    insights.push(`Critical: Only ${runwayMonths.toFixed(1)} months runway. Immediate cash action needed.`);
  } else {
    insights.push(`Runway of ${runwayMonths.toFixed(1)} months. Monitor closely.`);
  }

  if (loanPercentage <= thresholds.maxLoanPercentage) {
    insights.push(`Healthy loan ratio at ${loanPercentage.toFixed(1)}% of revenue.`);
  } else {
    insights.push(`Loans at ${loanPercentage.toFixed(1)}% of revenue. Consider debt management.`);
  }

  if (cashMonths >= thresholds.minCashMonths) {
    insights.push(`Cash reserves cover ${cashMonths.toFixed(1)} months of expenses.`);
  } else {
    insights.push(`Low cash reserves. ${cashMonths.toFixed(1)} months of coverage.`);
  }

  if (dso <= thresholds.maxDSODays) {
    insights.push(`Collection cycle of ${dso} days is efficient.`);
  } else {
    insights.push(`Collection cycle of ${dso} days. Consider improving receivables.`);
  }

  return insights;
}

/**
 * Alias for calculateHealthScore for backward compatibility
 */
export const calculateBusinessHealth = calculateHealthScore;
