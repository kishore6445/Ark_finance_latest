import {
  GSTReturn,
  GSTTransaction,
  Transaction,
} from '@/types/business-logic.types';

/**
 * GST Compliance Service
 * Calculates and tracks GST obligations for Indian businesses
 */

export interface GSTRate {
  rate: 5 | 12 | 18 | 28;
  category: string;
  examples: string[];
}

export interface GSTRates {
  standard: GSTRate[];
  exempt: string[];
}

export class GSTComplianceService {
  private readonly gstRates: GSTRates = {
    standard: [
      {
        rate: 5,
        category: 'Essential Goods',
        examples: ['Food items', 'Books', 'Medications'],
      },
      {
        rate: 12,
        category: 'Common Services',
        examples: ['Restaurant', 'Repair services', 'Insurance'],
      },
      {
        rate: 18,
        category: 'Standard Rate',
        examples: ['Technology', 'Software', 'Professional services'],
      },
      {
        rate: 28,
        category: 'Luxury Goods',
        examples: ['Vehicles', 'Jewelry', 'Luxury items'],
      },
    ],
    exempt: ['Salary', 'Rent (residential)', 'Education', 'Medical services'],
  };

  private gstFilingSchedule: Record<string, { fileBy: number; payBy: number }> = {
    'Q1': { fileBy: 20, payBy: 25 }, // Jan-Mar, file by Apr 20, pay by Apr 25
    'Q2': { fileBy: 20, payBy: 25 }, // Apr-Jun, file by Jul 20, pay by Jul 25
    'Q3': { fileBy: 20, payBy: 25 }, // Jul-Sep, file by Oct 20, pay by Oct 25
    'Q4': { fileBy: 20, payBy: 25 }, // Oct-Dec, file by Jan 20, pay by Jan 25
  };

  /**
   * Classify transaction and suggest GST rate
   * Uses keyword matching and transaction type
   */
  classifyGSTRate(
    description: string,
    amount: number = 0,
    transactionType?: string
  ): { rate: 5 | 12 | 18 | 28; confidence: number } {
    const descLower = description.toLowerCase();

    // Check for exempt items
    for (const exempt of this.gstRates.exempt) {
      if (descLower.includes(exempt.toLowerCase())) {
        return { rate: 0 as any, confidence: 100 }; // 0 = exempt
      }
    }

    // Score each rate based on keywords
    const scores: Record<number, number> = {};

    for (const rateGroup of this.gstRates.standard) {
      let score = 0;

      for (const example of rateGroup.examples) {
        if (descLower.includes(example.toLowerCase())) {
          score = 100;
          break;
        }
      }

      if (score === 0) {
        // Check category name
        if (descLower.includes(rateGroup.category.toLowerCase())) {
          score = 60;
        }
      }

      if (score > 0) {
        scores[rateGroup.rate] = score;
      }
    }

    // If no match, default to 18% (standard rate)
    if (Object.keys(scores).length === 0) {
      return { rate: 18, confidence: 30 };
    }

    // Return highest scoring rate
    const [rate, confidence] = Object.entries(scores).reduce((a, b) =>
      b[1] > a[1] ? b : a
    ) as [string, number];

    return { rate: parseInt(rate) as 5 | 12 | 18 | 28, confidence };
  }

