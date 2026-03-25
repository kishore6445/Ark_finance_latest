'use client';

import React from "react"

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

// Types for all shared state
export interface AppState {
  // Transaction data
  transactions: Transaction[];
  // Invoice data
  invoices: Invoice[];
  // Obligations data
  obligations: Obligation[];
  // Compliance items
  complianceItems: ComplianceItem[];
  // Notifications
  notifications: Notification[];
  // Approvals
  pendingApprovals: ApprovalRequest[];
  // Bank accounts
  bankAccounts: BankAccount[];
  // Bank account mappings
  bankAccountMappings: BankAccountMapping[];
  // Inter-account transfers
  interAccountTransfers: InterAccountTransfer[];
  // Vendor payments
  vendorPayments: VendorPayment[];
  // Stock entities
  products: Product[];
  stockRecords: StockRecord[];
  stockMovements: StockMovement[];
  stockValuations: StockValuation[];
  stockAdjustments: StockAdjustment[];
  // CFO Dashboard entities
  cfoClients: CFOClient[];
  clientAlerts: ClientAlert[];
  complianceDeadlines: ComplianceDeadline[];
  weeklyReports: WeeklyReport[];
  monthlyCalls: MonthlyCall[];
  clientMetrics: ClientMetric[];
}

export interface Transaction {
  id: string;
  organizationId: string;
  date: string;
  description: string;
  amount: number;
  isIncome: boolean;
  accountingType: 'Revenue' | 'Expense' | 'Asset' | 'Liability';
  subtype: string;
  invoice?: string;
  matchedInvoiceId?: string;
  adjustment: 'Full' | 'Partial';
  gstSplit: { taxable: number; gst: number };
  notes: string;
  status: 'Recorded' | 'Needs Info' | 'Action Required';
  allocationStatus: 'Allocated' | 'Partially Allocated' | 'Unallocated';
  requiresApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
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
  dueDate: string;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
}

export interface Obligation {
  id: string;
  type: string;
  party: string;
  category: string;
  amountDue: number;
  dueDate: string;
  status: 'Planned' | 'Due Soon' | 'Overdue';
  source: 'Auto' | 'Manual';
  sourceRef: string;
  daysOverdue?: number;
}

export interface ComplianceItem {
  id: string;
  period: string;
  name: string;
  type: 'Monthly' | 'Quarterly' | 'Statutory' | 'Audit';
  dueDate: string;
  status: 'Compliant' | 'Pending' | 'At Risk';
  evidence: 'Linked' | 'Missing' | 'Uploaded';
  lastActionDate: string;
  linkedObligation?: string;
  resolutionSteps?: { label: string; completed: boolean }[];
}

export interface Notification {
  id: string;
  type: 'invoice_overdue' | 'compliance_alert' | 'approval_needed' | 'reconciliation_pending' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'expense' | 'invoice' | 'budget_variance';
  description: string;
  amount: number;
  requester: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approver?: string;
  approvalNote?: string;
  requiresApproval: boolean;
  limit: number; // approval limit threshold
  assignedTo?: string; // Who is assigned to approve this
  assignmentHistory: AssignmentRecord[]; // Track assignment history
}

export interface AssignmentRecord {
  assignedBy: string;
  assignedTo: string;
  assignedAt: string;
  reassignedAt?: string;
}

export interface BankAccount {
  id: string;
  organizationId: string;
  accountName: string;
  accountNumber: string;
  accountType: 'Savings' | 'Current' | 'Overdraft' | 'Other';
  bankName: string;
  ifscCode: string;
  balance: number;
  linkedBuckets: string[]; // Array of bucket IDs
  isPrimary: boolean;
  createdDate: string;
  status: 'Active' | 'Inactive';
}

export interface BankAccountMapping {
  id: string;
  bucketId: string;
  bankAccountId: string;
  allocationPercentage: number;
  isAutomatic: boolean;
  createdDate: string;
}

type BankAccountMappingRow = {
  id: string;
  bucket_id?: string | null;
  bank_account_id?: string | null;
  allocation_percentage?: number | null;
  is_automatic?: boolean | null;
  created_at?: string | null;
};

async function getAccessToken() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Missing session token. Please sign in again.');
  }

  return accessToken;
}

