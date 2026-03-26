import { NextRequest, NextResponse } from 'next/server';
import { gstComplianceService } from '@/services/gst-compliance.service';

/**
 * GET /api/gst/returns
 * Get GST returns for a period
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const year = searchParams.get('year');
    const quarter = searchParams.get('quarter');

    console.log('[GST API] Fetching GST return:', {
      organizationId,
      period: `${quarter}-${year}`,
    });

    if (!organizationId || !year || !quarter) {
      return NextResponse.json(
        { error: 'Missing required query parameters' },
        { status: 400 }
      );
    }

    // Generate GSTR-3B (comprehensive summary)
    const gstrReturn = await gstComplianceService.generateGSTR3B(
      organizationId,
      parseInt(year),
      quarter,
      []
    );

    return NextResponse.json(
      {
        return: gstrReturn,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GST API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GST returns' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gst/calculate
 * Calculate GST for a transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, rate, description } = body;

    console.log('[GST API] Calculating GST:', {
      amount,
      rate,
    });

    if (!amount) {
      return NextResponse.json(
        { error: 'Missing amount' },
        { status: 400 }
      );
    }

    let gstRate = rate;

    // If no rate provided, classify based on description
    if (!gstRate && description) {
      const classification = gstComplianceService.classifyGSTRate(
        description,
        amount
      );
      gstRate = classification.rate;
    }

    if (!gstRate) {
      gstRate = 18; // Default to standard rate
    }

    // Calculate GST
    const calculation = gstComplianceService.calculateGST(
      amount,
      gstRate as 5 | 12 | 18 | 28
    );

    return NextResponse.json(
      {
        calculation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GST API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate GST' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gst/classify
 * Classify GST rate for a description
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const description = searchParams.get('description');

    console.log('[GST API] Classifying GST rate:', {
      description,
    });

    if (!description) {
      return NextResponse.json(
        { error: 'Missing description' },
        { status: 400 }
      );
    }

    const classification = gstComplianceService.classifyGSTRate(description);

    return NextResponse.json(
      {
        classification,
        rateExamples: gstComplianceService.getGSTRateExamples(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GST API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to classify GST rate' },
      { status: 500 }
    );
  }
}