  /**
   * Calculate GST amount and taxable amount
   */
  calculateGST(
    amount: number,
    rate: 5 | 12 | 18 | 28
  ): { taxableAmount: number; gstAmount: number; totalAmount: number } {
    if (rate === 0) {
      return {
        taxableAmount: amount,
        gstAmount: 0,
        totalAmount: amount,
      };
    }

    // Assuming amount is before GST (exclusive)
    const gstAmount = (amount * rate) / 100;
    const totalAmount = amount + gstAmount;

    return {
      taxableAmount: amount,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  /**
   * Generate GSTR-1 (B2B Sales Report)
   * Returns all outgoing supplies to registered dealers
   */
  async generateGSTR1(
    organizationId: string,
    year: number,
    quarter: string, // 'Q1', 'Q2', 'Q3', 'Q4'
    transactions: Transaction[] = []
  ): Promise<GSTReturn> {
    console.log('[GSTComplianceService] Generating GSTR-1:', {
      organizationId,
      period: `${quarter}-${year}`,
    });

    // Filter revenue transactions
    const gstTransactions = transactions
      .filter(
        (t) =>
          t.organizationId === organizationId &&
          t.isIncome &&
          t.status === 'APPROVED'
      )
      .map((t) => ({
        transactionId: t.id,
        taxableAmount: t.taxableAmount || t.amount,
        gstRate: (t.gstRate || 18) as 5 | 12 | 18 | 28,
        gstAmount: t.gstAmount || 0,
        type: 'OUTPUT',
        date: t.date,
      }));

    const outputTax = gstTransactions.reduce((sum, t) => sum + t.gstAmount, 0);

    const return_: GSTReturn = {
      period: `${quarter}-${year}`,
      organizationId,
      inputTax: 0, // Not applicable for GSTR-1
      outputTax,
      netGSTPay: outputTax,
      filingDeadline: this.getGSTDeadline(year, quarter, 'file'),
      paymentDeadline: this.getGSTDeadline(year, quarter, 'pay'),
      status: 'OPEN',
    };

    return return_;
  }

  /**
   * Generate GSTR-2 (B2B Purchases Report)
   * Returns all incoming supplies from registered dealers
   */
  async generateGSTR2(
    organizationId: string,
    year: number,
    quarter: string,
    transactions: Transaction[] = []
  ): Promise<GSTReturn> {
    console.log('[GSTComplianceService] Generating GSTR-2:', {
      organizationId,
      period: `${quarter}-${year}`,
    });

    // Filter expense transactions
    const gstTransactions = transactions
      .filter(
        (t) =>
          t.organizationId === organizationId &&
          !t.isIncome &&
          t.status === 'APPROVED'
      )
      .map((t) => ({
        transactionId: t.id,
        taxableAmount: t.taxableAmount || t.amount,
        gstRate: (t.gstRate || 18) as 5 | 12 | 18 | 28,
        gstAmount: t.gstAmount || 0,
        type: 'INPUT',
        date: t.date,
      }));

    const inputTax = gstTransactions.reduce((sum, t) => sum + t.gstAmount, 0);

    const return_: GSTReturn = {
      period: `${quarter}-${year}`,
      organizationId,
      inputTax,
      outputTax: 0, // Not applicable for GSTR-2
      netGSTPay: -inputTax, // Negative means credit
      filingDeadline: this.getGSTDeadline(year, quarter, 'file'),
      paymentDeadline: this.getGSTDeadline(year, quarter, 'pay'),
      status: 'OPEN',
    };

    return return_;
  }

  /**
   * Generate GSTR-3B (Quarterly Summary)
   * Combines GSTR-1 and GSTR-2, calculates net GST
   */
  async generateGSTR3B(
    organizationId: string,
    year: number,
    quarter: string,
    transactions: Transaction[] = []
  ): Promise<GSTReturn> {
    console.log('[GSTComplianceService] Generating GSTR-3B:', {
      organizationId,
      period: `${quarter}-${year}`,
    });

    // Get GSTR-1 (output tax from sales)
    const gstr1 = await this.generateGSTR1(organizationId, year, quarter, transactions);

    // Get GSTR-2 (input tax from purchases)
    const gstr2 = await this.generateGSTR2(organizationId, year, quarter, transactions);

    // Calculate net GST
    const netGSTPay = gstr1.outputTax - gstr2.inputTax;

    const return_: GSTReturn = {
      period: `${quarter}-${year}`,
      organizationId,
      inputTax: gstr2.inputTax,
      outputTax: gstr1.outputTax,
      netGSTPay: Math.max(0, netGSTPay), // If negative, no payment due
      filingDeadline: this.getGSTDeadline(year, quarter, 'file'),
      paymentDeadline: this.getGSTDeadline(year, quarter, 'pay'),
      status: 'OPEN',
    };

    console.log('[GSTComplianceService] GSTR-3B Summary:', {
      outputTax: gstr1.outputTax,
      inputTax: gstr2.inputTax,
      netDue: netGSTPay,
    });

    return return_;
  }

  /**
   * Get GST filing and payment deadlines
   */
  getGSTDeadlines(year: number): Record<string, { fileBy: Date; payBy: Date }> {
    const deadlines: Record<string, { fileBy: Date; payBy: Date }> = {};

    for (const [quarter, dates] of Object.entries(this.gstFilingSchedule)) {
      const month = this.getQuarterEndMonth(quarter, year);
      const fileDate = new Date(year, month, dates.fileBy);
      const payDate = new Date(year, month, dates.payBy);

      deadlines[`${quarter}-${year}`] = {
        fileBy: fileDate,
        payBy: payDate,
      };
    }

    return deadlines;
  }

  /**
   * Track GST payment status
   */
  async trackGSTPayments(
    organizationId: string,
    quarter: string,
    year: number,
    paidAmount: number,
    paidDate: Date
  ): Promise<{ quarter: string; paidAmount: number; status: string }> {
    console.log('[GSTComplianceService] GST Payment Recorded:', {
      organizationId,
      period: `${quarter}-${year}`,
      amount: paidAmount,
      date: paidDate,
    });

    return {
      quarter: `${quarter}-${year}`,
      paidAmount,
      status: 'PAID',
    };
  }

  /**
   * Get GST rate examples for user reference
   */
  getGSTRateExamples(): GSTRates {
    return this.gstRates;
  }

  /**
   * Validate GST compliance
   * Checks if all transactions have proper GST classification
   */
  async validateGSTCompliance(
    organizationId: string,
    transactions: Transaction[] = []
  ): Promise<{
    compliant: boolean;
    unclassified: Transaction[];
    errors: string[];
  }> {
    const orgTransactions = transactions.filter(
      (t) => t.organizationId === organizationId && t.status === 'APPROVED'
    );

    const unclassified = orgTransactions.filter((t) => !t.gstRate);
    const errors: string[] = [];

    if (unclassified.length > 0) {
      errors.push(
        `${unclassified.length} transactions missing GST rate classification`
      );
    }

    // Check for negative amounts with GST
    const negativeWithGst = orgTransactions.filter(
      (t) => t.amount < 0 && t.gstRate
    );
    if (negativeWithGst.length > 0) {
      errors.push(`${negativeWithGst.length} credit notes need reverse GST handling`);
    }

    const compliant = errors.length === 0 && unclassified.length === 0;

    return {
      compliant,
      unclassified,
      errors,
    };
  }

  /**
   * Helper: Get quarter end month
   */
  private getQuarterEndMonth(quarter: string, year: number): number {
    const quarterMonths: Record<string, number> = {
      'Q1': 3,  // March
      'Q2': 6,  // June
      'Q3': 9,  // September
      'Q4': 12, // December
    };
    return quarterMonths[quarter] || 3;
  }

  /**
   * Helper: Get GST deadline
   */
  private getGSTDeadline(
    year: number,
    quarter: string,
    type: 'file' | 'pay'
  ): Date {
    const endMonth = this.getQuarterEndMonth(quarter, year);
    const nextMonth = endMonth < 12 ? endMonth + 1 : 0;
    const nextYear = endMonth < 12 ? year : year + 1;

    const schedule = this.gstFilingSchedule[quarter];
    const day = type === 'file' ? schedule.fileBy : schedule.payBy;

    return new Date(nextYear, nextMonth, day);
  }
}

// Export singleton instance
export const gstComplianceService = new GSTComplianceService();
