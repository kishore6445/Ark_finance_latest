import {
  ApprovalRequest,
  ApprovalChainConfig,
  Transaction,
  Approval,
} from '@/types/business-logic.types';

/**
 * Approval Chain Engine
 * Implements amount-based approval routing with multi-level validation
 */

const DEFAULT_CONFIG: ApprovalChainConfig = {
  thresholdBasic: 10000, // < ₹10K = auto-approve
  thresholdManager: 100000, // ₹10K-₹1L = Manager
  thresholdAdmin: 1000000, // > ₹1L = Admin + optional Auditor
  criticalTypes: ['Payroll', 'Legal', 'Asset Purchase', 'Fund Transfer'],
};

export class ApprovalChainService {
  private config: ApprovalChainConfig;

  constructor(config?: Partial<ApprovalChainConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Determines required approval level based on transaction amount and type
   * Returns: NONE (auto-approve), MANAGER, ADMIN, or ADMIN_AUDITOR (critical)
   */
  determineApprovalLevel(
    amount: number,
    transactionType: string
  ): 'NONE' | 'MANAGER' | 'ADMIN' | 'ADMIN_AUDITOR' {
    // Critical transactions always need highest approval
    if (this.config.criticalTypes.includes(transactionType)) {
      return 'ADMIN_AUDITOR';
    }

    // Amount-based routing
    if (amount < this.config.thresholdBasic) {
      return 'NONE'; // Auto-approve
    }

    if (amount <= this.config.thresholdManager) {
      return 'MANAGER';
    }

    if (amount <= this.config.thresholdAdmin) {
      return 'ADMIN';
    }

    return 'ADMIN'; // > ₹1L still goes to Admin (could add extra tier)
  }

  /**
   * Creates an approval request in the system
   * Returns the approval record or null if auto-approved
   */
  async createApprovalRequest(
    transaction: Transaction,
    createdBy: string
  ): Promise<ApprovalRequest | null> {
    const approvalLevel = this.determineApprovalLevel(
      transaction.amount,
      transaction.accountingType
    );

    // Auto-approve transactions below threshold
    if (approvalLevel === 'NONE') {
      return null;
    }

    const approvalRequest: ApprovalRequest = {
      id: `apr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactionId: transaction.id,
      organizationId: transaction.organizationId,
      amount: transaction.amount,
      type: transaction.accountingType,
      status: 'PENDING',
      approvalLevel,
      reason: `${transaction.accountingType} of ₹${transaction.amount.toLocaleString('en-IN')}`,
      createdAt: new Date(),
    };

    // Log to audit trail (in real implementation, save to DB)
    console.log(
      '[ApprovalChainService] Created approval request:',
      approvalRequest
    );

    return approvalRequest;
  }

  /**
   * Process an approval decision (approve/reject/request info)
   * Updates transaction status and creates audit entry
   */
  async processApprovalDecision(
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED',
    approverUserId: string,
    approverRole: string,
    comment?: string
  ): Promise<Approval> {
    const approval: Approval = {
      id: approvalId,
      transactionId: '', // Would fetch from DB
      organizationId: '', // Would fetch from DB
      approverRole,
      approverUserId,
      status: decision,
      amount: 0, // Would fetch from DB
      reason: comment,
      approvalDate: new Date(),
      createdAt: new Date(),
    };

    console.log('[ApprovalChainService] Approval decision:', {
      approvalId,
      decision,
      approver: approverUserId,
      comment,
    });

    return approval;
  }

  /**
   * Check if a transaction has all required approvals
   * Returns true if transaction is approved and ready to record
   */
  async checkApprovalStatus(
    transactionId: string
  ): Promise<{ approved: boolean; level: string }> {
    // Would query database for approval records
    // For now, return mock response
    return {
      approved: true,
      level: 'MANAGER',
    };
  }

  /**
   * Auto-escalate approvals stalled for > 48 hours
   * Notifies next level of authority
   */
  async escalateStalledApprovals(organizationId: string): Promise<number> {
    // Query DB for approvals older than 48 hours in PENDING status
    // Move to next escalation level
    // Send notifications

    console.log('[ApprovalChainService] Escalating stalled approvals');

    return 0; // Number of escalated items
  }

  /**
   * Get approval queue for a specific role/user
   */
  async getApprovalQueue(
    organizationId: string,
    approverRole: string,
    userId?: string
  ): Promise<ApprovalRequest[]> {
    // Query DB for pending approvals assigned to this role
    const mockQueue: ApprovalRequest[] = [
      {
        id: 'apr_001',
        transactionId: 'txn_001',
        organizationId,
        amount: 50000,
        type: 'Expense',
        status: 'PENDING',
        approvalLevel: 'MANAGER',
        approverRole,
        reason: 'Equipment purchase - ₹50,000',
        createdAt: new Date(),
      },
      {
        id: 'apr_002',
        transactionId: 'txn_002',
        organizationId,
        amount: 75000,
        type: 'Revenue',
        status: 'PENDING',
        approvalLevel: 'MANAGER',
        approverRole,
        reason: 'Contract revenue - ₹75,000',
        createdAt: new Date(),
      },
    ];

    return mockQueue;
  }

  /**
   * Calculate approval chain hierarchy for reporting
   */
  getApprovalHierarchy(organizationId: string): Record<string, string[]> {
    return {
      'NONE': [],
      'MANAGER': ['MANAGER'],
      'ADMIN': ['MANAGER', 'ADMIN'],
      'ADMIN_AUDITOR': ['MANAGER', 'ADMIN', 'AUDITOR'],
    };
  }

  /**
   * Validate if a user has permission to approve
   */
  canApprove(
    userRole: string,
    requiredLevel: string
  ): boolean {
    const hierarchy: Record<string, number> = {
      'VIEWER': 0,
      'ACCOUNTANT': 1,
      'MANAGER': 2,
      'AUDITOR': 3,
      'ORG_ADMIN': 4,
    };

    const levelMap: Record<string, number> = {
      'NONE': 0,
      'MANAGER': 2,
      'ADMIN': 4,
      'ADMIN_AUDITOR': 4,
    };

    return (hierarchy[userRole] || 0) >= (levelMap[requiredLevel] || 0);
  }
}

// Export singleton instance
export const approvalChainService = new ApprovalChainService();
