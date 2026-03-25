/**
 * Salary Transfer to Bank Reconciliation Integration
 * Matches payroll transfers with bank statements and reconciliation
 */

export interface SalaryTransferRecord {
  transferId: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  bankAccountId: string;
  bankAccountNumber: string;
  transferAmount: number;
  transferDate: string;
  referenceNumber: string; // UTR/CHQ number
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Reversed';
  bankStatementMatchDate?: string;
  bankStatementDescription?: string;
  reconciliationStatus: 'Unmatched' | 'Matched' | 'Variance';
}

export interface BankStatementLine {
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
  referenceNumber?: string;
  bankName: string;
}

export interface SalaryReconciliationResult {
  totalSalaryTransfers: number;
  totalAmount: number;
  matchedTransfers: number;
  unmatchedTransfers: number;
  bankVariance: number;
  reconciliationStatus: 'Fully Reconciled' | 'Partially Reconciled' | 'Not Reconciled';
  matchedRecords: SalaryTransferRecord[];
  unmatchedRecords: SalaryTransferRecord[];
  unreconciledBankItems: BankStatementLine[];
}

/**
 * Match salary transfers with bank statement entries
 * Uses fuzzy matching on date, amount, and reference numbers
 */
export function matchSalaryTransfersWithBankStatement(
  salaryTransfers: SalaryTransferRecord[],
  bankStatementLines: BankStatementLine[],
  toleranceDays: number = 3,
  toleranceAmount: number = 10 // Allow ₹10 variance
): SalaryReconciliationResult {
  const matchedRecords: SalaryTransferRecord[] = [];
  const unmatchedRecords: SalaryTransferRecord[] = [];
  const unreconciledBankItems: BankStatementLine[] = [...bankStatementLines];

  for (const transfer of salaryTransfers) {
    const transferDate = new Date(transfer.transferDate);
    let isMatched = false;

    for (let i = unreconciledBankItems.length - 1; i >= 0; i--) {
      const bankLine = unreconciledBankItems[i];
      const bankDate = new Date(bankLine.date);
      const daysDifference = Math.abs(Math.floor((bankDate.getTime() - transferDate.getTime()) / (1000 * 3600 * 24)));
      const amountDifference = Math.abs((bankLine.debit || 0) - transfer.transferAmount);

      // Match if date within tolerance and amount within variance
      if (daysDifference <= toleranceDays && amountDifference <= toleranceAmount) {
        // Additional check: reference number match if available
        if (transfer.referenceNumber && bankLine.referenceNumber) {
          if (transfer.referenceNumber === bankLine.referenceNumber) {
            matchRecord(transfer, bankLine, matchedRecords, unreconciledBankItems, i);
            isMatched = true;
            break;
          }
        } else {
          // Match without reference number
          matchRecord(transfer, bankLine, matchedRecords, unreconciledBankItems, i);
          isMatched = true;
          break;
        }
      }
    }

    if (!isMatched) {
      const unmatchedTransfer = {
        ...transfer,
        reconciliationStatus: 'Unmatched' as const,
        status: 'Pending' as const,
      };
      unmatchedRecords.push(unmatchedTransfer);
    }
  }

  const totalAmount = salaryTransfers.reduce((sum, t) => sum + t.transferAmount, 0);
  const matchedAmount = matchedRecords.reduce((sum, t) => sum + t.transferAmount, 0);
  const bankVariance = totalAmount - matchedAmount;

  return {
    totalSalaryTransfers: salaryTransfers.length,
    totalAmount,
    matchedTransfers: matchedRecords.length,
    unmatchedTransfers: unmatchedRecords.length,
    bankVariance,
    reconciliationStatus:
      unmatchedRecords.length === 0 && unreconciledBankItems.length === 0
        ? 'Fully Reconciled'
        : unmatchedRecords.length === 0 || unreconciledBankItems.length === 0
        ? 'Partially Reconciled'
        : 'Not Reconciled',
    matchedRecords,
    unmatchedRecords,
    unreconciledBankItems,
  };
}

function matchRecord(
  transfer: SalaryTransferRecord,
  bankLine: BankStatementLine,
  matchedRecords: SalaryTransferRecord[],
  unreconciledBankItems: BankStatementLine[],
  indexToRemove: number
) {
  const matchedTransfer: SalaryTransferRecord = {
    ...transfer,
    reconciliationStatus: 'Matched',
    bankStatementMatchDate: bankLine.date,
    bankStatementDescription: bankLine.description,
    status: 'Completed',
  };
  matchedRecords.push(matchedTransfer);
  unreconciledBankItems.splice(indexToRemove, 1);
}

