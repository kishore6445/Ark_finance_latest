import { NextRequest, NextResponse } from 'next/server';
import { invoiceMatchingService } from '@/services/invoice-matching.service';

/**
 * GET /api/invoices/[id]/suggest-matches
 * Get match suggestions for an invoice
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;

    console.log('[Invoice Matching API] Getting suggestions for invoice:', {
      invoiceId,
    });

    // In real implementation, would fetch invoice and transactions from DB
    const matches = await invoiceMatchingService.suggestMatches(
      {
        id: invoiceId,
        organizationId: '',
        invoiceNo: '',
        partyName: '',
        type: 'Expense',
        invoiceAmount: 0,
        paidAmount: 0,
        balanceDue: 0,
        dueDate: new Date(),
        status: 'UNPAID',
        createdBy: '',
        createdAt: new Date(),
      },
      []
    );

    return NextResponse.json(
      {
        invoiceId,
        matchCount: matches.length,
        suggestions: matches,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Invoice Matching API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match suggestions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices/[id]/match
 * Match invoice to transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const body = await request.json();
    const { transactionId, matchNote } = body;

    console.log('[Invoice Matching API] Matching invoice to transaction:', {
      invoiceId,
      transactionId,
    });

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Missing transactionId' },
        { status: 400 }
      );
    }

    // Perform matching
    const result = await invoiceMatchingService.matchInvoiceToTransaction(
      invoiceId,
      transactionId,
      matchNote
    );

    return NextResponse.json(
      {
        message: 'Invoice matched successfully',
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Invoice Matching API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to match invoice' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id]/match
 * Unmatch invoice from transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;

    console.log('[Invoice Matching API] Unmatching invoice:', {
      invoiceId,
    });

    // Perform unmatching
    const result = await invoiceMatchingService.unmatchInvoiceFromTransaction(
      invoiceId
    );

    return NextResponse.json(
      {
        message: 'Invoice unmatched successfully',
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Invoice Matching API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to unmatch invoice' },
      { status: 500 }
    );
  }
}
