import {
  BankReconciliationItem,
  BankReconciliationReport,
  Transaction,
} from '@/types/business-logic.types';

/**
 * Bank Reconciliation Engine
 * Reconciles bank statements with system transactions
 */

export interface BankStatementTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  reference?: string;
}

export interface ReconciliationMatch {
  bankTransaction: BankStatementTransaction;
  systemTransaction?: Transaction;
  confidence: number; // 0-100
  status: 'MATCHED' | 'UNMATCHED' | 'DISCREPANCY';
  variance?: number;
}

export class BankReconciliationService {
  private amountTolerance = 0; // Exact match required
  private dateTolerance = 3; // days

  /**
   * Parse bank statement CSV data
   * Assumes format: Date, Description, Amount, Type
   */
  async parseStatement(csvData: string): Promise<BankStatementTransaction[]> {
    console.log('[BankReconciliationService] Parsing bank statement');

    const lines = csvData.split('\n').slice(1); // Skip header
    const transactions: BankStatementTransaction[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split(',');
      if (parts.length < 4) continue;

      try {
        const transaction: BankStatementTransaction = {
          date: new Date(parts[0].trim()),
          description: parts[1].trim(),
          amount: parseFloat(parts[2].trim()),
          type: parts[3].trim().toUpperCase() as 'DEBIT' | 'CREDIT',
        };

        transactions.push(transaction);
      } catch (e) {
        console.error('[BankReconciliationService] Error parsing line:', line);
      }
    }

    console.log('[BankReconciliationService] Parsed transactions:', {
      count: transactions.length,
    });

    return transactions;
  }

  /**
   * Calculate system balance based on transactions
   * Opening + Deposits - Withdrawals = System Balance
   */
  async calculateSystemBalance(
    bankAccountId: string,
    statementDate: Date,
    transactions: Transaction[] = [],
    openingBalance: number = 0
  ): Promise<number> {
    // Get all transactions up to statement date
    const relevantTransactions = transactions.filter(
      (t) =>
        t.bankAccountId === bankAccountId &&
        new Date(t.date) <= statementDate &&
        t.status === 'APPROVED'
    );

    console.log('[BankReconciliationService] Calculating system balance', {
      bankAccountId,
      statementDate: statementDate.toISOString(),
      transactionCount: relevantTransactions.length,
    });

    let balance = openingBalance;

    for (const transaction of relevantTransactions) {
      if (transaction.isIncome) {
        balance += transaction.amount; // Deposit
      } else {
        balance -= transaction.amount; // Withdrawal
      }
    }

    console.log('[BankReconciliationService] System balance calculated:', {
      openingBalance,
      balance,
    });

    return balance;
  }

  /**
   * Match bank statement transactions to system transactions
   */
  async matchStatementTransactions(
    bankTransactions: BankStatementTransaction[],
    systemTransactions: Transaction[] = []
  ): Promise<ReconciliationMatch[]> {
    console.log('[BankReconciliationService] Matching transactions', {
      bankCount: bankTransactions.length,
      systemCount: systemTransactions.length,
    });

    const matches: ReconciliationMatch[] = [];
    const matchedSystemIds = new Set<string>();

    // For each bank transaction, find matching system transaction
    for (const bankTxn of bankTransactions) {
      let bestMatch: ReconciliationMatch | null = null;
      let bestConfidence = 0;

      for (const sysTxn of systemTransactions) {
        // Skip already matched transactions
        if (matchedSystemIds.has(sysTxn.id)) continue;

        // Amount must match
        let amountScore = 0;
        if (Math.abs(bankTxn.amount - sysTxn.amount) <= this.amountTolerance) {
          amountScore = 100;
        } else if (Math.abs(bankTxn.amount - sysTxn.amount) < sysTxn.amount * 0.001) {
          amountScore = 90; // Close enough (within 0.1%)
        }

        if (amountScore < 50) continue; // Amount too different

        // Date must be close
        const dateDiff = Math.abs(
          new Date(bankTxn.date).getTime() - new Date(sysTxn.date).getTime()
        );
        const daysDiff = Math.floor(dateDiff / (1000 * 60 * 60 * 24));
        const dateScore = Math.max(0, 100 - daysDiff * 10);

        if (daysDiff > this.dateTolerance) continue; // Date too different

        // Type must match (debit/credit)
        const typeMatch =
          (bankTxn.type === 'DEBIT' && !sysTxn.isIncome) ||
          (bankTxn.type === 'CREDIT' && sysTxn.isIncome);

        if (!typeMatch) continue;

        // Calculate overall confidence
        const confidence = amountScore * 0.5 + dateScore * 0.5;

        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = {
            bankTransaction: bankTxn,
            systemTransaction: sysTxn,
            confidence: Math.round(confidence),
            status: confidence > 95 ? 'MATCHED' : 'DISCREPANCY',
          };
        }
      }

      if (bestMatch && bestConfidence > 70) {
        matches.push(bestMatch);
        matchedSystemIds.add(bestMatch.systemTransaction!.id);
      } else {
        // Unmatched bank transaction
        matches.push({
          bankTransaction: bankTxn,
          confidence: 0,
          status: 'UNMATCHED',
        });
      }
    }

    console.log('[BankReconciliationService] Matching complete:', {
      matched: matches.filter((m) => m.status === 'MATCHED').length,
      unmatched: matches.filter((m) => m.status === 'UNMATCHED').length,
      discrepancies: matches.filter((m) => m.status === 'DISCREPANCY').length,
    });

