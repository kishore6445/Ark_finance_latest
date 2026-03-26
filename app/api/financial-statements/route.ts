import { NextRequest, NextResponse } from 'next/server';
import { financialCalculationsService } from '@/services/financial-calculations.service';

/**
 * GET /api/financial-statements/pnl
 * Get P&L Statement
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('[Financial Statements API] Fetching P&L:', {
      organizationId,
      dateRange: `${startDate} to ${endDate}`,
    });

    if (!organizationId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required query parameters' },
        { status: 400 }
      );
    }

    // In a real implementation, would fetch transactions from database
    const pnl = await financialCalculationsService.calculatePnL(
      organizationId,
      new Date(startDate),
      new Date(endDate),
      [] // Would pass actual transactions from DB
    );

    return NextResponse.json(
      {
        statement: 'P&L',
        pnl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Financial Statements API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch P&L statement' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/financial-statements/balance-sheet
 * Get Balance Sheet
 */
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (endpoint === 'balance-sheet') {
    try {
      const organizationId = searchParams.get('organizationId');
      const asOfDate = searchParams.get('asOfDate');

      console.log('[Financial Statements API] Fetching Balance Sheet:', {
        organizationId,
        asOfDate,
      });

      if (!organizationId || !asOfDate) {
        return NextResponse.json(
          { error: 'Missing required query parameters' },
          { status: 400 }
        );
      }

      const balanceSheet = await financialCalculationsService.calculateBalanceSheet(
        organizationId,
        new Date(asOfDate),
        []
      );

      // Validate balance sheet
      const validation = financialCalculationsService.validateBalanceSheet(
        balanceSheet
      );

      return NextResponse.json(
        {
          statement: 'Balance Sheet',
          balanceSheet,
          validation,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('[Financial Statements API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch balance sheet' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Invalid endpoint' },
    { status: 400 }
  );
}
