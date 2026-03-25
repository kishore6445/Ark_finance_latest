import { StockMovement, Transaction, Invoice } from '@/context/app-state';

/**
 * Stock to Bank Reconciliation Integration
 * Links stock purchases to bank transfers and reconciles payments
 */

export interface BankStockMatch {
  stockMovementId: string;
  bankTransactionId: string;
  supplier: string;
  purchaseAmount: number;
  bankAmount: number;
  matchStatus: 'matched' | 'partial' | 'unmatched' | 'overpaid' | 'underpaid';
  variance: number;
  matchDate: string;
  transferMode: 'NEFT' | 'IMPS' | 'RTGS' | 'Cheque' | 'Cash';
  utr: string; // Unique Transaction Reference
  notes: string;
}

export interface PurchasePaymentTracker {
  stockMovementId: string;
  purchaseDate: string;
  supplier: string;
  purchaseAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  amountPaid: number;
  amountDue: number;
  paymentDueDate: string;
  paymentMadeDate?: string;
  bankMatches: BankStockMatch[];
}

export interface StockBankAnomaly {
  type: 'duplicate_payment' | 'overpayment' | 'underpayment' | 'missing_payment' | 'stale_payment' | 'delayed_transfer';
  severity: 'low' | 'medium' | 'high' | 'critical';
  stockMovementId: string;
  description: string;
  amount: number;
  detectedDate: string;
  actionRequired: string;
}

/**
 * Match stock purchase transactions with bank transfers
 */
export function matchStockPurchaseWithBankTransfer(
  stockMovement: StockMovement,
  bankTransactions: Transaction[],
  dateToleranceDays: number = 3,
  amountVariancePercent: number = 2
): BankStockMatch[] {
  if (stockMovement.movementType !== 'Purchase') {
    return [];
  }

  const matches: BankStockMatch[] = [];
  const stockDate = new Date(stockMovement.movementDate);
  const tolerance = dateToleranceDays * 24 * 60 * 60 * 1000;

  bankTransactions.forEach((bankTxn) => {
    const bankDate = new Date(bankTxn.date);
    const dateDifference = Math.abs(bankDate.getTime() - stockDate.getTime());

    // Check if within date tolerance
    if (dateDifference > tolerance) return;

    // Check amount variance
    const varianceAmount = Math.abs(bankTxn.amount - stockMovement.totalValue);
    const variancePercent = (varianceAmount / stockMovement.totalValue) * 100;

    let matchStatus: BankStockMatch['matchStatus'] = 'unmatched';

    if (varianceAmount === 0) {
      matchStatus = 'matched';
    } else if (variancePercent <= amountVariancePercent) {
      matchStatus = 'partial';
    } else if (bankTxn.amount > stockMovement.totalValue) {
      matchStatus = 'overpaid';
    } else if (bankTxn.amount < stockMovement.totalValue) {
      matchStatus = 'underpaid';
    }

    matches.push({
      stockMovementId: stockMovement.id,
      bankTransactionId: bankTxn.id,
      supplier: stockMovement.supplier || 'Unknown Supplier',
      purchaseAmount: stockMovement.totalValue,
      bankAmount: bankTxn.amount,
      matchStatus,
      variance: varianceAmount,
      matchDate: new Date().toISOString().split('T')[0],
      transferMode: 'NEFT', // Default, would be extracted from bank data
      utr: `UTR_${bankTxn.id.substring(0, 8)}`,
      notes: `Auto-matched based on amount and date proximity`,
    });
  });

  return matches;
}

/**
 * Track payment status for all stock purchases
 */
export function trackPurchasePaymentStatus(
  stockMovements: StockMovement[],
  bankMatches: BankStockMatch[]
): PurchasePaymentTracker[] {
  return stockMovements
    .filter((movement) => movement.movementType === 'Purchase' && movement.status === 'Processed')
    .map((movement) => {
      const relatedMatches = bankMatches.filter((m) => m.stockMovementId === movement.id);
      
      const totalPaid = relatedMatches
        .filter((m) => ['matched', 'partial', 'overpaid'].includes(m.matchStatus))
        .reduce((sum, m) => sum + m.bankAmount, 0);

      const amountDue = Math.max(0, movement.totalValue - totalPaid);
      const paymentStatus =
        amountDue === 0 ? 'paid' : amountDue === movement.totalValue ? 'pending' : 'partial';

      // Calculate due date (30 days from purchase by default)
      const dueDate = new Date(movement.movementDate);
      dueDate.setDate(dueDate.getDate() + 30);

      return {
        stockMovementId: movement.id,
        purchaseDate: movement.movementDate,
        supplier: movement.supplier || 'Unknown',
        purchaseAmount: movement.totalValue,
        paymentStatus,
        amountPaid: totalPaid,
        amountDue,
        paymentDueDate: dueDate.toISOString().split('T')[0],
        paymentMadeDate: relatedMatches.length > 0 ? relatedMatches[0].matchDate : undefined,
        bankMatches: relatedMatches,
      };
    });
}

/**
 * Detect anomalies in stock purchase payments
 */
