import { Transaction, StockMovement, StockAdjustment, Product } from '@/context/app-state';

/**
 * Stock to Financial Statements Integration
 * Handles automatic transaction creation when stock movements occur
 */

export interface FinancialImpact {
  transactions: Transaction[];
  accountsAffected: string[];
  plImpact: {
    revenue?: number;
    expense?: number;
    cogs?: number;
  };
  balanceSheetImpact: {
    assets?: number;
    liabilities?: number;
    equity?: number;
  };
}

// Stock accounting codes mapped to Chart of Accounts
const STOCK_ACCOUNTING_CODES = {
  INVENTORY_ASSET: '1030', // Current Asset
  COGS: '2010', // Cost of Goods Sold
  STOCK_ADJUSTMENT_EXPENSE: '2040', // Stock adjustment/damage expense
  PURCHASE_PAYABLE: '3010', // Trade Payable
  SALES_REVENUE: '1005', // Revenue
  GST_PAYABLE: '3020', // GST Payable
};

/**
 * Generate financial transactions from stock purchase movement
 */
export function generatePurchaseFinancialTransactions(
  movement: StockMovement,
  products: Product[],
  organizationId: string
): FinancialImpact {
  const product = products.find((p) => p.id === movement.productId);
  if (!product) return { transactions: [], accountsAffected: [], plImpact: {}, balanceSheetImpact: {} };

  const gstAmount = (movement.totalValue * product.gstRate) / 100;
  const grossAmount = movement.totalValue + gstAmount;

  const transactions: Transaction[] = [
    // Debit Inventory (Asset increases)
    {
      id: `txn_${Date.now()}_1`,
      organizationId,
      date: movement.movementDate,
      description: `Stock Purchase - ${product.productName} (${movement.referenceNo})`,
      amount: movement.totalValue,
      isIncome: false,
      accountingType: 'Asset',
      subtype: 'Inventory',
      gstSplit: { taxable: movement.totalValue, gst: 0 },
      notes: `SKU: ${product.skuCode}, Qty: ${movement.quantity}`,
      status: 'Recorded',
      allocationStatus: 'Allocated',
      adjustment: 'Full',
    },
    // Debit GST Input (Asset)
    {
      id: `txn_${Date.now()}_2`,
      organizationId,
      date: movement.movementDate,
      description: `GST Input - Stock Purchase (${movement.referenceNo})`,
      amount: gstAmount,
      isIncome: false,
      accountingType: 'Asset',
      subtype: 'GST Input',
      gstSplit: { taxable: 0, gst: gstAmount },
      notes: `GST @ ${product.gstRate}%`,
      status: 'Recorded',
      allocationStatus: 'Allocated',
      adjustment: 'Full',
    },
    // Credit Trade Payable (Liability increases)
    {
      id: `txn_${Date.now()}_3`,
      organizationId,
      date: movement.movementDate,
      description: `Purchase Payable - ${movement.supplier || 'Supplier'} (${movement.referenceNo})`,
      amount: grossAmount,
      isIncome: true,
      accountingType: 'Liability',
      subtype: 'Trade Payable',
      gstSplit: { taxable: movement.totalValue, gst: gstAmount },
      notes: `Due for payment`,
      status: 'Recorded',
      allocationStatus: 'Allocated',
      adjustment: 'Full',
    },
  ];

  return {
    transactions,
    accountsAffected: [STOCK_ACCOUNTING_CODES.INVENTORY_ASSET, STOCK_ACCOUNTING_CODES.PURCHASE_PAYABLE],
    balanceSheetImpact: {
      assets: movement.totalValue + gstAmount,
      liabilities: grossAmount,
    },
  };
}

/**
 * Generate financial transactions from stock sale movement
 */
export function generateSaleFinancialTransactions(
  movement: StockMovement,
  products: Product[],
  organizationId: string
): FinancialImpact {
  const product = products.find((p) => p.id === movement.productId);
  if (!product) return { transactions: [], accountsAffected: [], plImpact: {}, balanceSheetImpact: {} };

  const gstAmount = (movement.totalValue * product.gstRate) / 100;
  const grossAmount = movement.totalValue + gstAmount;

  const transactions: Transaction[] = [
    // Debit Cash/AR (Asset)
    {
      id: `txn_${Date.now()}_1`,
      organizationId,
      date: movement.movementDate,
      description: `Sales Receipt - ${product.productName} (${movement.referenceNo})`,
      amount: grossAmount,
      isIncome: true,
      accountingType: 'Asset',
      subtype: 'Cash / AR',
      gstSplit: { taxable: movement.totalValue, gst: gstAmount },
      notes: `Customer: ${movement.customer || 'Customer'}`,
      status: 'Recorded',
      allocationStatus: 'Allocated',
      adjustment: 'Full',
    },
    // Credit Revenue (Income)
    {
      id: `txn_${Date.now()}_2`,
      organizationId,
      date: movement.movementDate,
      description: `Revenue - ${product.productName} Sale (${movement.referenceNo})`,
      amount: movement.totalValue,
      isIncome: false,
      accountingType: 'Revenue',
      subtype: 'Sales',
      gstSplit: { taxable: movement.totalValue, gst: 0 },
      notes: `Gross amount after GST`,
      status: 'Recorded',
      allocationStatus: 'Allocated',
      adjustment: 'Full',
    },
    // Credit GST Output (Liability)
    {
      id: `txn_${Date.now()}_3`,
      organizationId,
      date: movement.movementDate,
      description: `GST Output - Sales (${movement.referenceNo})`,
      amount: gstAmount,
      isIncome: false,
      accountingType: 'Liability',
      subtype: 'GST Payable',
      gstSplit: { taxable: 0, gst: gstAmount },
      notes: `GST @ ${product.gstRate}%`,
      status: 'Recorded',
      allocationStatus: 'Allocated',
      adjustment: 'Full',
    },
    // Debit COGS (Expense)
    {
      id: `txn_${Date.now()}_4`,
      organizationId,
      date: movement.movementDate,
      description: `COGS - ${product.productName} (${movement.referenceNo})`,
      amount: movement.totalValue,
      isIncome: false,
      accountingType: 'Expense',
      subtype: 'Cost of Goods Sold',
      gstSplit: { taxable: movement.totalValue, gst: 0 },
      notes: `Cost @ ${movement.unitPrice}/unit, Qty: ${movement.quantity}`,
      status: 'Recorded',
      allocationStatus: 'Allocated',
      adjustment: 'Full',
    },
    // Credit Inventory (Asset decreases)
    {
      id: `txn_${Date.now()}_5`,
      organizationId,
      date: movement.movementDate,
      description: `Inventory Reduction - ${product.productName}`,
      amount: movement.totalValue,
      isIncome: true,
      accountingType: 'Asset',
      subtype: 'Inventory',
      gstSplit: { taxable: movement.totalValue, gst: 0 },
      notes: `Qty: ${movement.quantity}`,
      status: 'Recorded',
      allocationStatus: 'Allocated',
      adjustment: 'Full',
    },
  ];

  return {
    transactions,
    accountsAffected: [STOCK_ACCOUNTING_CODES.COGS, STOCK_ACCOUNTING_CODES.SALES_REVENUE],
    plImpact: {
      revenue: movement.totalValue,
      cogs: movement.totalValue,
    },
    balanceSheetImpact: {
      assets: grossAmount - movement.totalValue,
    },
  };
}

