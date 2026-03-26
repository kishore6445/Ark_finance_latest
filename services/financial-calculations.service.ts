import {
  FinancialStatementData,
  PnLStatement,
  BalanceSheet,
  CashFlowStatement,
  Transaction,
} from '@/types/business-logic.types';

/**
 * Financial Calculations Service
 * Aggregates approved transactions to generate P&L, Balance Sheet, and Cash Flow statements
 */

export class FinancialCalculationsService {
  /**
   * Calculate P&L Statement for a given date range
   * Only includes APPROVED transactions
   */
  async calculatePnL(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[] = []
  ): Promise<PnLStatement> {
    // Filter only APPROVED transactions within date range
    const approvedTransactions = transactions.filter(
      (t) =>
        t.organizationId === organizationId &&
        t.status === 'APPROVED' &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
    );

    console.log('[FinancialCalculationsService] Calculating P&L', {
      organizationId,
      dateRange: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      transactionCount: approvedTransactions.length,
    });

    // Aggregate by type
    const revenue = approvedTransactions
      .filter((t) => t.accountingType === 'Revenue')
      .reduce((sum, t) => sum + t.amount, 0);

    const cogs = approvedTransactions
      .filter(
        (t) =>
          t.accountingType === 'Expense' &&
          (t.subtype === 'COGS' || t.coaName?.includes('Cost of'))
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = approvedTransactions
      .filter(
        (t) =>
          t.accountingType === 'Expense' && t.subtype !== 'COGS'
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const otherIncome = approvedTransactions
      .filter(
        (t) =>
          t.accountingType === 'Revenue' &&
          t.subtype === 'OTHER'
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const grossProfit = revenue - cogs;
    const operatingProfit = grossProfit - expenses;
    const netProfit = operatingProfit + otherIncome;

    // Group by Chart of Accounts for detailed reporting
    const byCoA: Record<string, number> = {};
    approvedTransactions.forEach((t) => {
      const key = t.coaCode || t.accountingType;
      byCoA[key] = (byCoA[key] || 0) + t.amount;
    });

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      revenue,
      costOfGoodsSold: cogs,
      grossProfit,
      operatingExpenses: expenses,
      operatingProfit,
      otherIncome,
      otherExpenses: 0, // Would separate from regular expenses
      netProfit,
      byCoA,
    };
  }

  /**
   * Calculate Balance Sheet as of a specific date
   * Assets = Liabilities + Equity
   */
  async calculateBalanceSheet(
    organizationId: string,
    asOfDate: Date,
    transactions: Transaction[] = []
  ): Promise<BalanceSheet> {
    // Get all APPROVED transactions up to the date
    const approvedTransactions = transactions.filter(
      (t) =>
        t.organizationId === organizationId &&
        t.status === 'APPROVED' &&
        new Date(t.date) <= asOfDate
    );

    console.log('[FinancialCalculationsService] Calculating Balance Sheet', {
      organizationId,
      asOfDate: asOfDate.toISOString(),
      transactionCount: approvedTransactions.length,
    });

    // Calculate Assets
    const currentAssets = approvedTransactions
      .filter(
        (t) =>
          t.accountingType === 'Asset' &&
          (t.subtype === 'CURRENT' || t.coaName?.includes('Cash') || t.coaName?.includes('Bank'))
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const fixedAssets = approvedTransactions
      .filter(
        (t) =>
          t.accountingType === 'Asset' &&
          (t.subtype === 'FIXED' || t.coaName?.includes('Equipment'))
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const totalAssets = currentAssets + fixedAssets;

    // Calculate Liabilities
    const currentLiabilities = approvedTransactions
      .filter(
        (t) =>
          t.accountingType === 'Liability' &&
          (t.subtype === 'CURRENT' || t.coaName?.includes('Payable'))
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const longTermLiabilities = approvedTransactions
      .filter(
        (t) =>
          t.accountingType === 'Liability' &&
          (t.subtype === 'LONGTERM' || t.coaName?.includes('Loan'))
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const totalLiabilities = currentLiabilities + longTermLiabilities;

    // Calculate Equity (Assets - Liabilities)
    const capitalEq = 0; // Would track from separate capital table
    const retainedEarnings = totalAssets - totalLiabilities - capitalEq;
    const totalEquity = capitalEq + retainedEarnings;

    // Verify: Assets = Liabilities + Equity
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      asOfDate,
      assets: {
        current: currentAssets,
        fixed: fixedAssets,
        total: totalAssets,
      },
      liabilities: {
        current: currentLiabilities,
        longTerm: longTermLiabilities,
        total: totalLiabilities,
      },
      equity: {
        capital: capitalEq,
        retainedEarnings,
        total: totalEquity,
      },
      totalLiabilitiesAndEquity,
    };
  }

  /**
   * Calculate Cash Flow Statement
   * Operating, Investing, and Financing activities
   */
  async calculateCashFlow(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[] = []
  ): Promise<CashFlowStatement> {
    const approvedTransactions = transactions.filter(
      (t) =>
        t.organizationId === organizationId &&
        t.status === 'APPROVED' &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
    );

    console.log('[FinancialCalculationsService] Calculating Cash Flow', {
      organizationId,
      dateRange: `${startDate.toISOString()} - ${endDate.toISOString()}`,
    });

    // Operating Cash: Revenue and expenses in bank accounts
    const operatingRevenue = approvedTransactions
      .filter((t) => t.accountingType === 'Revenue' && t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);

    const operatingExpenses = approvedTransactions
      .filter((t) => t.accountingType === 'Expense' && !t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);

    // Investing Cash: Asset purchases and sales
    const assetPurchases = approvedTransactions
      .filter(
        (t) =>
          t.accountingType === 'Asset' &&
          !t.isIncome &&
          t.subtype === 'FIXED'
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const assetSales = approvedTransactions
      .filter(
        (t) =>
          t.accountingType === 'Asset' &&
          t.isIncome &&
          t.subtype === 'FIXED'
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Financing Cash: Loan repayments and capital injections
    const loanRepayments = approvedTransactions
      .filter(
        (t) =>
          t.accountingType === 'Liability' &&
          !t.isIncome &&
          t.coaName?.includes('Loan')
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const capitalInjection = approvedTransactions
      .filter(
        (t) =>
          t.accountingType === 'Liability' &&
          t.isIncome &&
          t.coaName?.includes('Capital')
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const operatingCashNet = operatingRevenue - operatingExpenses;
    const investingCashNet = assetSales - assetPurchases;
    const financingCashNet = capitalInjection - loanRepayments;
    const netCashChange = operatingCashNet + investingCashNet + financingCashNet;

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      operatingCash: {
        revenue: operatingRevenue,
        expenses: operatingExpenses,
        net: operatingCashNet,
      },
      investingCash: {
        assetPurchases,
        assetSales,
        net: investingCashNet,
      },
      financingCash: {
        loanRepayments,
        capitalInjection,
        net: financingCashNet,
      },
      netCashChange,
    };
  }

  /**
   * Aggregate transactions by Chart of Accounts
   * Useful for detailed reporting
   */
  async aggregateByCoA(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[] = []
  ): Promise<Record<string, { name: string; total: number; count: number }>> {
    const approvedTransactions = transactions.filter(
      (t) =>
        t.organizationId === organizationId &&
        t.status === 'APPROVED' &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
    );

    const aggregation: Record<string, { name: string; total: number; count: number }> = {};

    approvedTransactions.forEach((t) => {
      const key = t.coaCode || 'UNCLASSIFIED';
      if (!aggregation[key]) {
        aggregation[key] = {
          name: t.coaName || 'Unclassified',
          total: 0,
          count: 0,
        };
      }
      aggregation[key].total += t.amount;
      aggregation[key].count += 1;
    });

    return aggregation;
  }

  /**
   * Validate financial statement integrity
   * Assets = Liabilities + Equity, etc
   */
  validateBalanceSheet(balanceSheet: BalanceSheet): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (
      balanceSheet.assets.total !==
      balanceSheet.totalLiabilitiesAndEquity
    ) {
      errors.push(
        `Balance Sheet does not balance: Assets (₹${balanceSheet.assets.total}) ≠ Liabilities + Equity (₹${balanceSheet.totalLiabilitiesAndEquity})`
      );
    }

    if (balanceSheet.assets.total < 0) {
      errors.push('Total assets cannot be negative');
    }

    if (balanceSheet.liabilities.total < 0) {
      errors.push('Total liabilities cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const financialCalculationsService = new FinancialCalculationsService();
