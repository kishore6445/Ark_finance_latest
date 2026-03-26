import {
  ClassificationSuggestion,
  CoAClassification,
  TransactionWithClassification,
} from '@/types/business-logic.types';

/**
 * Auto-Classification Engine
 * Automatically classifies transactions to Chart of Accounts with confidence scoring
 */

export interface CoAMapping {
  code: string;
  name: string;
  type: 'Revenue' | 'Expense' | 'Asset' | 'Liability';
  keywords: string[];
  examples: string[];
}

export class AutoClassificationService {
  private chartOfAccounts: CoAMapping[] = [
    // Revenue Accounts
    {
      code: '1010',
      name: 'Sale of Goods',
      type: 'Revenue',
      keywords: ['sale', 'sold', 'product', 'goods', 'revenue', 'sales'],
      examples: ['Product sale to ABC Corp', 'Goods sold', 'Revenue from sales'],
    },
    {
      code: '1020',
      name: 'Service Revenue',
      type: 'Revenue',
      keywords: ['service', 'consulting', 'professional', 'fees', 'service charge'],
      examples: ['Consulting fees', 'Service revenue', 'Professional services'],
    },
    {
      code: '1030',
      name: 'Rental Income',
      type: 'Revenue',
      keywords: ['rent', 'lease', 'rental'],
      examples: ['Rent received', 'Lease payment', 'Rental income'],
    },
    {
      code: '1040',
      name: 'Interest Income',
      type: 'Revenue',
      keywords: ['interest', 'dividend'],
      examples: ['Interest on deposits', 'Dividend received'],
    },

    // Expense Accounts
    {
      code: '2010',
      name: 'Cost of Goods Sold',
      type: 'Expense',
      keywords: ['cogs', 'cost of goods', 'raw materials', 'inventory', 'materials'],
      examples: ['Raw materials purchased', 'Inventory', 'COGS'],
    },
    {
      code: '2020',
      name: 'Rent Expense',
      type: 'Expense',
      keywords: ['rent', 'lease', 'office rent', 'shop rent'],
      examples: ['Office rent', 'Shop lease', 'Rent paid'],
    },
    {
      code: '2030',
      name: 'Salaries & Wages',
      type: 'Expense',
      keywords: ['salary', 'wage', 'payroll', 'compensation', 'employee'],
      examples: ['Employee salary', 'Payroll', 'Monthly wages'],
    },
    {
      code: '2040',
      name: 'Utilities',
      type: 'Expense',
      keywords: ['electricity', 'water', 'internet', 'phone', 'utilities', 'utility'],
      examples: ['Electricity bill', 'Internet charges', 'Water bill'],
    },
    {
      code: '2050',
      name: 'Advertising & Marketing',
      type: 'Expense',
      keywords: ['advertising', 'marketing', 'promotion', 'ad', 'ads'],
      examples: ['Google Ads', 'Marketing campaign', 'Social media ads'],
    },
    {
      code: '2060',
      name: 'Travel & Transportation',
      type: 'Expense',
      keywords: ['travel', 'transport', 'taxi', 'flight', 'hotel', 'petrol'],
      examples: ['Flight ticket', 'Hotel accommodation', 'Taxi fare'],
    },
    {
      code: '2070',
      name: 'Office Supplies',
      type: 'Expense',
      keywords: ['office', 'supplies', 'stationery', 'paper', 'ink'],
      examples: ['Office stationery', 'Paper supplies', 'Printer ink'],
    },
    {
      code: '2080',
      name: 'Professional Services',
      type: 'Expense',
      keywords: [
        'professional',
        'consultant',
        'accountant',
        'lawyer',
        'audit',
        'legal',
      ],
      examples: ['Audit fees', 'Legal services', 'Consultant fees'],
    },
    {
      code: '2090',
      name: 'Insurance',
      type: 'Expense',
      keywords: ['insurance', 'premium', 'policy'],
      examples: ['Health insurance', 'General insurance', 'Premium paid'],
    },
    {
      code: '2100',
      name: 'Depreciation',
      type: 'Expense',
      keywords: ['depreciation', 'amortization'],
      examples: ['Depreciation expense', 'Equipment amortization'],
    },
    {
      code: '2110',
      name: 'Repairs & Maintenance',
      type: 'Expense',
      keywords: ['repair', 'maintenance', 'fix', 'service'],
      examples: ['Equipment repair', 'Maintenance service', 'Building repair'],
    },

    // Asset Accounts
    {
      code: '3010',
      name: 'Cash',
      type: 'Asset',
      keywords: ['cash', 'petty cash', 'cash received'],
      examples: ['Cash on hand', 'Petty cash'],
    },
    {
      code: '3020',
      name: 'Bank Account',
      type: 'Asset',
      keywords: ['bank', 'account', 'deposit', 'withdrawal'],
      examples: ['Bank deposit', 'Account balance'],
    },
    {
      code: '3030',
      name: 'Accounts Receivable',
      type: 'Asset',
      keywords: ['receivable', 'customer', 'owe', 'due from'],
      examples: ['Customer invoice', 'Amount due from clients'],
    },
    {
      code: '3040',
      name: 'Inventory',
      type: 'Asset',
      keywords: ['inventory', 'stock', 'goods', 'warehouse'],
      examples: ['Stock on hand', 'Inventory purchased'],
    },
    {
      code: '3050',
      name: 'Equipment',
      type: 'Asset',
      keywords: ['equipment', 'machinery', 'computer', 'furniture', 'office'],
      examples: ['Computer purchase', 'Office furniture', 'Equipment bought'],
    },
    {
      code: '3060',
      name: 'Property',
      type: 'Asset',
      keywords: ['property', 'building', 'land', 'real estate'],
      examples: ['Land purchase', 'Office building'],
    },

    // Liability Accounts
    {
      code: '4010',
      name: 'Accounts Payable',
      type: 'Liability',
      keywords: ['payable', 'vendor', 'supplier', 'owe', 'due to'],
      examples: ['Vendor invoice', 'Supplier payment due'],
    },
    {
      code: '4020',
      name: 'Loan - Short Term',
      type: 'Liability',
      keywords: ['loan', 'short term', 'overdraft', 'credit'],
      examples: ['Bank loan', 'Overdraft facility'],
    },
    {
      code: '4030',
      name: 'Loan - Long Term',
      type: 'Liability',
      keywords: ['long term', 'mortgage', 'term loan'],
      examples: ['Mortgage loan', 'Long-term debt'],
    },
    {
      code: '4040',
      name: 'GST Payable',
      type: 'Liability',
      keywords: ['gst', 'tax payable', 'tax liability'],
      examples: ['GST payable', 'Tax due'],
    },
  ];

