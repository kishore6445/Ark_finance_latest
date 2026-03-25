export interface FinancialCategory {
  name: string;
  type: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity';
  subcategories: string[];
}

export interface PLStatement {
  period: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: Record<string, number>;
  operatingProfit: number;
  interestAndTax: number;
  netProfit: number;
  expenses: Record<string, number>;
}

export interface BalanceSheetItem {
  name: string;
  amount: number;
  subcategories?: Record<string, number>;
}

export interface BalanceSheet {
  date: string;
  assets: BalanceSheetItem[];
  totalAssets: number;
  liabilities: BalanceSheetItem[];
  totalLiabilities: number;
  equity: BalanceSheetItem[];
  totalEquity: number;
}

export interface CashFlowStatement {
  period: string;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

// Transaction interface (from app-state)
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  vendor?: string;
  status: 'pending' | 'completed' | 'failed';
  bucket?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  partyName: string;
  type: 'Revenue' | 'Expense';
  invoiceAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Partially Paid';
}

// Category mapping for automatic P&L categorization
const REVENUE_CATEGORIES = ['Sales', 'Service Revenue', 'Other Income', 'Interest Income'];
const COGS_CATEGORIES = ['COGS', 'Cost of Goods Sold', 'Materials', 'Production'];
const EXPENSE_CATEGORIES = {
  'Salaries': ['Salaries', 'Wages', 'Payroll'],
  'Utilities': ['Utilities', 'Electric', 'Water', 'Internet'],
  'Marketing': ['Marketing', 'Advertising', 'Promotion'],
  'Travel': ['Travel', 'Transportation', 'Fuel'],
  'Office': ['Office Supplies', 'Equipment', 'Rent'],
  'Other': ['Miscellaneous', 'Other Expenses'],
};

/**
 * CHART OF ACCOUNTS - Indian Accounting Standards
 * Maps transaction subtypes to chart of accounts line items
 */
export interface ChartOfAccountsLine {
  code: string;
  name: string;
  category: 'Revenue' | 'COGS' | 'Operating Expenses' | 'Assets' | 'Liabilities' | 'Equity';
  section: string;
  keywords: string[];
}