export function detectStockPaymentAnomalies(
  purchaseTrackers: PurchasePaymentTracker[]
): StockBankAnomaly[] {
  const anomalies: StockBankAnomaly[] = [];
  const today = new Date();

  purchaseTrackers.forEach((tracker) => {
    // Check for duplicate payments
    const duplicatePayments = tracker.bankMatches.filter((m) => m.matchStatus === 'matched');
    if (duplicatePayments.length > 1) {
      anomalies.push({
        type: 'duplicate_payment',
        severity: 'high',
        stockMovementId: tracker.stockMovementId,
        description: `Multiple payments detected for single purchase from ${tracker.supplier}`,
        amount: tracker.amountPaid - tracker.purchaseAmount,
        detectedDate: new Date().toISOString().split('T')[0],
        actionRequired: 'Review and process credit note if applicable',
      });
    }

    // Check for overpayments
    if (tracker.amountPaid > tracker.purchaseAmount * 1.05) {
      anomalies.push({
        type: 'overpayment',
        severity: 'medium',
        stockMovementId: tracker.stockMovementId,
        description: `Overpayment to ${tracker.supplier}: Paid ${tracker.amountPaid} vs Purchase ${tracker.purchaseAmount}`,
        amount: tracker.amountPaid - tracker.purchaseAmount,
        detectedDate: new Date().toISOString().split('T')[0],
        actionRequired: 'Claim credit note or adjustment',
      });
    }

    // Check for underpayments
    if (tracker.paymentStatus === 'partial' && tracker.amountDue > 0) {
      const underpaidDays = Math.floor(
        (today.getTime() - new Date(tracker.paymentDueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (underpaidDays > 0) {
        anomalies.push({
          type: 'underpayment',
          severity: 'medium',
          stockMovementId: tracker.stockMovementId,
          description: `Underpayment to ${tracker.supplier}: Outstanding amount ${tracker.amountDue}`,
          amount: tracker.amountDue,
          detectedDate: new Date().toISOString().split('T')[0],
          actionRequired: 'Process outstanding payment immediately',
        });
      }
    }

    // Check for overdue payments
    if (tracker.paymentStatus === 'pending') {
      const overdueDays = Math.floor(
        (today.getTime() - new Date(tracker.paymentDueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (overdueDays > 0) {
        anomalies.push({
          type: 'stale_payment',
          severity: 'critical',
          stockMovementId: tracker.stockMovementId,
          description: `Payment overdue to ${tracker.supplier} by ${overdueDays} days`,
          amount: tracker.purchaseAmount,
          detectedDate: new Date().toISOString().split('T')[0],
          actionRequired: 'Urgent: Process payment to avoid supplier relationship issues',
        });
      }
    }

    // Check for delayed transfers (payment made but bank transfer delayed)
    if (tracker.paymentMadeDate) {
      const delayDays = Math.floor(
        (today.getTime() - new Date(tracker.paymentMadeDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (delayDays > 7) {
        anomalies.push({
          type: 'delayed_transfer',
          severity: 'low',
          stockMovementId: tracker.stockMovementId,
          description: `Bank transfer delayed by ${delayDays} days for ${tracker.supplier}`,
          amount: tracker.amountPaid,
          detectedDate: new Date().toISOString().split('T')[0],
          actionRequired: 'Verify transfer status with bank',
        });
      }
    }
  });

  return anomalies;
}

/**
 * Generate reconciliation report for stock purchases vs bank payments
 */
export function generateStockBankReconciliationReport(
  purchaseTrackers: PurchasePaymentTracker[]
): {
  totalPurchases: number;
  totalPaid: number;
  totalOutstanding: number;
  paidPercentage: number;
  anomalies: number;
  summary: {
    fullyPaid: number;
    partiallyPaid: number;
    pending: number;
    overdue: number;
  };
} {
  const summary = {
    fullyPaid: 0,
    partiallyPaid: 0,
    pending: 0,
    overdue: 0,
  };

  const today = new Date();

  purchaseTrackers.forEach((tracker) => {
    if (tracker.paymentStatus === 'paid') {
      summary.fullyPaid++;
    } else if (tracker.paymentStatus === 'partial') {
      summary.partiallyPaid++;
    } else if (tracker.paymentStatus === 'pending') {
      const overdueDays = Math.floor(
        (today.getTime() - new Date(tracker.paymentDueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (overdueDays > 0) {
        summary.overdue++;
      } else {
        summary.pending++;
      }
    }
  });

  const totalPurchases = purchaseTrackers.reduce((sum, t) => sum + t.purchaseAmount, 0);
  const totalPaid = purchaseTrackers.reduce((sum, t) => sum + t.amountPaid, 0);
  const totalOutstanding = purchaseTrackers.reduce((sum, t) => sum + t.amountDue, 0);
  const paidPercentage = totalPurchases > 0 ? (totalPaid / totalPurchases) * 100 : 0;

  return {
    totalPurchases,
    totalPaid,
    totalOutstanding,
    paidPercentage: Math.round(paidPercentage * 100) / 100,
    anomalies: purchaseTrackers.filter((t) => t.amountDue > 0).length,
    summary,
  };
}

/**
 * Validate stock purchase against invoice data
 */
export function validateStockPurchaseAgainstInvoice(
  movement: StockMovement,
  invoice: Invoice
): {
  isValid: boolean;
  discrepancies: string[];
  variance: number;
} {
  const discrepancies: string[] = [];
  let variance = 0;

  // Check amount match
  if (Math.abs(movement.totalValue - invoice.invoiceAmount) > 100) {
    discrepancies.push(
      `Amount mismatch: Stock ${movement.totalValue} vs Invoice ${invoice.invoiceAmount}`
    );
    variance = movement.totalValue - invoice.invoiceAmount;
  }

  // Check party match
  if (movement.supplier && movement.supplier !== invoice.partyName) {
    discrepancies.push(`Supplier mismatch: ${movement.supplier} vs ${invoice.partyName}`);
  }

  // Check invoice status
  if (invoice.status === 'Cancelled') {
    discrepancies.push(`Invoice is cancelled`);
  }

  return {
    isValid: discrepancies.length === 0,
    discrepancies,
    variance,
  };
}