/**
 * Generate salary transfer batch for bank processing
 * Creates a structured file for batch salary transfers
 */
export function generateSalaryTransferBatch(
  salaryTransfers: SalaryTransferRecord[],
  batchId: string,
  batchDate: string
) {
  const batch = {
    batchId,
    batchDate,
    totalRecords: salaryTransfers.length,
    totalAmount: salaryTransfers.reduce((sum, t) => sum + t.transferAmount, 0),
    transfers: salaryTransfers.map((transfer, index) => ({
      sequenceNo: index + 1,
      employeeId: transfer.employeeId,
      employeeName: transfer.employeeName,
      bankAccount: transfer.bankAccountNumber,
      amount: transfer.transferAmount,
      narration: `SALARY-${transfer.payrollRunId.substring(0, 8).toUpperCase()}`,
      transferType: 'NEFT', // or IMPS, RTGS
      instructions: {
        deductCharges: false,
        ifsc: 'IFSC0000001', // Bank's IFSC
      },
    })),
    fileFormat: 'CSV',
    checksumAmount: salaryTransfers.reduce((sum, t) => sum + t.transferAmount, 0),
    generateTime: new Date().toISOString(),
  };

  return batch;
}

/**
 * Track salary transfer status through bank processing lifecycle
 */
export function trackTransferLifecycle(
  transfers: SalaryTransferRecord[],
  bankStatement: BankStatementLine[]
) {
  const statusBreakdown = {
    pending: transfers.filter(t => t.status === 'Pending').length,
    processing: transfers.filter(t => t.status === 'Processing').length,
    completed: transfers.filter(t => t.status === 'Completed').length,
    failed: transfers.filter(t => t.status === 'Failed').length,
    reversed: transfers.filter(t => t.status === 'Reversed').length,
  };

  const timeline = {
    initiated: transfers.filter(t => t.status === 'Pending'),
    inProgress: transfers.filter(t => t.status === 'Processing'),
    settled: transfers.filter(t => t.status === 'Completed'),
    problematic: transfers.filter(t => t.status === 'Failed' || t.status === 'Reversed'),
  };

  const successRate =
    transfers.length > 0
      ? ((statusBreakdown.completed / transfers.length) * 100).toFixed(2)
      : '0.00';

  return {
    statusBreakdown,
    timeline,
    successRate: `${successRate}%`,
    totalProcessingAmount: transfers.reduce((sum, t) => sum + t.transferAmount, 0),
    averageProcessingTime: calculateAverageProcessingTime(transfers),
  };
}

function calculateAverageProcessingTime(transfers: SalaryTransferRecord[]): string {
  const completedTransfers = transfers.filter(t => t.status === 'Completed' && t.bankStatementMatchDate);

  if (completedTransfers.length === 0) return 'N/A';

  const totalDays = completedTransfers.reduce((sum, transfer) => {
    const startDate = new Date(transfer.transferDate);
    const endDate = new Date(transfer.bankStatementMatchDate!);
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    return sum + days;
  }, 0);

  const avgDays = Math.round(totalDays / completedTransfers.length);
  return `${avgDays} days`;
}

/**
 * Identify and flag anomalies in salary transfers
 * Detects suspicious patterns or discrepancies
 */