export const CHART_OF_ACCOUNTS: ChartOfAccountsLine[] = [
  // REVENUE SECTION
  { code: '1010', name: 'Sale of Goods', category: 'Revenue', section: 'Revenue from Operations', keywords: ['sales', 'sale', 'goods', 'products'] },
  { code: '1020', name: 'Service Revenue', category: 'Revenue', section: 'Revenue from Operations', keywords: ['service', 'revenue', 'professional', 'consulting'] },
  { code: '1030', name: 'Other Operating Revenue', category: 'Revenue', section: 'Revenue from Operations', keywords: ['other income', 'misc revenue', 'rental'] },
  
  // OTHER INCOME
  { code: '1100', name: 'Interest Income', category: 'Revenue', section: 'Other Income', keywords: ['interest', 'bank interest', 'investment income'] },
  { code: '1110', name: 'Dividend Income', category: 'Revenue', section: 'Other Income', keywords: ['dividend', 'investment'] },
  { code: '1120', name: 'Gain on Sale of Assets', category: 'Revenue', section: 'Other Income', keywords: ['gain', 'sale', 'asset'] },

  // COST OF MATERIALS CONSUMED
  { code: '2010', name: 'Opening Stock of Raw Materials', category: 'COGS', section: 'Cost of Materials', keywords: ['opening stock', 'raw material', 'inventory'] },
  { code: '2020', name: 'Purchases of Raw Materials', category: 'COGS', section: 'Cost of Materials', keywords: ['purchase', 'material', 'raw'] },
  { code: '2030', name: 'Closing Stock of Raw Materials', category: 'COGS', section: 'Cost of Materials', keywords: ['closing stock', 'ending inventory'] },
  { code: '2040', name: 'Cost of Materials Consumed', category: 'COGS', section: 'Cost of Materials', keywords: ['cogs', 'cost of goods'] },

  // EMPLOYEE BENEFITS
  { code: '3010', name: 'Salary and Wages', category: 'Operating Expenses', section: 'Employee Benefits Expense', keywords: ['salary', 'wages', 'payroll', 'compensation'] },
  { code: '3020', name: 'Gratuity and Severance', category: 'Operating Expenses', section: 'Employee Benefits Expense', keywords: ['gratuity', 'severance', 'termination'] },
  { code: '3030', name: 'Staff Welfare and Benefits', category: 'Operating Expenses', section: 'Employee Benefits Expense', keywords: ['welfare', 'benefits', 'insurance', 'medical'] },

  // DEPRECIATION
  { code: '4010', name: 'Depreciation - Building', category: 'Operating Expenses', section: 'Depreciation and Amortization', keywords: ['depreciation', 'building'] },
  { code: '4020', name: 'Depreciation - Plant & Machinery', category: 'Operating Expenses', section: 'Depreciation and Amortization', keywords: ['depreciation', 'machinery', 'equipment'] },
  { code: '4030', name: 'Depreciation - Vehicles', category: 'Operating Expenses', section: 'Depreciation and Amortization', keywords: ['depreciation', 'vehicle', 'transport'] },
  { code: '4040', name: 'Amortization - Intangibles', category: 'Operating Expenses', section: 'Depreciation and Amortization', keywords: ['amortization', 'intangible'] },

  // OTHER OPERATING EXPENSES
  { code: '5010', name: 'Power and Fuel', category: 'Operating Expenses', section: 'Other Expenses', keywords: ['power', 'fuel', 'electricity', 'gas'] },
  { code: '5020', name: 'Repairs and Maintenance', category: 'Operating Expenses', section: 'Other Expenses', keywords: ['repair', 'maintenance', 'service'] },
  { code: '5030', name: 'Rent', category: 'Operating Expenses', section: 'Other Expenses', keywords: ['rent', 'lease', 'occupancy'] },
  { code: '5040', name: 'Rates and Taxes', category: 'Operating Expenses', section: 'Other Expenses', keywords: ['rates', 'taxes', 'property tax', 'municipal'] },
  { code: '5050', name: 'Insurance', category: 'Operating Expenses', section: 'Other Expenses', keywords: ['insurance', 'premium'] },
  { code: '5060', name: 'Advertisement and Promotion', category: 'Operating Expenses', section: 'Other Expenses', keywords: ['advertisement', 'marketing', 'promotion'] },
  { code: '5070', name: 'Travelling and Conveyance', category: 'Operating Expenses', section: 'Other Expenses', keywords: ['travel', 'conveyance', 'transportation'] },
  { code: '5080', name: 'Telephone and Internet', category: 'Operating Expenses', section: 'Other Expenses', keywords: ['telephone', 'internet', 'communication'] },
  { code: '5090', name: 'Printing and Stationery', category: 'Operating Expenses', section: 'Other Expenses', keywords: ['printing', 'stationery', 'office'] },
  { code: '5100', name: 'Professional Fees', category: 'Operating Expenses', section: 'Other Expenses', keywords: ['professional', 'fees', 'audit', 'legal', 'consultant'] },
  { code: '5110', name: 'Bank Charges', category: 'Operating Expenses', section: 'Other Expenses', keywords: ['bank', 'charges', 'fee'] },

  // FINANCE COSTS
  { code: '6010', name: 'Interest Expense', category: 'Operating Expenses', section: 'Finance Costs', keywords: ['interest', 'finance', 'loan'] },

  // ASSETS
  { code: '7010', name: 'Cash and Bank', category: 'Assets', section: 'Current Assets', keywords: ['cash', 'bank', 'balance'] },
  { code: '7020', name: 'Inventory', category: 'Assets', section: 'Current Assets', keywords: ['inventory', 'stock'] },
  { code: '7030', name: 'Trade Receivables', category: 'Assets', section: 'Current Assets', keywords: ['receivable', 'customer', 'ar', 'debtors'] },
  { code: '7040', name: 'Other Current Assets', category: 'Assets', section: 'Current Assets', keywords: ['prepaid', 'advance', 'other current'] },
  { code: '7050', name: 'Property, Plant & Equipment', category: 'Assets', section: 'Non-Current Assets', keywords: ['property', 'plant', 'equipment', 'fixed asset'] },
  { code: '7060', name: 'Intangible Assets', category: 'Assets', section: 'Non-Current Assets', keywords: ['intangible', 'goodwill', 'software'] },

  // LIABILITIES
  { code: '8010', name: 'Trade Payables', category: 'Liabilities', section: 'Current Liabilities', keywords: ['payable', 'vendor', 'supplier', 'ap', 'creditors'] },
  { code: '8020', name: 'Short-term Borrowings', category: 'Liabilities', section: 'Current Liabilities', keywords: ['loan', 'borrowing', 'short-term', 'credit'] },
  { code: '8030', name: 'GST Payable', category: 'Liabilities', section: 'Current Liabilities', keywords: ['gst', 'tax payable', 'output tax'] },
  { code: '8040', name: 'Employee Benefits Payable', category: 'Liabilities', section: 'Current Liabilities', keywords: ['payable', 'gratuity', 'salary payable'] },
  { code: '8050', name: 'Other Current Liabilities', category: 'Liabilities', section: 'Current Liabilities', keywords: ['accrued', 'other liability'] },
  { code: '8060', name: 'Long-term Borrowings', category: 'Liabilities', section: 'Non-Current Liabilities', keywords: ['long-term', 'term loan', 'debt'] },
  { code: '8070', name: 'Deferred Tax Liability', category: 'Liabilities', section: 'Non-Current Liabilities', keywords: ['deferred tax', 'dtl'] },

  // EQUITY
  { code: '9010', name: 'Share Capital', category: 'Equity', section: 'Equity', keywords: ['capital', 'share', 'stock'] },
  { code: '9020', name: 'Reserves and Surplus', category: 'Equity', section: 'Equity', keywords: ['reserve', 'surplus', 'retained earnings'] },
];