function mapBankAccountMappingRow(row: BankAccountMappingRow): BankAccountMapping {
  return {
    id: row.id,
    bucketId: row.bucket_id ?? '',
    bankAccountId: row.bank_account_id ?? '',
    allocationPercentage: Number(row.allocation_percentage ?? 0),
    isAutomatic: Boolean(row.is_automatic),
    createdDate: row.created_at ?? new Date().toISOString(),
  };
}

export interface InterAccountTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  description: string;
  status: 'Pending' | 'Completed' | 'Failed';
  referenceNo: string;
}

export interface VendorPayment {
  id: string;
  vendorName: string;
  vendorId: string;
  description: string;
  paymentType: 'Software' | 'Internet' | 'Maintenance' | 'Subscription' | 'Utilities' | 'Other';
  amount: number;
  dueDate: string;
  paymentDate?: string;
  frequency: 'One-time' | 'Monthly' | 'Quarterly' | 'Yearly';
  status: 'Scheduled' | 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
  isRecurring: boolean;
  recurringEndDate?: string;
  notificationSent: boolean;
  notificationDaysBeforeDue: number;
  category: string;
  invoiceRef?: string;
  notes: string;
  createdDate: string;
}

export interface Product {
  id: string;
  organizationId: string;
  skuCode: string;
  productName: string;
  category: string;
  unit: 'Pcs' | 'Kg' | 'Liter' | 'Box' | 'Unit';
  description: string;
  hsnCode: string;
  gstRate: number;
  unitCost: number;
  reorderLevel: number;
  reorderQuantity: number;
  status: 'Active' | 'Inactive' | 'Discontinued';
}

export interface StockRecord {
  id: string;
  organizationId: string;
  productId: string;
  location: string;
  openingQuantity: number;
  openingValue: number;
  currentQuantity: number;
  currentValue: number;
  damagedQuantity: number;
  lastReceivedDate: string;
  lastIssuedDate: string;
  valuationMethod: 'FIFO' | 'WEIGHTED_AVG' | 'LIFO';
}

export interface StockMovement {
  id: string;
  organizationId: string;
  movementType: 'Purchase' | 'Sale' | 'Adjustment' | 'Transfer' | 'Damage' | 'Return';
  referenceNo: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  movementDate: string;
  supplier?: string;
  customer?: string;
  notes: string;
  status: 'Draft' | 'Processed' | 'Cancelled';
}

export interface StockValuation {
  id: string;
  organizationId: string;
  valuationDate: string;
  valuationMethod: 'FIFO' | 'WEIGHTED_AVG' | 'LIFO';
  totalQuantity: number;
  totalValue: number;
  productWiseBreakdown: { productId: string; quantity: number; value: number }[];
  approvalStatus: 'Draft' | 'Approved' | 'Finalized';
}

