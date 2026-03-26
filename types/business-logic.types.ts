// Shared types for business logic services

export interface ApprovalRequest {
  id: string;
  transactionId: string;
  organizationId: string;
  amount: number;
  type: 'Revenue' | 'Expense' | 'Asset' | 'Liability';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';
  approvalLevel: 'NONE' | 'MANAGER' | 'ADMIN' | 'ADMIN_AUDITOR';
  approverRole?: string;
  approverUserId?: string;
  reason?: string;
  approvalDate?: Date;
  createdAt: Date;
}

export interface ApprovalChainConfig {
  thresholdBasic: number; // < this = auto-approve (₹10,000)
  thresholdManager: number; // ₹10K-₹1L = Manager
  thresholdAdmin: number; // > ₹1L = Admin (₹1,00,000)
  criticalTypes: string[]; // Payroll, Legal, etc
}

export interface FinancialStatementData {
  revenue: number;
  cogs: number;
  expenses: number;
  netProfit: number;
  assets: number;
  liabilities: number;
  equity: number;
  operatingCash: number;
  investingCash: number;
  financingCash: number;
}

export interface PnLStatement {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingProfit: number;
  otherIncome: number;
  otherExpenses: number;
  netProfit: number;
  byCoA: Record<string, number>;
}

export interface BalanceSheet {
  asOfDate: Date;
  assets: {
    current: number;
    fixed: number;
    total: number;
  };
  liabilities: {
    current: number;
    longTerm: number;
    total: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    total: number;
  };
  totalLiabilitiesAndEquity: number;
}

export interface CashFlowStatement {
  period: string;
  operatingCash: {
    revenue: number;
    expenses: number;
    net: number;
  };
  investingCash: {
    assetPurchases: number;
    assetSales: number;
    net: number;
  };
  financingCash: {
    loanRepayments: number;
    capitalInjection: number;
    net: number;
  };
  netCashChange: number;
}

export interface InvoiceMatch {
  invoiceId: string;
  transactionId: string;
  amountVariance: number;
  dateVariance: number;
  partyMatchScore: number; // 0-100
  overallConfidence: number; // 0-100
  matchType: 'EXACT' | 'PARTIAL' | 'SUGGESTED';
  matchedAt?: Date;
}

export interface BankReconciliationItem {
  bankTransactionId: string;
  amount: number;
  date: Date;
  description: string;
  systemTransactionId?: string;
  status: 'MATCHED' | 'UNMATCHED' | 'DISCREPANCY';
  variance?: number;
}

export interface BankReconciliationReport {
  bankAccountId: string;
  statementDate: Date;
  bankClosingBalance: number;
  systemBalance: number;
  difference: number;
  matchedItems: number;
  unmatchedItems: number;
  outstandingCheques: number;
  depositsInTransit: number;
  status: 'PENDING' | 'COMPLETED';
}

export interface GSTReturn {
  period: string; // "Q1-2024"
  organizationId: string;
  inputTax: number; // ITC
  outputTax: number; // Tax on sales
  netGSTPay: number; // Output - Input
  filingDeadline: Date;
  paymentDeadline: Date;
  status: 'OPEN' | 'FILED' | 'PAID';
}

export interface GSTTransaction {
  transactionId: string;
  taxableAmount: number;
  gstRate: 5 | 12 | 18 | 28; // percentage
  gstAmount: number;
  type: 'INPUT' | 'OUTPUT'; // Purchase or Sale
  date: Date;
}

export interface ClassificationSuggestion {
  coaCode: string;
  coaName: string;
  confidence: number; // 0-100
  keywords: string[];
  reason: string;
}

export interface CoAClassification {
  transactionId: string;
  coaCode: string;
  coaName: string;
  confidence: number;
  manualOverride: boolean;
  acceptedAt?: Date;
  learnKey?: string; // For ML learning
}

export interface TransactionWithClassification {
  id: string;
  description: string;
  amount: number;
  date: Date;
  suggestedCoA?: ClassificationSuggestion[];
  assignedCoA?: CoAClassification;
}

// Transaction types for API integration
export interface Transaction {
  id: string;
  organizationId: string;
  date: Date;
  description: string;
  amount: number;
  isIncome: boolean;
  accountingType: 'Revenue' | 'Expense' | 'Asset' | 'Liability';
  subtype?: string;
  coaCode?: string;
  coaName?: string;
  vendorCustomerName?: string;
  paymentMethod?: string;
  bankAccountId?: string;
  invoiceId?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvalLevel?: 'NONE' | 'MANAGER' | 'ADMIN';
  approvedBy?: string;
  approvalDate?: Date;
  gstRate?: 5 | 12 | 18 | 28;
  gstAmount?: number;
  taxableAmount?: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNo: string;
  partyName: string;
  type: 'Revenue' | 'Expense';
  invoiceAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: Date;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  createdBy: string;
  createdAt: Date;
  matchedTransactionId?: string;
  matchedDate?: Date;
}

export interface Approval {
  id: string;
  transactionId: string;
  organizationId: string;
  approverRole: string;
  approverUserId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';
  amount: number;
  reason?: string;
  approvalDate?: Date;
  createdAt: Date;
}
