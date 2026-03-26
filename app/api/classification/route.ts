import { NextRequest, NextResponse } from 'next/server';
import { autoClassificationService } from '@/services/auto-classification.service';

/**
 * POST /api/classification/suggest
 * Get CoA suggestions for a transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, amount, transactionType } = body;

    console.log('[Classification API] Getting suggestions:', {
      description,
      transactionType,
    });

    if (!description) {
      return NextResponse.json(
        { error: 'Missing description' },
        { status: 400 }
      );
    }

    // Get suggestions
    const suggestions = await autoClassificationService.suggestClassification(
      description,
      amount,
      transactionType
    );

    return NextResponse.json(
      {
        description,
        suggestions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Classification API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/classification/accept
 * Accept a classification suggestion
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, coaCode, description, manualOverride } = body;

    console.log('[Classification API] Accepting classification:', {
      transactionId,
      coaCode,
      override: manualOverride,
    });

    if (!transactionId || !coaCode) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, coaCode' },
        { status: 400 }
      );
    }

    // Accept suggestion
    const classification = await autoClassificationService.acceptSuggestion(
      transactionId,
      coaCode,
      description,
      manualOverride
    );

    return NextResponse.json(
      {
        message: 'Classification accepted',
        classification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Classification API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to accept classification' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/classification/confidence
 * Get confidence score for a classification
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const description = searchParams.get('description');
    const coaCode = searchParams.get('coaCode');

    console.log('[Classification API] Calculating confidence:', {
      description,
      coaCode,
    });

    if (!description || !coaCode) {
      return NextResponse.json(
        { error: 'Missing required query parameters' },
        { status: 400 }
      );
    }

    // Get confidence
    const confidence = await autoClassificationService.getClassificationConfidence(
      description,
      coaCode
    );

    return NextResponse.json(
      {
        confidence,
        action:
          confidence > 90
            ? 'AUTO_CLASSIFY'
            : confidence > 70
              ? 'SUGGEST'
              : 'MANUAL_REVIEW',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Classification API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate confidence' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/classification/chart-of-accounts
 * Get all available Chart of Accounts
 */
export async function DELETE(request: NextRequest) {
  try {
    const coaList = autoClassificationService.getChartOfAccounts();

    return NextResponse.json(
      {
        count: coaList.length,
        accounts: coaList,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Classification API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Chart of Accounts' },
      { status: 500 }
    );
  }
}