export interface StockAdjustment {
  id: string;
  organizationId: string;
  adjustmentType: 'Damaged' | 'Loss' | 'Shrinkage' | 'Correction' | 'Write-off';
  productId: string;
  adjustmentQuantity: number;
  previousQuantity: number;
  adjustedQuantity: number;
  reason: string;
  approvedBy?: string;
  adjustmentDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

// CFO Dashboard Entities
export interface CFOClient {
  id: string;
  cfoId: string; // Tanuja's user ID
  organizationId: string; // The client company's organization
  clientName: string;
  clientCode: string;
  industry: string;
  companySize: 'Startup' | 'SME' | 'Mid-Market' | 'Enterprise';
  engagementTier: 'Standard' | 'Premium' | 'VIP';
  monthlyFee: number;
  lastCallDate?: string;
  nextCallDate?: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  healthStatus: 'Healthy' | 'AtRisk' | 'Critical';
  notes: string;
  onboardedDate: string;
  status: 'Active' | 'Inactive' | 'Paused';
}

export interface ClientAlert {
  id: string;
  cfoClientId: string;
  alertType: 'Financial' | 'Compliance' | 'Operational' | 'Communication';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  suggestedAction?: string;
  createdDate: string;
  dueDate?: string;
  resolvedDate?: string;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Ignored';
  relatedData?: { type: string; value: string }[];
}

export interface ComplianceDeadline {
  id: string;
  cfoClientId: string;
  complianceType: 'GST' | 'IncomeTax' | 'PayrollTax' | 'AuditReport' | 'ROC' | 'BankCompliance' | 'Other';
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'OnDemand';
  dueDate: string;
  description: string;
  submissionMethod: 'Online' | 'Offline' | 'Email' | 'Manual';
  status: 'NotStarted' | 'InProgress' | 'ReadyForSubmission' | 'Submitted' | 'Completed' | 'Overdue';
  documentLink?: string;
  notes: string;
}

export interface WeeklyReport {
  id: string;
  cfoId: string;
  weekEndDate: string;
  createdDate: string;
  daysWorked: number;
  summary: string;
  clientsReviewed: string[]; // CFOClient IDs
  alertsSummary: { total: number; critical: number; resolved: number };
  keyActions: { clientId: string; action: string; status: string }[];
  upcomingDeadlines: { clientId: string; deadline: string; type: string }[];
  reportStatus: 'Draft' | 'Submitted' | 'Approved';
  submittedTo?: string; // Email or user ID of manager
}

export interface MonthlyCall {
  id: string;
  cfoClientId: string;
  scheduledDate: string;
  completedDate?: string;
  duration?: number; // in minutes
  callType: 'BoardCall' | 'FinanceReview' | 'TaxPlanning' | 'Compliance' | 'FollowUp' | 'Other';
  agendaItems: string[];
  discussionNotes: string;
  actionItems: { item: string; owner: string; dueDate: string; status: 'Open' | 'Completed' }[];
  documents: { name: string; url: string }[];
  status: 'Scheduled' | 'Completed' | 'Rescheduled' | 'Cancelled';
  nextCallDate?: string;
}

export interface ClientMetric {
  id: string;
  cfoClientId: string;
  metricDate: string;
  revenue: number;
  expenses: number;
  profitMargin: number;
  cashBalance: number;
  runway: number; // in months
  payablesAmount: number;
  receivablesAmount: number;
  gstCompliance: number; // percentage
  payrollComplianceStatus: 'Compliant' | 'Pending' | 'NonCompliant';
  taxFilingStatus: 'OnTrack' | 'AtRisk' | 'Overdue';
  outstandingAlerts: number;
}

interface AppContextType {
  state: AppState;
  // Transaction actions
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  addTransaction: (transaction: Transaction) => void;
  // Invoice actions
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  matchTransactionToInvoice: (txnId: string, invoiceId: string, amount: number) => void;
  // Obligation actions
  updateObligation: (id: string, updates: Partial<Obligation>) => void;
  // Compliance actions
  updateComplianceItem: (id: string, updates: Partial<ComplianceItem>) => void;
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
  // Approval actions
  addApprovalRequest: (request: Omit<ApprovalRequest, 'id'>) => void;
  approveRequest: (id: string, approver: string, note?: string) => void;
  rejectRequest: (id: string, approver: string, note?: string) => void;
  assignApprovalRequest: (id: string, assignedBy: string, assignedTo: string) => void;
  reassignApprovalRequest: (id: string, reassignedBy: string, newAssignee: string) => void;
  // Bank account actions
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdDate'>) => void;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  // Bank account mapping actions
  linkBucketToAccount: (mapping: Omit<BankAccountMapping, 'id' | 'createdDate'>) => void;
  updateBankAccountMapping: (id: string, updates: Partial<BankAccountMapping>) => void;
  deleteBankAccountMapping: (id: string) => void;
  // Inter-account transfer actions
  createInterAccountTransfer: (transfer: Omit<InterAccountTransfer, 'id'>) => void;
  updateInterAccountTransfer: (id: string, updates: Partial<InterAccountTransfer>) => void;
  // Vendor payment actions
  addVendorPayment: (payment: Omit<VendorPayment, 'id' | 'createdDate'>) => void;
  updateVendorPayment: (id: string, updates: Partial<VendorPayment>) => void;
  deleteVendorPayment: (id: string) => void;
  getUpcomingVendorPayments: (daysAhead: number) => VendorPayment[];
  markVendorPaymentAsPaid: (id: string, paymentDate: string) => void;
  // Stock actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  recordStockMovement: (movement: Omit<StockMovement, 'id'>) => void;
  updateStockMovement: (id: string, updates: Partial<StockMovement>) => void;
  createStockAdjustment: (adjustment: Omit<StockAdjustment, 'id'>) => void;
  approveStockAdjustment: (id: string, approvedBy: string) => void;
  rejectStockAdjustment: (id: string) => void;
  finalizeStockValuation: (valuation: Omit<StockValuation, 'id'>) => void;
  // Metadata
  getMetrics: () => {
    totalCash: number;
    totalRevenue: number;
    totalExpense: number;
    arBalance: number;
    apBalance: number;
    overdueDays: number;
  };
  getAccountBalance: (accountId: string) => number;
  getBucketAllocation: (bucketId: string) => { accountId: string; percentage: number }[];
}

const AppContext = createContext<AppContextType | null>(null);

const EMPTY_APP_STATE: AppState = {
  transactions: [],
  invoices: [],
  obligations: [],
  complianceItems: [],
  notifications: [],
  pendingApprovals: [],
  bankAccounts: [],
  bankAccountMappings: [],
  interAccountTransfers: [],
  vendorPayments: [],
  products: [],
  stockRecords: [],
  stockMovements: [],
  stockValuations: [],
  stockAdjustments: [],
  cfoClients: [],
  clientAlerts: [],
  complianceDeadlines: [],
  weeklyReports: [],
  monthlyCalls: [],
  clientMetrics: [],
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_APP_STATE);

