import {
  InvoiceMatch,
  Transaction,
  Invoice,
} from '@/types/business-logic.types';

/**
 * Invoice Matching Service
 * Automatically matches payments to invoices with manual override capability
 */

export class InvoiceMatchingService {
  private amountTolerance = 0.01; // 1%
  private dateTolerance = 7; // days
  private partyNameThreshold = 0.8; // 80% fuzzy match

  /**
   * Suggest matches for an invoice
   * Returns ranked list of potential payment transactions
   */
  async suggestMatches(
    invoice: Invoice,
    transactions: Transaction[] = []
  ): Promise<InvoiceMatch[]> {
    console.log('[InvoiceMatchingService] Suggesting matches for invoice:', {
      invoiceId: invoice.id,
      invoiceAmount: invoice.invoiceAmount,
      partyName: invoice.partyName,
    });

    const potentialMatches: InvoiceMatch[] = [];

    // Filter transactions that could match
    const candidateTransactions = transactions.filter((t) => {
      // Must be same organization
      if (t.organizationId !== invoice.organizationId) return false;

      // Must be payment (income for expense invoice, expense for revenue invoice)
      const isPayment =
        invoice.type === 'Expense' ? !t.isIncome : t.isIncome;
      if (!isPayment) return false;

      // Must not already be matched to another invoice
      if (t.invoiceId && t.invoiceId !== invoice.id) return false;

      // Amount must be within tolerance
      const amountDiff = Math.abs(t.amount - invoice.invoiceAmount);
      const amountVariance = amountDiff / invoice.invoiceAmount;
      if (amountVariance > this.amountTolerance) return false;

      return true;
    });

    // Score each candidate
    for (const transaction of candidateTransactions) {
      const amountDiff = Math.abs(
        transaction.amount - invoice.invoiceAmount
      );
      const amountVariance = (amountDiff / invoice.invoiceAmount) * 100;

      // Date difference in days
      const invoiceDateObj = new Date(invoice.dueDate);
      const transactionDateObj = new Date(transaction.date);
      const timeDiff = Math.abs(
        invoiceDateObj.getTime() - transactionDateObj.getTime()
      );
      const dateVariance = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      // Party name fuzzy match
      const partyMatchScore = this.fuzzyMatchStrings(
        invoice.partyName.toLowerCase(),
        transaction.vendorCustomerName?.toLowerCase() || '',
        this.partyNameThreshold
      );

      // Calculate overall confidence
      const amountConfidence = Math.max(0, 100 - amountVariance * 100);
      const dateConfidence = Math.max(0, 100 - dateVariance * 10);
      const partyConfidence = partyMatchScore * 100;

      // Weight: Amount (40%), Party (40%), Date (20%)
      const overallConfidence =
        amountConfidence * 0.4 +
        partyConfidence * 0.4 +
        dateConfidence * 0.2;

      const match: InvoiceMatch = {
        invoiceId: invoice.id,
        transactionId: transaction.id,
        amountVariance,
        dateVariance,
        partyMatchScore: partyMatchScore * 100,
        overallConfidence: Math.round(overallConfidence),
        matchType:
          amountVariance === 0 && dateVariance === 0
            ? 'EXACT'
            : 'SUGGESTED',
      };

      if (overallConfidence > 50) {
        potentialMatches.push(match);
      }
    }

    // Sort by confidence (highest first)
    potentialMatches.sort((a, b) => b.overallConfidence - a.overallConfidence);

    console.log('[InvoiceMatchingService] Found matches:', {
      matchCount: potentialMatches.length,
      topMatch: potentialMatches[0]?.overallConfidence,
    });

    return potentialMatches;
  }