/**
 * Map a transaction to chart of accounts
 */
export function mapTransactionToAccount(description: string, subtype: string): ChartOfAccountsLine | null {
  const searchText = `${description} ${subtype}`.toLowerCase();
  
  for (const line of CHART_OF_ACCOUNTS) {
    if (line.keywords.some(kw => searchText.includes(kw.toLowerCase()))) {
      return line;
    }
  }
  
  return null;
}

/**
 * Aggregate transactions by chart of accounts
 */
export function aggregateByAccount(transactions: any[]): Record<string, number> {
  const aggregated: Record<string, number> = {};
  
  for (const tx of transactions) {
    const account = mapTransactionToAccount(tx.description, tx.subtype);
    if (account) {
      const key = `${account.code}_${account.name}`;
      aggregated[key] = (aggregated[key] || 0) + (tx.isIncome ? tx.amount : -tx.amount);
    }
  }
  
  return aggregated;
}

/**
 * Generate Enhanced P&L Statement from transactions using Chart of Accounts
 */
export function generateEnhancedPLStatement(
  transactions: any[],
  invoices: any[],
  startDate: string,
  endDate: string
): any {
  // Filter transactions by date range
  const filtered = transactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate >= new Date(startDate) && txDate <= new Date(endDate);
  });

  // Aggregate by account
  const byAccount = aggregateByAccount(filtered);

  // Build statement sections
  const statement: any = {
    period: `${startDate} to ${endDate}`,
    sections: [],
    summary: {}
  };

  // Revenue from Operations
  const revenueItems = CHART_OF_ACCOUNTS.filter(acc => acc.section === 'Revenue from Operations');
  let totalRevenue = 0;
  const revenueSection: any = { name: 'Revenue from Operations', items: [] };
  
  for (const item of revenueItems) {
    const key = `${item.code}_${item.name}`;
    const amount = byAccount[key] || 0;
    if (amount !== 0) {
      revenueSection.items.push({ account: item.name, amount, code: item.code });
      totalRevenue += amount;
    }
  }
  revenueSection.total = totalRevenue;
  statement.sections.push(revenueSection);

  // Other Income
  const otherIncomeItems = CHART_OF_ACCOUNTS.filter(acc => acc.section === 'Other Income');
  let totalOtherIncome = 0;
  const otherIncomeSection: any = { name: 'Other Income', items: [] };
  
  for (const item of otherIncomeItems) {
    const key = `${item.code}_${item.name}`;
    const amount = byAccount[key] || 0;
    if (amount !== 0) {
      otherIncomeSection.items.push({ account: item.name, amount, code: item.code });
      totalOtherIncome += amount;
    }
  }
  otherIncomeSection.total = totalOtherIncome;
  statement.sections.push(otherIncomeSection);

  // Cost of Materials
  const cogsItems = CHART_OF_ACCOUNTS.filter(acc => acc.section === 'Cost of Materials');
  let totalCOGS = 0;
  const cogsSection: any = { name: 'Cost of Materials Consumed', items: [] };
  
  for (const item of cogsItems) {
    const key = `${item.code}_${item.name}`;
    const amount = byAccount[key] || 0;
    if (amount !== 0) {
      cogsSection.items.push({ account: item.name, amount, code: item.code });
      totalCOGS += Math.abs(amount);
    }
  }
  cogsSection.total = totalCOGS;
  statement.sections.push(cogsSection);

  // Employee Benefits
  const empBenefitItems = CHART_OF_ACCOUNTS.filter(acc => acc.section === 'Employee Benefits Expense');
  let totalEmpBenefits = 0;
  const empBenefitSection: any = { name: 'Employee Benefits Expense', items: [] };
  
  for (const item of empBenefitItems) {
    const key = `${item.code}_${item.name}`;
    const amount = byAccount[key] || 0;
    if (amount !== 0) {
      empBenefitSection.items.push({ account: item.name, amount, code: item.code });
      totalEmpBenefits += Math.abs(amount);
    }
  }
  empBenefitSection.total = totalEmpBenefits;
  statement.sections.push(empBenefitSection);

  // Depreciation
  const depreciationItems = CHART_OF_ACCOUNTS.filter(acc => acc.section === 'Depreciation and Amortization');
  let totalDepreciation = 0;
  const depreciationSection: any = { name: 'Depreciation and Amortization', items: [] };
  
  for (const item of depreciationItems) {
    const key = `${item.code}_${item.name}`;
    const amount = byAccount[key] || 0;
    if (amount !== 0) {
      depreciationSection.items.push({ account: item.name, amount, code: item.code });
      totalDepreciation += Math.abs(amount);
    }
  }
  depreciationSection.total = totalDepreciation;
  statement.sections.push(depreciationSection);

  // Other Expenses
  const expenseItems = CHART_OF_ACCOUNTS.filter(acc => acc.section === 'Other Expenses');
  let totalOtherExpenses = 0;
  const expenseSection: any = { name: 'Other Expenses', items: [] };
  
  for (const item of expenseItems) {
    const key = `${item.code}_${item.name}`;
    const amount = byAccount[key] || 0;
    if (amount !== 0) {
      expenseSection.items.push({ account: item.name, amount, code: item.code });
      totalOtherExpenses += Math.abs(amount);
    }
  }
  expenseSection.total = totalOtherExpenses;
  statement.sections.push(expenseSection);

  // Finance Costs
  const financeItems = CHART_OF_ACCOUNTS.filter(acc => acc.section === 'Finance Costs');
  let totalFinanceCosts = 0;
  const financeSection: any = { name: 'Finance Costs', items: [] };
  
  for (const item of financeItems) {
    const key = `${item.code}_${item.name}`;
    const amount = byAccount[key] || 0;
    if (amount !== 0) {
      financeSection.items.push({ account: item.name, amount, code: item.code });
      totalFinanceCosts += Math.abs(amount);
    }
  }
  financeSection.total = totalFinanceCosts;
  statement.sections.push(financeSection);

  // Summary calculations
  const totalExpenses = totalCOGS + totalEmpBenefits + totalDepreciation + totalOtherExpenses + totalFinanceCosts;
  const profitBeforeTax = (totalRevenue + totalOtherIncome) - totalExpenses;
  const tax = profitBeforeTax * 0.30; // 30% tax rate
  const netProfit = profitBeforeTax - tax;

  statement.summary = {
    totalRevenue,
    totalOtherIncome,
    totalIncome: totalRevenue + totalOtherIncome,
    totalCOGS,
    grossProfit: totalRevenue - totalCOGS,
    totalEmployeeBenefits: totalEmpBenefits,
    totalDepreciation,
    totalOtherExpenses,
    totalFinanceCosts,
    totalExpenses,
    profitBeforeTax,
    taxExpense: tax,
    netProfit
  };

  return statement;
}