  private learningMap: Map<string, number> = new Map();

  /**
   * Extract keywords from transaction description
   */
  extractKeywords(description: string): string[] {
    // Clean and tokenize
    const cleaned = description.toLowerCase();

    // Split into words
    const words = cleaned.split(/[^a-z0-9]+/);

    // Remove common stop words
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'from',
      'for',
      'of',
      'is',
      'was',
      'are',
      'been',
    ]);

    const keywords = words.filter(
      (w) => w.length > 2 && !stopWords.has(w)
    );

    return keywords;
  }

  /**
   * Match keywords to Chart of Accounts
   * Returns ranked matches with confidence scores
   */
  matchToCoA(keywords: string[]): CoAMapping[] {
    const scores: Map<string, number> = new Map();

    // Score each CoA based on keyword matches
    for (const coa of this.chartOfAccounts) {
      let score = 0;

      for (const keyword of keywords) {
        if (coa.keywords.includes(keyword)) {
          score += 50; // Direct keyword match
        } else {
          // Partial match (substring)
          for (const coaKeyword of coa.keywords) {
            if (coaKeyword.includes(keyword) || keyword.includes(coaKeyword)) {
              score += 25; // Partial match
            }
          }
        }
      }

      // Add learning bias
      const learningKey = `${coa.code}_score`;
      const learnedScore = this.learningMap.get(learningKey) || 0;
      score = (score * 0.7 + learnedScore * 0.3); // 70% rules, 30% learned

      if (score > 0) {
        scores.set(coa.code, score);
      }
    }

    // Sort by score and return top matches
    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([code, score]) => {
        const coa = this.chartOfAccounts.find((c) => c.code === code);
        return { coa: coa!, score };
      });

    return sorted.map((s) => s.coa);
  }

  /**
   * Suggest classification for a transaction
   * Returns top 3 suggestions with confidence
   */
  async suggestClassification(
    description: string,
    amount?: number,
    transactionType?: string
  ): Promise<ClassificationSuggestion[]> {
    const keywords = this.extractKeywords(description);
    console.log('[AutoClassificationService] Suggesting classification:', {
      description,
      keywords,
    });

    const matches = this.matchToCoA(keywords);

    // Filter by transaction type if provided
    let filtered = matches;
    if (transactionType) {
      filtered = matches.filter((m) => m.type === transactionType);
    }

    // Return top 3 with confidence scores
    const suggestions = filtered.slice(0, 3).map((coa, index) => {
      // Confidence decreases for lower ranked suggestions
      const baseConfidence = Math.max(0, 100 - index * 20);

      // Increase confidence if keywords match well
      const keywordMatchScore = this.calculateKeywordMatchScore(keywords, coa);
      const confidence = Math.min(100, baseConfidence + keywordMatchScore);

      return {
        coaCode: coa.code,
        coaName: coa.name,
        confidence: Math.round(confidence),
        keywords,
        reason: `Matched ${coa.keywords.filter((k) => keywords.includes(k)).join(', ') || 'similar transactions'}`,
      };
    });

    return suggestions;
  }

  /**
   * Accept a classification suggestion
   * Saves the decision for learning
   */
  async acceptSuggestion(
    transactionId: string,
    coaCode: string,
    description: string,
    manualOverride: boolean = false
  ): Promise<CoAClassification> {
    const coa = this.chartOfAccounts.find((c) => c.code === coaCode);

    if (!coa) {
      throw new Error(`Invalid CoA code: ${coaCode}`);
    }

    const classification: CoAClassification = {
      transactionId,
      coaCode,
      coaName: coa.name,
      confidence: 95,
      manualOverride,
      acceptedAt: new Date(),
      learnKey: `${transactionId}_${coaCode}`,
    };

    // Learn from this decision
    await this.learnFromCorrection(description, coaCode);

    console.log('[AutoClassificationService] Classification accepted:', {
      transactionId,
      coaCode,
      coa: coa.name,
      override: manualOverride,
    });

    return classification;
  }

  /**
   * Learn from manual corrections
   * Updates keyword mappings for future classifications
   */
  async learnFromCorrection(description: string, correctCoaCode: string): Promise<void> {
    const keywords = this.extractKeywords(description);

    // Update learning map
    for (const keyword of keywords) {
      const key = `${keyword}_${correctCoaCode}`;
      const currentScore = this.learningMap.get(key) || 0;
      this.learningMap.set(key, currentScore + 10); // Increment learning score
    }

    // Also boost the CoA score for future use
    const coaKey = `${correctCoaCode}_score`;
    const currentCoaScore = this.learningMap.get(coaKey) || 0;
    this.learningMap.set(coaKey, currentCoaScore + 5);

    console.log('[AutoClassificationService] Learned from correction:', {
      keywords,
      coaCode: correctCoaCode,
    });
  }

  /**
   * Get classification confidence score
   * Returns 0-100
   */
  async getClassificationConfidence(
    description: string,
    coaCode: string
  ): Promise<number> {
    const keywords = this.extractKeywords(description);
    const coa = this.chartOfAccounts.find((c) => c.code === coaCode);

    if (!coa) {
      return 0;
    }

    const score = this.calculateKeywordMatchScore(keywords, coa);
    return Math.min(100, score);
  }

  /**
   * Helper: Calculate keyword match score
   */
  private calculateKeywordMatchScore(keywords: string[], coa: CoAMapping): number {
    if (keywords.length === 0) return 0;

    const directMatches = keywords.filter((k) =>
      coa.keywords.includes(k)
    ).length;

    const partialMatches = keywords.filter((k) => {
      for (const coaKeyword of coa.keywords) {
        if (coaKeyword.includes(k) || k.includes(coaKeyword)) {
          return true;
        }
      }
      return false;
    }).length;

    const directScore = (directMatches / keywords.length) * 100;
    const partialScore = (partialMatches / keywords.length) * 50;

    return Math.min(100, directScore + partialScore);
  }

  /**
   * Auto-classify transaction based on confidence threshold
   * < 70% = Manual review needed
   * 70-90% = Suggest to user
   * > 90% = Auto-classify
   */
  async autoClassifyIfConfident(
    transactionId: string,
    description: string,
    transactionType: string
  ): Promise<{
    classified: boolean;
    classification?: CoAClassification;
    suggestion?: ClassificationSuggestion;
    action: 'AUTO_CLASSIFIED' | 'SUGGESTED' | 'MANUAL_REVIEW';
  }> {
    const suggestions = await this.suggestClassification(
      description,
      undefined,
      transactionType
    );

    if (suggestions.length === 0) {
      return {
        classified: false,
        action: 'MANUAL_REVIEW',
      };
    }

    const topSuggestion = suggestions[0];

    if (topSuggestion.confidence > 90) {
      // Auto-classify
      const classification = await this.acceptSuggestion(
        transactionId,
        topSuggestion.coaCode,
        description,
        false
      );

      return {
        classified: true,
        classification,
        action: 'AUTO_CLASSIFIED',
      };
    } else if (topSuggestion.confidence > 70) {
      // Suggest to user
      return {
        classified: false,
        suggestion: topSuggestion,
        action: 'SUGGESTED',
      };
    } else {
      // Manual review needed
      return {
        classified: false,
        action: 'MANUAL_REVIEW',
      };
    }
  }

  /**
   * Get all Chart of Accounts for reference
   */
  getChartOfAccounts(): CoAMapping[] {
    return this.chartOfAccounts;
  }

  /**
   * Get CoA by code
   */
  getCoAByCode(code: string): CoAMapping | undefined {
    return this.chartOfAccounts.find((c) => c.code === code);
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): {
    totalLearnings: number;
    topLearned: Array<{ pattern: string; score: number }>;
  } {
    const sorted = Array.from(this.learningMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, score]) => ({ pattern, score }));

    return {
      totalLearnings: this.learningMap.size,
      topLearned: sorted,
    };
  }
}

// Export singleton instance
export const autoClassificationService = new AutoClassificationService();