  /**
   * Match an invoice to a transaction
   * Updates balances and creates reference
   */
  async matchInvoiceToTransaction(
    invoiceId: string,
    transactionId: string,
    matchNote?: string
  ): Promise<{ invoice: Partial<Invoice>; transaction: Partial<Transaction> }> {
    console.log('[InvoiceMatchingService] Matching invoice to transaction:', {
      invoiceId,
      transactionId,
      note: matchNote,
    });

    // In real implementation, would update database
    // For now, return mock updated objects

    return {
      invoice: {
        id: invoiceId,
        matchedTransactionId: transactionId,
        matchedDate: new Date(),
        status: 'PAID',
        balanceDue: 0,
      },
      transaction: {
        id: transactionId,
        invoiceId: invoiceId,
      },
    };
  }

  /**
   * Remove match between invoice and transaction
   */
  async unmatchInvoiceFromTransaction(
    invoiceId: string
  ): Promise<{ invoice: Partial<Invoice> }> {
    console.log('[InvoiceMatchingService] Unmatching invoice:', {
      invoiceId,
    });

    return {
      invoice: {
        id: invoiceId,
        matchedTransactionId: undefined,
        matchedDate: undefined,
        status: 'UNPAID',
      },
    };
  }

  /**
   * Handle partial payments for an invoice
   * Multiple transactions can partially pay one invoice
   */
  async calculatePartialPayments(
    invoiceId: string,
    transactions: Transaction[] = []
  ): Promise<{ invoiceId: string; totalPaid: number; balanceDue: number }> {
    const matchedTransactions = transactions.filter(
      (t) => t.invoiceId === invoiceId && t.status === 'APPROVED'
    );

    const totalPaid = matchedTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Would fetch actual invoice amount from DB
    const invoiceAmount = 100000; // Mock value

    const balanceDue = Math.max(0, invoiceAmount - totalPaid);

    console.log('[InvoiceMatchingService] Partial payments calculated:', {
      invoiceId,
      transactionCount: matchedTransactions.length,
      totalPaid,
      balanceDue,
    });

    return {
      invoiceId,
      totalPaid,
      balanceDue,
    };
  }

  /**
   * Identify overpayments (total paid > invoice amount)
   */
  async identifyOverpayments(
    invoiceId: string,
    transactions: Transaction[] = []
  ): Promise<{ overpaid: boolean; overpaymentAmount: number }> {
    const matchedTransactions = transactions.filter(
      (t) => t.invoiceId === invoiceId
    );

    const totalPaid = matchedTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Would fetch actual invoice amount
    const invoiceAmount = 100000;

    const overpaymentAmount = Math.max(0, totalPaid - invoiceAmount);
    const overpaid = overpaymentAmount > 0;

    if (overpaid) {
      console.warn('[InvoiceMatchingService] Overpayment detected:', {
        invoiceId,
        invoiceAmount,
        totalPaid,
        overpaymentAmount,
      });
    }

    return {
      overpaid,
      overpaymentAmount,
    };
  }

  /**
   * Fuzzy string matching algorithm
   * Returns score between 0 and 1
   */
  private fuzzyMatchStrings(
    str1: string,
    str2: string,
    threshold: number
  ): number {
    if (!str1 || !str2) return 0;

    // Exact match
    if (str1 === str2) return 1;

    // One contains the other
    if (str1.includes(str2) || str2.includes(str1)) {
      return Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length);
    }

    // Levenshtein distance approach
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    const similarity = 1 - editDistance / longer.length;

    return similarity;
  }

  /**
   * Levenshtein distance for fuzzy matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get invoices with matching status
   */
  async getInvoiceMatchingStatus(
    invoices: Invoice[] = [],
    transactions: Transaction[] = []
  ): Promise<
    Array<{
      invoice: Invoice;
      matched: boolean;
      matchedTransaction?: Transaction;
      balanceDue: number;
    }>
  > {
    return invoices.map((invoice) => {
      const matchedTransaction = transactions.find(
        (t) => t.invoiceId === invoice.id
      );

      return {
        invoice,
        matched: !!matchedTransaction,
        matchedTransaction,
        balanceDue: invoice.balanceDue,
      };
    });
  }
}

// Export singleton instance
export const invoiceMatchingService = new InvoiceMatchingService();
