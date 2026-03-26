import { NextRequest, NextResponse } from 'next/server';
import { approvalChainService } from '@/services/approval-chain.service';

/**
 * POST /api/approvals/[id]/approve
 * Approve a transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const approvalId = params.id;
    const body = await request.json();
    const { approverUserId, approverRole, comment } = body;

    console.log('[Approval Action API] Approving:', {
      approvalId,
      approverRole,
    });

    if (!approverUserId || !approverRole) {
      return NextResponse.json(
        { error: 'Missing required fields: approverUserId, approverRole' },
        { status: 400 }
      );
    }

    // Process approval decision
    const approval = await approvalChainService.processApprovalDecision(
      approvalId,
      'APPROVED',
      approverUserId,
      approverRole,
      comment
    );

    return NextResponse.json(
      {
        message: 'Transaction approved',
        approval,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Approval Action API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to approve transaction' },
      { status: 500 }
    );
  }
}
