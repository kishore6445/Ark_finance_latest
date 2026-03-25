// Bank account management utilities and calculations

export interface AllocationSummary {
  bucketId: string;
  bucketName: string;
  totalAllocationPercentage: number;
  isBalanced: boolean;
  allocations: {
    accountId: string;
    accountName: string;
    percentage: number;
    isAutomatic: boolean;
  }[];
}

export interface AccountSummary {
  accountId: string;
  accountName: string;
  balance: number;
  linkedBuckets: string[];
  totalAllocationPercentage: number;
}

export interface TransferSuggestion {
  fromAccountId: string;
  toAccountId: string;
  suggestedAmount: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Calculate allocation summary for all buckets
 */
export function calculateAllocationSummary(
  buckets: { id: string; name: string }[],
  mappings: any[],
  accounts: any[]
): AllocationSummary[] {
  return buckets.map((bucket) => {
    const bucketMappings = mappings.filter((m) => m.bucketId === bucket.id);
    const totalPercentage = bucketMappings.reduce((sum, m) => sum + m.allocationPercentage, 0);

    return {
      bucketId: bucket.id,
      bucketName: bucket.name,
      totalAllocationPercentage: totalPercentage,
      isBalanced: totalPercentage === 100,
      allocations: bucketMappings.map((m) => ({
        accountId: m.bankAccountId,
        accountName: accounts.find((a) => a.id === m.bankAccountId)?.accountName || 'Unknown',
        percentage: m.allocationPercentage,
        isAutomatic: m.isAutomatic,
      })),
    };
  });
}

/**
 * Calculate account summary with total allocations
 */
export function calculateAccountSummary(accounts: any[], mappings: any[]): AccountSummary[] {
  return accounts.map((account) => {
    const accountMappings = mappings.filter((m) => m.bankAccountId === account.id);
    const uniqueBuckets = [...new Set(accountMappings.map((m) => m.bucketId))];
    const totalPercentage = accountMappings.reduce((sum, m) => sum + m.allocationPercentage, 0);

    return {
      accountId: account.id,
      accountName: account.accountName,
      balance: account.balance,
      linkedBuckets: uniqueBuckets,
      totalAllocationPercentage: totalPercentage,
    };
  });
}

/**
 * Suggest transfers based on allocation rules and current balances
 */
export function suggestTransfers(
  accounts: any[],
  allocations: AllocationSummary[],
  transfers: any[]
): TransferSuggestion[] {
  const suggestions: TransferSuggestion[] = [];

  // Check for overallocated or underallocated accounts
  allocations.forEach((allocation) => {
    if (!allocation.isBalanced) {
      if (allocation.totalAllocationPercentage > 100) {
        // Account is overallocated - suggest reducing allocations
        const excess = allocation.totalAllocationPercentage - 100;
        suggestions.push({
          fromAccountId: '',
          toAccountId: '',
          suggestedAmount: 0,
          reason: `Bucket "${allocation.bucketName}" is overallocated by ${excess}%. Please adjust allocations.`,
          priority: 'high',
        });
      } else if (allocation.totalAllocationPercentage < 100) {
        // Account is underallocated - suggest adding more
        const gap = 100 - allocation.totalAllocationPercentage;
        suggestions.push({
          fromAccountId: '',
          toAccountId: '',
          suggestedAmount: 0,
          reason: `Bucket "${allocation.bucketName}" has ${gap}% unallocated. Consider adding allocations.`,
          priority: 'medium',
        });
      }
    }
  });

  // Check for pending transfers that are too old
  const now = new Date();
  transfers.forEach((transfer) => {
    if (transfer.status === 'Pending') {
      const transferDate = new Date(transfer.date);
      const daysDiff = Math.floor((now.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 3) {
        suggestions.push({
          fromAccountId: transfer.fromAccountId,
          toAccountId: transfer.toAccountId,
          suggestedAmount: transfer.amount,
          reason: `Pending transfer of ₹${transfer.amount} is ${daysDiff} days old. Consider completing it.`,
          priority: 'high',
        });
      }
    }
  });

  return suggestions;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get bucket color for UI display
 */
export function getBucketColor(bucketId: string): { bg: string; text: string; badge: string } {
  const colors: Record<string, { bg: string; text: string; badge: string }> = {
    gst: { bg: 'bg-blue-50', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-900' },
    operating: { bg: 'bg-green-50', text: 'text-green-900', badge: 'bg-green-100 text-green-900' },
    reserve: { bg: 'bg-purple-50', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-900' },
    capex: { bg: 'bg-orange-50', text: 'text-orange-900', badge: 'bg-orange-100 text-orange-900' },
  };
  return colors[bucketId] || { bg: 'bg-gray-50', text: 'text-gray-900', badge: 'bg-gray-100 text-gray-900' };
}

/**
 * Validate allocation percentages for a bucket
 */
export function validateBucketAllocation(allocation: AllocationSummary): { isValid: boolean; error?: string } {
  if (allocation.totalAllocationPercentage > 100) {
    return {
      isValid: false,
      error: `Total allocation exceeds 100% (currently ${allocation.totalAllocationPercentage}%)`,
    };
  }
  if (allocation.totalAllocationPercentage < 100) {
    return {
      isValid: false,
      error: `Total allocation is less than 100% (currently ${allocation.totalAllocationPercentage}%). All money must be allocated.`,
    };
  }
  return { isValid: true };
}
