import { NextRequest, NextResponse } from 'next/server';
import { bankReconciliationService } from '@/services/bank-reconciliation.service';

/**
 * POST /api/reconciliation/upload-statement
 * Parse and process bank statement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvData, bankAccountId, statementDate } = body;

    console.log('[Bank Reconciliation API] Uploading statement:', {
      bankAccountId,
      statementDate,
    });

    if (!csvData || !bankAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields: csvData, bankAccountId' },
        { status: 400 }
      );
    }

    // Parse statement
    const bankTransactions = await bankReconciliationService.parseStatement(
      csvData
    );

    console.log('[Bank Reconciliation API] Parsed transactions:', {
      count: bankTransactions.length,
    });

    return NextResponse.json(
      {
        message: 'Statement parsed successfully',
        transactionCount: bankTransactions.length,
        transactions: bankTransactions.slice(0, 10), // Return first 10 as preview
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Bank Reconciliation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to parse statement' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reconciliation/status
 * Get reconciliation status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId');
    const statementDate = searchParams.get('statementDate');

    console.log('[Bank Reconciliation API] Getting reconciliation status:', {
      bankAccountId,
      statementDate,
    });

    if (!bankAccountId) {
      return NextResponse.json(
        { error: 'Missing required query parameters' },
        { status: 400 }
      );
    }

    // Mock reconciliation report
    const report = {
      bankAccountId,
      statementDate: new Date(statementDate || Date.now()),
      bankClosingBalance: 500000,
      systemBalance: 500000,
      difference: 0,
      matchedItems: 15,
      unmatchedItems: 0,
      outstandingCheques: 2,
      depositsInTransit: 1,
      status: 'COMPLETED',
    };

    return NextResponse.json(
      {
        reconciliation: report,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Bank Reconciliation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reconciliation status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reconciliation/complete
 * Mark reconciliation as complete
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bankAccountId, statementDate, bankBalance, systemBalance } = body;

    console.log('[Bank Reconciliation API] Completing reconciliation:', {
      bankAccountId,
      difference: Math.abs(bankBalance - systemBalance),
    });

    if (!bankAccountId || !statementDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Complete reconciliation
    const report = await bankReconciliationService.completeReconciliation(
      bankAccountId,
      new Date(statementDate),
      bankBalance || 0,
      systemBalance || 0
    );

    return NextResponse.json(
      {
        message: 'Reconciliation completed',
        report,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Bank Reconciliation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete reconciliation' },
      { status: 500 }
    );
  }
}