/**
 * Generate P&L Statement from transactions
 */
export function generatePLStatement(
  transactions: Transaction[],
  invoices: Invoice[],
  startDate: string,
  endDate: string
): PLStatement {
  // Filter transactions by date range
  const filtered = transactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate >= new Date(startDate) && txDate <= new Date(endDate);
  });

  // Calculate revenue
  const revenue = filtered
    .filter(t => t.type === 'income' || (t.category && REVENUE_CATEGORIES.some(c => t.category.includes(c))))
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate COGS
  const cogs = filtered
    .filter(t => t.category && COGS_CATEGORIES.some(c => t.category.includes(c)))
    .reduce((sum, t) => sum + t.amount, 0);

  const grossProfit = revenue - cogs;

  // Calculate operating expenses by category
  const operatingExpenses: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(EXPENSE_CATEGORIES)) {
    operatingExpenses[category] = filtered
      .filter(t => t.type === 'expense' && t.category && keywords.some(k => t.category.includes(k)))
      .reduce((sum, t) => sum + t.amount, 0);
  }

  const totalOperatingExpenses = Object.values(operatingExpenses).reduce((sum, val) => sum + val, 0);
  const operatingProfit = grossProfit - totalOperatingExpenses;

  // Interest and tax (simplified - typically would be separate transactions)
  const interestAndTax = filtered
    .filter(t => t.category && (t.category.includes('Interest') || t.category.includes('Tax')))
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = operatingProfit - interestAndTax;

  // All expenses for detailed view
  const expenses: Record<string, number> = {};
  filtered.forEach(t => {
    if (t.type === 'expense') {
      expenses[t.category] = (expenses[t.category] || 0) + t.amount;
    }
  });

  return {
    period: `${startDate} to ${endDate}`,
    revenue,
    cogs,
    grossProfit,
    operatingExpenses,
    operatingProfit,
    interestAndTax,
    netProfit,
    expenses,
  };
}