  const fetchBankAccountMappings = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/bank-account-mappings', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to load bank account mappings.');
      }

      setState((prev) => ({
        ...prev,
        bankAccountMappings: ((result.mappings ?? []) as BankAccountMappingRow[]).map(mapBankAccountMappingRow),
      }));
    } catch {
      // Leave state as-is if mappings cannot be loaded.
    }
  }, []);

  useEffect(() => {
    void fetchBankAccountMappings();

    const handleMappingsUpdated = () => {
      void fetchBankAccountMappings();
    };

    window.addEventListener('finance:bank-account-mappings-updated', handleMappingsUpdated);
    return () => {
      window.removeEventListener('finance:bank-account-mappings-updated', handleMappingsUpdated);
    };
  }, [fetchBankAccountMappings]);

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }));
    },
    []
  );

  const addTransaction = useCallback((transaction: Transaction) => {
    setState((prev) => ({
      ...prev,
      transactions: [...prev.transactions, transaction],
    }));
  }, []);

  const updateInvoice = useCallback(
    (id: string, updates: Partial<Invoice>) => {
      setState((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) =>
          inv.id === id ? { ...inv, ...updates } : inv
        ),
      }));
    },
    []
  );

  const matchTransactionToInvoice = useCallback(
    (txnId: string, invoiceId: string, amount: number) => {
      setState((prev) => {
        // Update transaction with matched invoice
        const updatedTransactions = prev.transactions.map((t) =>
          t.id === txnId ? { ...t, matchedInvoiceId: invoiceId } : t
        );

        // Update invoice paid amount
        const invoice = prev.invoices.find((inv) => inv.id === invoiceId);
        if (!invoice) return prev;

        const newPaidAmount = invoice.paidAmount + amount;
        const newBalanceDue = Math.max(0, invoice.invoiceAmount - newPaidAmount);
        let newStatus: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue' = 'Unpaid';
        if (newBalanceDue === 0) newStatus = 'Paid';
        else if (newPaidAmount > 0) newStatus = 'Partial';

        const updatedInvoices = prev.invoices.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                paidAmount: newPaidAmount,
                balanceDue: newBalanceDue,
                status: newStatus,
              }
            : inv
        );

        // Auto-update obligation if this invoice has linked obligation
        let updatedObligations = prev.obligations;
        if (invoice.status === 'Unpaid' && newStatus === 'Paid') {
          const linkedObligation = prev.obligations.find(
            (o) => o.sourceRef === invoice.invoiceNo
          );
          if (linkedObligation) {
            updatedObligations = prev.obligations.map((o) =>
              o.id === linkedObligation.id
                ? { ...o, status: 'Planned', amountDue: 0 }
                : o
            );

            // Auto-close linked compliance tasks
            let updatedCompliance = prev.complianceItems;
            if (linkedObligation.type === 'Vendor Invoice') {
              updatedCompliance = prev.complianceItems.map((c) =>
                c.linkedObligation === linkedObligation.id
                  ? { ...c, status: 'Compliant' }
                  : c
              );
            }
            return {
              ...prev,
              transactions: updatedTransactions,
              invoices: updatedInvoices,
              obligations: updatedObligations,
              complianceItems: updatedCompliance,
            };
          }
        }

        return {
          ...prev,
          transactions: updatedTransactions,
          invoices: updatedInvoices,
          obligations: updatedObligations,
        };
      });
    },
    []
  );

  const updateObligation = useCallback(
    (id: string, updates: Partial<Obligation>) => {
      setState((prev) => ({
        ...prev,
        obligations: prev.obligations.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      }));
    },
    []
  );

  const updateComplianceItem = useCallback(
    (id: string, updates: Partial<ComplianceItem>) => {
      setState((prev) => ({
        ...prev,
        complianceItems: prev.complianceItems.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }));
    },
    []
  );

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = `notif-${Date.now()}`;
      setState((prev) => ({
        ...prev,
        notifications: [{ ...notification, id }, ...prev.notifications],
      }));
    },
    []
  );

  const markNotificationAsRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  }, []);

  const addApprovalRequest = useCallback(
    (request: Omit<ApprovalRequest, 'id'>) => {
      const id = `approval-${Date.now()}`;
      setState((prev) => ({
        ...prev,
        pendingApprovals: [...prev.pendingApprovals, { ...request, id, assignmentHistory: [] }],
      }));

      // Auto-create notification
      addNotification({
        type: 'approval_needed',
        title: 'Approval Required',
        message: `${request.type === 'expense' ? 'Expense' : 'Invoice'} of ₹${request.amount} requires approval`,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: '/approvals',
      });
    },
    [addNotification]
  );

  const approveRequest = useCallback(
    (id: string, approver: string, note?: string) => {
      setState((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals.map((r) =>
          r.id === id
            ? { ...r, status: 'approved', approver, approvalNote: note }
            : r
        ),
      }));
    },
    []
  );

  const rejectRequest = useCallback(
    (id: string, approver: string, note?: string) => {
      setState((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals.map((r) =>
          r.id === id
            ? { ...r, status: 'rejected', approver, approvalNote: note }
            : r
        ),
      }));
    },
    []
  );

  const assignApprovalRequest = useCallback(
    (id: string, assignedBy: string, assignedTo: string) => {
      setState((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals.map((r) =>
          r.id === id
            ? {
                ...r,
                assignedTo,
                assignmentHistory: [
                  ...r.assignmentHistory,
                  {
                    assignedBy,
                    assignedTo,
                    assignedAt: new Date().toISOString(),
                  },
                ],
              }
            : r
        ),
      }));
    },
    []
  );

  const reassignApprovalRequest = useCallback(
    (id: string, reassignedBy: string, newAssignee: string) => {
      setState((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals.map((r) =>
          r.id === id
            ? {
                ...r,
                assignedTo: newAssignee,
                assignmentHistory: r.assignmentHistory.map((a) =>
                  a.assignedTo === r.assignedTo && !a.reassignedAt
                    ? { ...a, reassignedAt: new Date().toISOString() }
                    : a
                ).concat({
                  assignedBy: reassignedBy,
                  assignedTo: newAssignee,
                  assignedAt: new Date().toISOString(),
                }),
              }
            : r
        ),
      }));
    },
    []
  );

  // Bank account methods
  const addBankAccount = useCallback(
    (account: Omit<BankAccount, 'id' | 'createdDate'>) => {
      const id = `bank-${Date.now()}`;
      setState((prev) => ({
        ...prev,
        bankAccounts: [...prev.bankAccounts, { ...account, id, createdDate: new Date().toISOString() }],
      }));
    },
    []
  );

  const updateBankAccount = useCallback((id: string, updates: Partial<BankAccount>) => {
    setState((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc)),
    }));
  }, []);

  const deleteBankAccount = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.filter((acc) => acc.id !== id),
      // Also remove mappings for this account
      bankAccountMappings: prev.bankAccountMappings.filter((m) => m.bankAccountId !== id),
    }));
  }, []);

  // Bank account mapping methods
  const linkBucketToAccount = useCallback(
    (mapping: Omit<BankAccountMapping, 'id' | 'createdDate'>) => {
      void (async () => {
        try {
          const accessToken = await getAccessToken();
          const response = await fetch('/api/bank-account-mappings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              bucketId: mapping.bucketId,
              bankAccountId: mapping.bankAccountId,
              allocationPercentage: mapping.allocationPercentage,
              isAutomatic: mapping.isAutomatic,
            }),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result?.error ?? 'Failed to create mapping.');
          }

          setState((prev) => ({
            ...prev,
            bankAccountMappings: [
              mapBankAccountMappingRow(result.mapping as BankAccountMappingRow),
              ...prev.bankAccountMappings,
            ],
          }));
          window.dispatchEvent(new Event('finance:bank-account-mappings-updated'));
        } catch (error) {
          console.error('[AppState] linkBucketToAccount failed:', error);
        }
      })();
    },
    []
  );

  const updateBankAccountMapping = useCallback(
    (id: string, updates: Partial<BankAccountMapping>) => {
      void (async () => {
        try {
          const accessToken = await getAccessToken();
          const response = await fetch('/api/bank-account-mappings', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              id,
              ...(updates.bucketId ? { bucketId: updates.bucketId } : {}),
              ...(updates.bankAccountId ? { bankAccountId: updates.bankAccountId } : {}),
              ...(typeof updates.allocationPercentage === 'number' ? { allocationPercentage: updates.allocationPercentage } : {}),
              ...(typeof updates.isAutomatic === 'boolean' ? { isAutomatic: updates.isAutomatic } : {}),
            }),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result?.error ?? 'Failed to update mapping.');
          }

          const updatedMapping = mapBankAccountMappingRow(result.mapping as BankAccountMappingRow);
          setState((prev) => ({
            ...prev,
            bankAccountMappings: prev.bankAccountMappings.map((mapping) =>
              mapping.id === id ? updatedMapping : mapping
            ),
          }));
          window.dispatchEvent(new Event('finance:bank-account-mappings-updated'));
        } catch (error) {
          console.error('[AppState] updateBankAccountMapping failed:', error);
        }
      })();
    },
    []
  );

  const deleteBankAccountMapping = useCallback((id: string) => {
    void (async () => {
      try {
        const accessToken = await getAccessToken();
        const response = await fetch(`/api/bank-account-mappings?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error ?? 'Failed to delete mapping.');
        }

        setState((prev) => ({
          ...prev,
          bankAccountMappings: prev.bankAccountMappings.filter((m) => m.id !== id),
        }));
        window.dispatchEvent(new Event('finance:bank-account-mappings-updated'));
      } catch (error) {
        console.error('[AppState] deleteBankAccountMapping failed:', error);
      }
    })();
  }, []);

  // Inter-account transfer methods
  const createInterAccountTransfer = useCallback(
    (transfer: Omit<InterAccountTransfer, 'id'>) => {
      const id = `transfer-${Date.now()}`;
      setState((prev) => ({
        ...prev,
        interAccountTransfers: [...prev.interAccountTransfers, { ...transfer, id }],
      }));
    },
    []
  );

  const updateInterAccountTransfer = useCallback(
    (id: string, updates: Partial<InterAccountTransfer>) => {
      setState((prev) => ({
        ...prev,
        interAccountTransfers: prev.interAccountTransfers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    []
  );

  // Helper methods
  const getAccountBalance = useCallback((accountId: string): number => {
    const account = state.bankAccounts.find((a) => a.id === accountId);
    return account?.balance || 0;
  }, [state.bankAccounts]);

  const getBucketAllocation = useCallback(
    (bucketId: string): { accountId: string; percentage: number }[] => {
      return state.bankAccountMappings
        .filter((m) => m.bucketId === bucketId)
        .map((m) => ({ accountId: m.bankAccountId, percentage: m.allocationPercentage }));
    },
    [state.bankAccountMappings]
  );

  // Vendor payment methods
  const addVendorPayment = useCallback(
    (payment: Omit<VendorPayment, 'id' | 'createdDate'>) => {
      const id = `vendor-payment-${Date.now()}`;
      const newPayment: VendorPayment = {
        ...payment,
        id,
        createdDate: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        vendorPayments: [...prev.vendorPayments, newPayment],
      }));
      // Add notification if within notification window
      if (payment.notificationDaysBeforeDue > 0) {
        const dueDate = new Date(payment.dueDate);
        const notifyDate = new Date(dueDate.getTime() - payment.notificationDaysBeforeDue * 24 * 60 * 60 * 1000);
        const today = new Date();
        if (today >= notifyDate && today <= dueDate) {
          addNotification({
            type: 'general',
            title: `Vendor Payment Due: ${payment.vendorName}`,
            message: `${payment.description} payment of ₹${payment.amount} is due on ${payment.dueDate}`,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    },
    []
  );

  const updateVendorPayment = useCallback((id: string, updates: Partial<VendorPayment>) => {
    setState((prev) => ({
      ...prev,
      vendorPayments: prev.vendorPayments.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  const deleteVendorPayment = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      vendorPayments: prev.vendorPayments.filter((p) => p.id !== id),
    }));
  }, []);

  const getUpcomingVendorPayments = useCallback((daysAhead: number) => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return state.vendorPayments.filter((p) => {
      const dueDate = new Date(p.dueDate);
      return dueDate >= today && dueDate <= futureDate && p.status !== 'Paid' && p.status !== 'Cancelled';
    });
  }, [state.vendorPayments]);

  const markVendorPaymentAsPaid = useCallback((id: string, paymentDate: string) => {
    setState((prev) => ({
      ...prev,
      vendorPayments: prev.vendorPayments.map((p) =>
        p.id === id ? { ...p, status: 'Paid', paymentDate } : p
      ),
    }));
  }, []);

  const getMetrics = useCallback(() => {
    // Calculate key metrics from state
    const revenueTransactions = state.transactions.filter(
      (t) => t.isIncome && t.status === 'Recorded'
    );
    const expenseTransactions = state.transactions.filter(
      (t) => !t.isIncome && t.status === 'Recorded'
    );

    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalCash = totalRevenue - totalExpense;

    const arBalance = state.invoices
      .filter((inv) => inv.type === 'Revenue')
      .reduce((sum, inv) => sum + inv.balanceDue, 0);

    const apBalance = state.invoices
      .filter((inv) => inv.type === 'Expense')
      .reduce((sum, inv) => sum + inv.balanceDue, 0);

    // Calculate days overdue
    const now = new Date();
    let overdueDays = 0;
    state.obligations.forEach((o) => {
      if (o.status === 'Overdue') {
        const dueDate = new Date(o.dueDate);
        const days = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        overdueDays += days;
      }
    });

    return {
      totalCash,
      totalRevenue,
      totalExpense,
      arBalance,
      apBalance,
      overdueDays,
    };
  }, [state]);

  // Stock Management Actions
  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    setState((prev) => ({
      ...prev,
      products: [...prev.products, { ...product, id: `prod_${Date.now()}` } as Product],
    }));
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  }, []);

  const recordStockMovement = useCallback((movement: Omit<StockMovement, 'id'>) => {
    setState((prev) => ({
      ...prev,
      stockMovements: [...prev.stockMovements, { ...movement, id: `mov_${Date.now()}` } as StockMovement],
    }));
  }, []);

  const updateStockMovement = useCallback((id: string, updates: Partial<StockMovement>) => {
    setState((prev) => ({
      ...prev,
      stockMovements: prev.stockMovements.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  }, []);

  const createStockAdjustment = useCallback((adjustment: Omit<StockAdjustment, 'id'>) => {
    setState((prev) => ({
      ...prev,
      stockAdjustments: [...prev.stockAdjustments, { ...adjustment, id: `adj_${Date.now()}` } as StockAdjustment],
    }));
  }, []);

  const approveStockAdjustment = useCallback((id: string, approvedBy: string) => {
    setState((prev) => ({
      ...prev,
      stockAdjustments: prev.stockAdjustments.map((a) =>
        a.id === id ? { ...a, status: 'Approved', approvedBy } : a
      ),
    }));
  }, []);

  const rejectStockAdjustment = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      stockAdjustments: prev.stockAdjustments.map((a) =>
        a.id === id ? { ...a, status: 'Rejected' } : a
      ),
    }));
  }, []);

  const finalizeStockValuation = useCallback((valuation: Omit<StockValuation, 'id'>) => {
    setState((prev) => ({
      ...prev,
      stockValuations: [...prev.stockValuations, { ...valuation, id: `val_${Date.now()}` } as StockValuation],
    }));
  }, []);

  const value: AppContextType = {
    state,
    updateTransaction,
    addTransaction,
    updateInvoice,
    matchTransactionToInvoice,
    updateObligation,
    updateComplianceItem,
    addNotification,
    markNotificationAsRead,
    clearNotification,
    addApprovalRequest,
    approveRequest,
    rejectRequest,
    assignApprovalRequest,
    reassignApprovalRequest,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    linkBucketToAccount,
    updateBankAccountMapping,
    deleteBankAccountMapping,
    createInterAccountTransfer,
    updateInterAccountTransfer,
    addVendorPayment,
    updateVendorPayment,
    deleteVendorPayment,
    getUpcomingVendorPayments,
    markVendorPaymentAsPaid,
    addProduct,
    updateProduct,
    deleteProduct,
    recordStockMovement,
    updateStockMovement,
    createStockAdjustment,
    approveStockAdjustment,
    rejectStockAdjustment,
    finalizeStockValuation,
    getMetrics,
    getAccountBalance,
    getBucketAllocation,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}