    return matches;
  }

  /**
   * Identify discrepancies between bank and system
   */
  async identifyDiscrepancies(
    bankBalance: number,
    systemBalance: number,
    matches: ReconciliationMatch[] = []
  ): Promise<{
    reconciled: boolean;
    difference: number;
    unmatchedItems: ReconciliationMatch[];
    timingDifferences: ReconciliationMatch[];
  }> {
    const difference = Math.abs(bankBalance - systemBalance);
    const reconciled = difference === 0;

    // Identify unmatched items
    const unmatchedItems = matches.filter((m) => m.status === 'UNMATCHED');

    // Identify timing differences (items in system but not in bank yet)
    const timingDifferences = matches.filter((m) => m.status === 'DISCREPANCY');

    console.log('[BankReconciliationService] Discrepancies identified:', {
      reconciled,
      difference,
      unmatchedCount: unmatchedItems.length,
      timingDifferenceCount: timingDifferences.length,
    });

    return {
      reconciled,
      difference,
      unmatchedItems,
      timingDifferences,
    };
  }

  /**
   * Create journal entry for unreconciled items
   * e.g., bank fees, interest not recorded in system
   */
  async createJournalEntry(
    bankAccountId: string,
    description: string,
    amount: number,
    type: 'DEBIT' | 'CREDIT'
  ): Promise<Partial<Transaction>> {
    console.log('[BankReconciliationService] Creating journal entry:', {
      bankAccountId,
      description,
      amount,
      type,
    });

    return {
      id: `txn_${Date.now()}`,
      date: new Date(),
      description,
      amount,
      isIncome: type === 'CREDIT',
      accountingType: 'Expense',
      bankAccountId,
      status: 'APPROVED',
    };
  }

  /**
   * Complete reconciliation for a period
   */
  async completeReconciliation(
    bankAccountId: string,
    statementDate: Date,
    bankBalance: number,
    systemBalance: number
  ): Promise<BankReconciliationReport> {
    const difference = Math.abs(bankBalance - systemBalance);
    const reconciled = difference === 0;

    const report: BankReconciliationReport = {
      bankAccountId,
      statementDate,
      bankClosingBalance: bankBalance,
      systemBalance,
      difference,
      matchedItems: 0, // Would calculate from matches
      unmatchedItems: 0,
      outstandingCheques: 0,
      depositsInTransit: 0,
      status: reconciled ? 'COMPLETED' : 'PENDING',
    };

    console.log('[BankReconciliationService] Reconciliation report:', report);

    return report;
  }

  /**
   * Outstanding items tracking
   * Cheques not yet cleared, pending ACH transfers, deposits in transit
   */
  async identifyOutstandingItems(
    transactions: Transaction[] = []
  ): Promise<{
    outstandingCheques: Transaction[];
    pendingAchs: Transaction[];
    depositsInTransit: Transaction[];
  }> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Outstanding cheques: expenses recorded but not cleared (>3 days old)
    const outstandingCheques = transactions.filter(
      (t) =>
        !t.isIncome &&
        t.paymentMethod === 'CHEQUE' &&
        new Date(t.date) <= thirtyDaysAgo &&
        t.status === 'PENDING_APPROVAL'
    );

    // Pending ACH transfers
    const pendingAchs = transactions.filter(
      (t) =>
        !t.isIncome &&
        t.paymentMethod === 'ACH' &&
        t.status === 'PENDING_APPROVAL'
    );

    // Deposits in transit: income recorded but not cleared
    const depositsInTransit = transactions.filter(
      (t) =>
        t.isIncome &&
        new Date(t.date) <= thirtyDaysAgo &&
        t.status === 'PENDING_APPROVAL'
    );

    console.log('[BankReconciliationService] Outstanding items identified:', {
      cheques: outstandingCheques.length,
      achs: pendingAchs.length,
      deposits: depositsInTransit.length,
    });

    return {
      outstandingCheques,
      pendingAchs,
      depositsInTransit,
    };
  }

  /**
   * Comprehensive reconciliation report
   */
  async generateReconciliationReport(
    bankAccountId: string,
    statementDate: Date,
    bankClosingBalance: number,
    openingBalance: number,
    bankTransactions: BankStatementTransaction[] = [],
    systemTransactions: Transaction[] = []
  ): Promise<BankReconciliationReport> {
    // Calculate system balance
    const systemBalance = await this.calculateSystemBalance(
      bankAccountId,
      statementDate,
      systemTransactions,
      openingBalance
    );

    // Match transactions
    const matches = await this.matchStatementTransactions(
      bankTransactions,
      systemTransactions
    );

    // Identify discrepancies
    const discrepancies = await this.identifyDiscrepancies(
      bankClosingBalance,
      systemBalance,
      matches
    );

    // Outstanding items
    const outstanding = await this.identifyOutstandingItems(
      systemTransactions
    );

    const report: BankReconciliationReport = {
      bankAccountId,
      statementDate,
      bankClosingBalance,
      systemBalance,
      difference: discrepancies.difference,
      matchedItems: matches.filter((m) => m.status === 'MATCHED').length,
      unmatchedItems: matches.filter((m) => m.status === 'UNMATCHED').length,
      outstandingCheques: outstanding.outstandingCheques.length,
      depositsInTransit: outstanding.depositsInTransit.length,
      status: discrepancies.reconciled ? 'COMPLETED' : 'PENDING',
    };

    return report;
  }
}

// Export singleton instance
export const bankReconciliationService = new BankReconciliationService();