/**
 * Generate Balance Sheet as of a specific date
 */
export function generateBalanceSheet(
  transactions: Transaction[],
  invoices: Invoice[],
  asOfDate: string
): BalanceSheet {
  // Filter transactions up to the date
  const filtered = transactions.filter(t => new Date(t.date) <= new Date(asOfDate));

  // Calculate cash (sum of all income minus expenses)
  const cash = filtered.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0);

  // Accounts Receivable (from unpaid revenue invoices)
  const accountsReceivable = invoices
    .filter(inv => inv.type === 'Revenue' && inv.balanceDue > 0)
    .reduce((sum, inv) => sum + inv.balanceDue, 0);

  // Fixed Assets (simplified - from expense transactions marked as assets)
  const fixedAssets = filtered
    .filter(t => t.category && (t.category.includes('Equipment') || t.category.includes('Property')))
    .reduce((sum, t) => sum + t.amount, 0);

  // Total Assets
  const totalAssets = cash + accountsReceivable + fixedAssets;

  // Accounts Payable (from unpaid expense invoices)
  const accountsPayable = invoices
    .filter(inv => inv.type === 'Expense' && inv.balanceDue > 0)
    .reduce((sum, inv) => sum + inv.balanceDue, 0);

  // Short-term loans (simplified - from expense transactions)
  const loans = filtered
    .filter(t => t.category && (t.category.includes('Loan') || t.category.includes('Debt')))
    .reduce((sum, t) => sum + t.amount, 0);

  // Total Liabilities
  const totalLiabilities = accountsPayable + loans;

  // Equity (simplified)
  const retainedEarnings = filtered
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) -
    filtered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

  const totalEquity = retainedEarnings;

  const assets = [
    { name: 'Cash', amount: Math.max(0, cash) },
    { name: 'Accounts Receivable', amount: accountsReceivable },
    { name: 'Fixed Assets', amount: fixedAssets },
  ];

  const liabilities = [
    { name: 'Accounts Payable', amount: accountsPayable },
    { name: 'Loans Payable', amount: loans },
  ];

  const equity = [
    { name: 'Retained Earnings', amount: retainedEarnings },
  ];

  return {
    date: asOfDate,
    assets,
    totalAssets,
    liabilities,
    totalLiabilities,
    equity,
    totalEquity,
  };
}

/**
 * Generate Cash Flow Statement
 */
export function generateCashFlowStatement(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): CashFlowStatement {
  const filtered = transactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate >= new Date(startDate) && txDate <= new Date(endDate);
  });

  // Operating cash flow (simplified - net income equivalent)
  const operatingCashFlow = filtered
    .filter(t => !t.category.includes('Equipment') && !t.category.includes('Property'))
    .reduce((sum, t) => (t.type === 'income' ? sum + t.amount : sum - t.amount), 0);

  // Investing cash flow (from asset purchases/sales)
  const investingCashFlow = filtered
    .filter(t => t.category.includes('Equipment') || t.category.includes('Property'))
    .reduce((sum, t) => (t.type === 'income' ? sum + t.amount : sum - t.amount), 0);

  // Financing cash flow (from loans/equity)
  const financingCashFlow = filtered
    .filter(t => t.category.includes('Loan') || t.category.includes('Capital'))
    .reduce((sum, t) => (t.type === 'income' ? sum + t.amount : sum - t.amount), 0);

  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

  return {
    period: `${startDate} to ${endDate}`,
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
    netCashFlow,
    beginningCash: 0, // Would need historical data
    endingCash: netCashFlow,
  };
}

/**
 * Get date range based on period type
 */
export function getDateRange(periodType: 'today' | 'month' | 'quarter' | 'year'): { start: string; end: string } {
  const today = new Date();
  let start: Date;
  const end = new Date(today);

  switch (periodType) {
    case 'today':
      start = new Date(today);
      break;
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      start = new Date(today.getFullYear(), 0, 1);
      break;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}
