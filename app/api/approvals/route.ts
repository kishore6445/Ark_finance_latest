import { NextRequest, NextResponse } from 'next/server';
import { approvalChainService } from '@/services/approval-chain.service';

/**
 * POST /api/approvals/create
 * Create an approval request for a transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, organizationId, amount, accountingType, createdBy } = body;

    console.log('[Approvals API] Creating approval request:', {
      transactionId,
      amount,
    });

    // Validate inputs
    if (!transactionId || !organizationId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, organizationId, amount' },
        { status: 400 }
      );
    }

    // Create approval request
    const approval = await approvalChainService.createApprovalRequest(
      {
        id: transactionId,
        organizationId,
        amount,
        accountingType: accountingType || 'Expense',
        date: new Date(),
        description: '',
        isIncome: false,
        status: 'PENDING_APPROVAL',
        createdBy: createdBy || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdBy
    );

    if (!approval) {
      return NextResponse.json(
        { message: 'Transaction auto-approved (below threshold)', approved: true },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Approval request created',
        approval,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Approvals API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create approval request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/approvals/queue
 * Get pending approvals for a user/role
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const approverRole = searchParams.get('approverRole');

    console.log('[Approvals API] Fetching approval queue:', {
      organizationId,
      approverRole,
    });

    if (!organizationId || !approverRole) {
      return NextResponse.json(
        { error: 'Missing required query parameters' },
        { status: 400 }
      );
    }

    // Get approval queue
    const queue = await approvalChainService.getApprovalQueue(
      organizationId,
      approverRole
    );

    return NextResponse.json(
      {
        count: queue.length,
        approvals: queue,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Approvals API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval queue' },
      { status: 500 }
    );
  }
}