export function identifyTransferAnomalies(
  transfers: SalaryTransferRecord[],
  reconciliationResult: SalaryReconciliationResult
) {
  const anomalies: Array<{
    type: string;
    severity: 'Low' | 'Medium' | 'High';
    description: string;
    affectedRecords: SalaryTransferRecord[];
  }> = [];

  // 1. Check for high variance amounts
  const varianceTransfers = reconciliationResult.unmatchedRecords.filter(t => t.status === 'Pending');
  if (varianceTransfers.length > transfers.length * 0.1) {
    anomalies.push({
      type: 'High Unmatched Transfers',
      severity: 'High',
      description: `${varianceTransfers.length} transfers (${((varianceTransfers.length / transfers.length) * 100).toFixed(1)}%) are unmatched after ${3} days`,
      affectedRecords: varianceTransfers,
    });
  }

  // 2. Check for duplicate amounts within same day
  const transfersByDate = transfers.reduce((acc: Record<string, SalaryTransferRecord[]>, t) => {
    if (!acc[t.transferDate]) acc[t.transferDate] = [];
    acc[t.transferDate].push(t);
    return acc;
  }, {});

  for (const [date, dayTransfers] of Object.entries(transfersByDate)) {
    const duplicateAmounts = dayTransfers.filter(
      t => dayTransfers.filter(dt => dt.transferAmount === t.transferAmount).length > 1
    );
    if (duplicateAmounts.length > 5) {
      anomalies.push({
        type: 'Unusual Amount Pattern',
        severity: 'Medium',
        description: `Multiple identical transfer amounts on ${date}`,
        affectedRecords: duplicateAmounts,
      });
    }
  }

  // 3. Check for failed/reversed transfers
  const problemTransfers = transfers.filter(t => t.status === 'Failed' || t.status === 'Reversed');
  if (problemTransfers.length > 0) {
    anomalies.push({
      type: 'Failed/Reversed Transfers',
      severity: 'High',
      description: `${problemTransfers.length} transfers failed or were reversed. Requires immediate investigation.`,
      affectedRecords: problemTransfers,
    });
  }

  // 4. Check for very high amounts (potential errors)
  const avgAmount = transfers.reduce((sum, t) => sum + t.transferAmount, 0) / transfers.length;
  const outliers = transfers.filter(t => t.transferAmount > avgAmount * 2);
  if (outliers.length > 0) {
    anomalies.push({
      type: 'Outlier Amounts Detected',
      severity: 'Low',
      description: `${outliers.length} transfers significantly exceed average amount (₹${avgAmount.toFixed(0)})`,
      affectedRecords: outliers,
    });
  }

  return {
    anomalyCount: anomalies.length,
    anomalies,
    riskLevel: anomalies.some(a => a.severity === 'High')
      ? 'High'
      : anomalies.some(a => a.severity === 'Medium')
      ? 'Medium'
      : 'Low',
  };
}

/**
 * Generate reconciliation report for accounting records
 */
export function generateReconciliationReport(
  reconciliationResult: SalaryReconciliationResult,
  anomalies: ReturnType<typeof identifyTransferAnomalies>,
  reportDate: string
) {
  return {
    reportDate,
    summary: {
      totalTransfers: reconciliationResult.totalSalaryTransfers,
      totalAmount: reconciliationResult.totalAmount,
      matched: reconciliationResult.matchedTransfers,
      unmatched: reconciliationResult.unmatchedTransfers,
      reconciliationStatus: reconciliationResult.reconciliationStatus,
    },
    details: {
      matchedAmount: reconciliationResult.matchedRecords.reduce((sum, t) => sum + t.transferAmount, 0),
      unmatchedAmount: reconciliationResult.unmatchedRecords.reduce((sum, t) => sum + t.transferAmount, 0),
      variance: reconciliationResult.bankVariance,
      unreconciledBankItemsCount: reconciliationResult.unreconciledBankItems.length,
    },
    risks: {
      anomalyCount: anomalies.anomalyCount,
      riskLevel: anomalies.riskLevel,
      requiresReview: anomalies.anomalyCount > 0,
    },
    recommendations: generateRecommendations(reconciliationResult, anomalies),
  };
}

function generateRecommendations(
  reconciliationResult: SalaryReconciliationResult,
  anomalies: ReturnType<typeof identifyTransferAnomalies>
): string[] {
  const recommendations: string[] = [];

  if (reconciliationResult.unmatchedTransfers > 0) {
    recommendations.push(
      `Follow up on ${reconciliationResult.unmatchedTransfers} unmatched transfers. Check if they were processed by the bank or if there were any rejections.`
    );
  }

  if (reconciliationResult.bankVariance > 1000) {
    recommendations.push('Significant variance detected. Review bank statement details and payroll records for discrepancies.');
  }

  if (anomalies.riskLevel === 'High') {
    recommendations.push(
      'High-risk anomalies detected. Review all flagged transfers immediately and escalate to finance team if necessary.'
    );
  }

  if (reconciliationResult.unreconciledBankItems.length > 0) {
    recommendations.push(
      `${reconciliationResult.unreconciledBankItems.length} bank statement items not matched to payroll. Investigate if these are salary-related or other transactions.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Reconciliation completed successfully. No issues detected.');
  }

  return recommendations;
}