/**
 * Generate financial transactions from stock adjustment (damage/loss)
 */
export function generateAdjustmentFinancialTransactions(
  adjustment: StockAdjustment,
  products: Product[],
  organizationId: string
): FinancialImpact {
  const product = products.find((p) => p.id === adjustment.productId);
  if (!product) return { transactions: [], accountsAffected: [], plImpact: {}, balanceSheetImpact: {} };

  const adjustmentAmount = adjustment.adjustmentQuantity * product.unitCost;

  const transactions: Transaction[] = [
    // Debit Stock Adjustment Expense
    {
      id: `txn_${Date.now()}_1`,
      organizationId,
      date: adjustment.adjustmentDate,
      description: `Stock ${adjustment.adjustmentType} - ${product.productName}`,
      amount: adjustmentAmount,
      isIncome: false,
      accountingType: 'Expense',
      subtype: 'Stock Adjustment',
      gstSplit: { taxable: adjustmentAmount, gst: 0 },
      notes: `Reason: ${adjustment.reason}, Qty: ${adjustment.adjustmentQuantity}`,
      status: 'Recorded',
      allocationStatus: 'Allocated',
      adjustment: 'Full',
    },
    // Credit Inventory
    {
      id: `txn_${Date.now()}_2`,
      organizationId,
      date: adjustment.adjustmentDate,
      description: `Inventory Reduction - ${adjustment.adjustmentType}`,
      amount: adjustmentAmount,
      isIncome: true,
      accountingType: 'Asset',
      subtype: 'Inventory',
      gstSplit: { taxable: adjustmentAmount, gst: 0 },
      notes: `Approved by: ${adjustment.approvedBy || 'Pending'}`,
      status: 'Recorded',
      allocationStatus: 'Allocated',
      adjustment: 'Full',
    },
  ];

  return {
    transactions,
    accountsAffected: [STOCK_ACCOUNTING_CODES.STOCK_ADJUSTMENT_EXPENSE, STOCK_ACCOUNTING_CODES.INVENTORY_ASSET],
    plImpact: {
      expense: adjustmentAmount,
    },
    balanceSheetImpact: {
      assets: -adjustmentAmount,
    },
  };
}

/**
 * Calculate total stock value for balance sheet
 */
export function calculateTotalStockValue(
  movements: StockMovement[],
  products: Product[]
): { totalValue: number; productWise: Record<string, number> } {
  const productWise: Record<string, number> = {};
  let totalValue = 0;

  movements.forEach((movement) => {
    const product = products.find((p) => p.id === movement.productId);
    if (!product) return;

    const movementValue = movement.quantity * movement.unitPrice;
    const key = `${product.skuCode}-${product.productName}`;

    if (!productWise[key]) {
      productWise[key] = 0;
    }

    if (movement.movementType === 'Purchase') {
      productWise[key] += movementValue;
      totalValue += movementValue;
    } else if (movement.movementType === 'Sale') {
      productWise[key] -= movementValue;
      totalValue -= movementValue;
    }
  });

  return { totalValue: Math.max(0, totalValue), productWise };
}

/**
 * Reconcile stock with financial statements
 */
export function reconcileStockWithFinancials(
  currentInventoryValue: number,
  previousInventoryValue: number,
  movements: StockMovement[]
): {
  expectedValue: number;
  actualValue: number;
  variance: number;
  cogs: number;
  isReconciled: boolean;
} {
  const purchaseValue = movements
    .filter((m) => m.movementType === 'Purchase' && m.status === 'Processed')
    .reduce((sum, m) => sum + m.totalValue, 0);

  const saleValue = movements
    .filter((m) => m.movementType === 'Sale' && m.status === 'Processed')
    .reduce((sum, m) => sum + m.totalValue, 0);

  const expectedValue = previousInventoryValue + purchaseValue - saleValue;
  const variance = Math.abs(expectedValue - currentInventoryValue);
  const isReconciled = variance < 100; // Allow 100 rupee variance

  return {
    expectedValue,
    actualValue: currentInventoryValue,
    variance,
    cogs: saleValue,
    isReconciled,
  };
}
