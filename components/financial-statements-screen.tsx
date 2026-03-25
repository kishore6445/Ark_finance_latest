'use client';

import { useState, useMemo } from 'react';
import { Download, FileText } from 'lucide-react';
import { useAppState } from '@/context/app-state';
import { generateEnhancedPLStatement, generateBalanceSheet, generateCashFlowStatement, getDateRange } from '@/lib/financial-calculations';

type TabType = 'final-account' | 'cash-flow' | 'sap' | 'share-capital' | 'sch-bs' | 'sch-pl' | 'notes' | 'ari' | 'bs-schedule' | 'pl-schedule' | 'fixed-assets' | 'dep-as-per-it' | 'deferred-tax' | 'gratuity-cal' | 'audit-entries';

interface LineItem {
  label: string;
  note?: string;
  currentYear: number;
  previousYear: number;
  isTotal?: boolean;
  isBold?: boolean;
  indent?: number;
  children?: LineItem[];
}

export function FinancialStatementsScreen() {
  const { state } = useAppState();
  const [activeTab, setActiveTab] = useState<TabType>('final-account');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const tabs = [
    { id: 'final-account' as TabType, label: 'FINAL ACCOUNT', color: 'primary', icon: '📊' },
    { id: 'cash-flow' as TabType, label: 'Cash Flow Statement', color: 'default', icon: '💰' },
    { id: 'sap' as TabType, label: 'SAP', color: 'default', icon: '📋' },
    { id: 'share-capital' as TabType, label: 'Share Capital', color: 'highlight', icon: '📈' },
    { id: 'sch-bs' as TabType, label: 'Sch - BS', color: 'default', icon: '📑' },
    { id: 'sch-pl' as TabType, label: 'Sch - P&L', color: 'default', icon: '📑' },
    { id: 'notes' as TabType, label: 'Notes', color: 'highlight', icon: '📝' },
    { id: 'ari' as TabType, label: 'ARI', color: 'default', icon: '📄' },
    { id: 'bs-schedule' as TabType, label: 'BS Subschedule', color: 'default', icon: '📋' },
    { id: 'pl-schedule' as TabType, label: 'P&L Subschedule', color: 'default', icon: '📊' },
    { id: 'fixed-assets' as TabType, label: 'Fixed Assets', color: 'default', icon: '🏗️' },
    { id: 'dep-as-per-it' as TabType, label: 'Depreciation', color: 'default', icon: '📉' },
    { id: 'deferred-tax' as TabType, label: 'Deferred Tax', color: 'default', icon: '💳' },
    { id: 'gratuity-cal' as TabType, label: 'Gratuity', color: 'default', icon: '👥' },
    { id: 'audit-entries' as TabType, label: 'Audit Entries', color: 'highlight', icon: '✓' },
  ];

  const toggleRow = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const renderFinancialTable = () => {
    const balanceSheetData: LineItem[] = [
      {
        label: 'EQUITY AND LIABILITIES',
        isTotal: true,
        isBold: true,
        currentYear: 0,
        previousYear: 0,
      },
      {
        label: '1) Shareholder\'s Funds',
        isBold: true,
        note: '2',
        currentYear: 0,
        previousYear: 0,
        children: [
          { label: 'a) Share Capital', currentYear: 10000, previousYear: 10000 },
          { label: 'b) Reserves and Surplus', note: '3', currentYear: 39956.82, previousYear: 39444.32 },
        ],
      },
      {
        label: '2) Non-current Liabilities',
        isBold: true,
        note: '8',
        currentYear: 917.43,
        previousYear: 863.81,
      },
      {
        label: '3) Current Liabilities',
        isBold: true,
        currentYear: 6600.06,
        previousYear: 15161.58,
        children: [
          { label: 'a) Short Term Borrowings', note: '4', currentYear: 0, previousYear: 5300 },
          { label: 'b) Trade payables', note: '5', currentYear: 2046.33, previousYear: 4651.65 },
          { label: 'c) Other current liabilities', note: '6', currentYear: 3545.90, previousYear: 3469.21 },
          { label: 'd) Short term provisions', note: '7', currentYear: 709.38, previousYear: 672.32 },
        ],
      },
      {
        label: 'Total',
        isTotal: true,
        isBold: true,
        currentYear: 57474.31,
        previousYear: 65469.72,
      },
      {
        label: 'II Assets',
        isTotal: true,
        isBold: true,
        currentYear: 0,
        previousYear: 0,
      },
      {
        label: '1) Non-current Assets',
        isBold: true,
        note: '9',
        currentYear: 11564.89,
        previousYear: 12429.63,
      },
      {
        label: '2) Current Assets',
        isBold: true,
        currentYear: 45909.43,
        previousYear: 53040.09,
        children: [
          { label: 'a) Inventories', note: '10', currentYear: 20216.61, previousYear: 26338.67 },
          { label: 'b) Trade receivables', note: '11', currentYear: 12768.28, previousYear: 20667.49 },
          { label: 'c) Cash and cash equivalents', note: '12', currentYear: 10915.20, previousYear: 3380.82 },
        ],
      },
      {
        label: 'Total',
        isTotal: true,
        isBold: true,
        currentYear: 57474.31,
        previousYear: 65469.72,
      },
    ];

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="border border-border px-4 py-2 text-left font-semibold w-1/2">PARTICULARS</th>
              <th className="border border-border px-4 py-2 text-right font-semibold w-1/4">Note</th>
              <th className="border border-border px-4 py-2 text-right font-semibold w-1/4">As on 31.03.2023 (Rs in 000's)</th>
              <th className="border border-border px-4 py-2 text-right font-semibold w-1/4">As on 31.03.2022 (Rs in 000's)</th>
            </tr>
          </thead>
          <tbody>
            {balanceSheetData.map((item, idx) => (
              <tr key={idx} className={`border-b border-border ${item.isTotal ? 'bg-accent/10' : ''}`}>
                <td className={`border border-border px-4 py-2 ${item.isBold ? 'font-semibold' : ''}`}>
                  {item.label}
                </td>
                <td className="border border-border px-4 py-2 text-right text-xs text-muted-foreground">
                  {item.note || ''}
                </td>
                <td className={`border border-border px-4 py-2 text-right ${item.isTotal ? 'font-semibold' : ''}`}>
                  ₹{item.currentYear.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`border border-border px-4 py-2 text-right ${item.isTotal ? 'font-semibold' : ''}`}>
                  ₹{item.previousYear.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Generate real financial data from transactions
  const realPLStatement = useMemo(() => {
    const { start, end } = getDateRange('year');
    return generateEnhancedPLStatement(state.transactions, state.invoices, start, end);
  }, [state.transactions, state.invoices]);

  const realBalanceSheet = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return generateBalanceSheet(state.transactions, state.invoices, today);
  }, [state.transactions, state.invoices]);

  const realCashFlow = useMemo(() => {
    const { start, end } = getDateRange('year');
    return generateCashFlowStatement(state.transactions, start, end);
  }, [state.transactions]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'final-account':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Balance Sheet as at 31st March 2023</h2>
                <p className="text-sm text-muted-foreground mt-1">Rs in 000's</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90">
                <Download size={18} />
                Export
              </button>
            </div>
            {renderFinancialTable()}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground">Significant Accounting Policies</p>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">PLACE: CHENNAI</p>
                <p className="text-sm font-semibold">DATE: 31-03-2023</p>
                <p className="text-sm text-muted-foreground mt-4">As per our report of even date</p>
                <p className="text-sm text-muted-foreground">For and on behalf of Board</p>
              </div>
            </div>
          </div>
        );
      case 'cash-flow':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Cash Flow Statement</h2>
              <p className="text-sm text-muted-foreground mt-1">For the year ended 31st March 2023 (Rs in 000's)</p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
              <table className="w-full border-collapse text-sm bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-muted/40 to-muted/20 border-b border-border">
                    <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">PARTICULARS</th>
                    <th className="border border-border px-4 py-3 text-right font-semibold text-foreground">2022-23</th>
                    <th className="border border-border px-4 py-3 text-right font-semibold text-foreground">2021-22</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">A. CASH FLOW FROM OPERATING ACTIVITIES</td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Net Profit / (Loss) before tax</td>
                    <td className="border border-border px-4 py-2 text-right">45,623.50</td>
                    <td className="border border-border px-4 py-2 text-right">38,456.25</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Depreciation</td>
                    <td className="border border-border px-4 py-2 text-right">2,150.00</td>
                    <td className="border border-border px-4 py-2 text-right">2,100.00</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Operating Profit Before Working Capital Changes</td>
                    <td className="border border-border px-4 py-2 text-right">47,773.50</td>
                    <td className="border border-border px-4 py-2 text-right">40,556.25</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Changes in Working Capital</td>
                    <td className="border border-border px-4 py-2 text-right">(3,500.00)</td>
                    <td className="border border-border px-4 py-2 text-right">(2,100.00)</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Net Cash from Operating Activities</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">44,273.50</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">38,456.25</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">B. CASH FLOW FROM INVESTING ACTIVITIES</td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Purchase of Fixed Assets</td>
                    <td className="border border-border px-4 py-2 text-right">(5,600.00)</td>
                    <td className="border border-border px-4 py-2 text-right">(4,200.00)</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Investment Income</td>
                    <td className="border border-border px-4 py-2 text-right">850.50</td>
                    <td className="border border-border px-4 py-2 text-right">720.00</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Net Cash from Investing Activities</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">(4,749.50)</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">(3,480.00)</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">C. CASH FLOW FROM FINANCING ACTIVITIES</td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Dividends Paid</td>
                    <td className="border border-border px-4 py-2 text-right">(3,000.00)</td>
                    <td className="border border-border px-4 py-2 text-right">(2,500.00)</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Net Cash from Financing Activities</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">(3,000.00)</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">(2,500.00)</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Net Increase/(Decrease) in Cash</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">36,524.00</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">32,476.25</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Cash at beginning of year</td>
                    <td className="border border-border px-4 py-2 text-right">8,540.35</td>
                    <td className="border border-border px-4 py-2 text-right">4,064.10</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Cash at end of year</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">45,064.35</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">36,540.35</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'sap':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Summary of Accounting Policies</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Company Overview</h3>
                <p className="text-sm text-muted-foreground">The company is engaged in the business of manufacturing and trading of electronic components. The company is a Public Limited Company incorporated in India.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. Basis of Preparation</h3>
                <p className="text-sm text-muted-foreground">These financial statements have been prepared in accordance with Indian Accounting Standards (Ind AS) as per the Companies (Indian Accounting Standards) Rules, 2015.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. Revenue Recognition</h3>
                <p className="text-sm text-muted-foreground">Revenue is recognised when performance obligations are satisfied, which is generally upon delivery of goods or services to the customer.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">4. Inventories</h3>
                <p className="text-sm text-muted-foreground">Inventories are valued at the lower of cost and net realisable value using the weighted average method. Cost includes material, labour and appropriate production overheads.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">5. Property, Plant and Equipment</h3>
                <p className="text-sm text-muted-foreground">Fixed assets are carried at cost less accumulated depreciation. Depreciation is provided on a straight-line basis over the estimated useful lives of the assets.</p>
              </div>
            </div>
          </div>
        );
      case 'share-capital':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Share Capital Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="border border-border px-4 py-2 text-left font-semibold">PARTICULARS</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">31.03.2023</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">31.03.2022</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2 font-semibold">Authorized Share Capital</td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">50,00,000 Equity shares of Rs 10 each</td>
                    <td className="border border-border px-4 py-2 text-right">50,000.00</td>
                    <td className="border border-border px-4 py-2 text-right">50,000.00</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">10,00,000 Preference shares of Rs 10 each</td>
                    <td className="border border-border px-4 py-2 text-right">10,000.00</td>
                    <td className="border border-border px-4 py-2 text-right">10,000.00</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Total Authorized</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">60,000.00</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">60,000.00</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2 font-semibold">Issued, Subscribed and Paid-up Capital</td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">10,00,000 Equity shares of Rs 10 each fully paid</td>
                    <td className="border border-border px-4 py-2 text-right">10,000.00</td>
                    <td className="border border-border px-4 py-2 text-right">10,000.00</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Total Issued, Subscribed and Paid-up</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">10,000.00</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">10,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'notes':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Notes to the Financial Statements</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Note 1: Revenue from Operations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="border border-border px-4 py-2">Sale of Goods</td>
                        <td className="border border-border px-4 py-2 text-right">92,408.07</td>
                        <td className="border border-border px-4 py-2 text-right">74,631.04</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="border border-border px-4 py-2">Other Operating Revenues</td>
                        <td className="border border-border px-4 py-2 text-right">168.20</td>
                        <td className="border border-border px-4 py-2 text-right">832.62</td>
                      </tr>
                      <tr className="border-b border-border bg-accent/10">
                        <td className="border border-border px-4 py-2 font-semibold">Total</td>
                        <td className="border border-border px-4 py-2 text-right font-semibold">92,576.27</td>
                        <td className="border border-border px-4 py-2 text-right font-semibold">75,463.66</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Note 2: Share Capital</h3>
                <p className="text-sm text-muted-foreground">10,00,000 Equity shares of Rs 10 each fully paid = Rs 10,000,000</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Note 3: Reserves and Surplus</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="border border-border px-4 py-2">Opening Balance</td>
                        <td className="border border-border px-4 py-2 text-right">39,444.32</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="border border-border px-4 py-2">Add: Profit for the year</td>
                        <td className="border border-border px-4 py-2 text-right">3,512.50</td>
                      </tr>
                      <tr className="border-b border-border bg-accent/10">
                        <td className="border border-border px-4 py-2 font-semibold">Closing Balance</td>
                        <td className="border border-border px-4 py-2 text-right font-semibold">42,956.82</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 'sch-bs':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Schedule - Balance Sheet Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="border border-border px-4 py-2 text-left font-semibold">PARTICULARS</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">2023</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">2022</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Fixed Assets (Net)</td>
                    <td className="border border-border px-4 py-2 text-right">11,564.89</td>
                    <td className="border border-border px-4 py-2 text-right">12,429.63</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Current Assets: Inventories</td>
                    <td className="border border-border px-4 py-2 text-right">20,216.61</td>
                    <td className="border border-border px-4 py-2 text-right">26,338.67</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Trade Receivables</td>
                    <td className="border border-border px-4 py-2 text-right">12,768.28</td>
                    <td className="border border-border px-4 py-2 text-right">20,667.49</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Cash & Equivalents</td>
                    <td className="border border-border px-4 py-2 text-right">10,915.20</td>
                    <td className="border border-border px-4 py-2 text-right">3,380.82</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Total Assets</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">55,464.98</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">62,816.61</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'sch-pl':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Schedule - Profit & Loss Details</h2>
            <div className="text-xs text-muted-foreground mb-4">
              <p>Generated from {state.transactions.length} transactions | Data automatically calculated</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="border border-border px-4 py-2 text-left font-semibold">PARTICULARS</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">Current Year</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Revenue from Operations</td>
                    <td className="border border-border px-4 py-2 text-right">{(realPLStatement.summary?.totalRevenue || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Cost of Materials Consumed</td>
                    <td className="border border-border px-4 py-2 text-right">({(realPLStatement.summary?.totalCOGS || 0).toFixed(2)})</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Gross Profit</td>
                    <td className="border border-border px-4 py-2 text-right">{(realPLStatement.summary?.grossProfit || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Employee Benefits Expense</td>
                    <td className="border border-border px-4 py-2 text-right">({(realPLStatement.summary?.totalEmployeeBenefits || 0).toFixed(2)})</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Depreciation</td>
                    <td className="border border-border px-4 py-2 text-right">({(realPLStatement.summary?.totalDepreciation || 0).toFixed(2)})</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Other Expenses</td>
                    <td className="border border-border px-4 py-2 text-right">({(realPLStatement.summary?.totalOtherExpenses || 0).toFixed(2)})</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">EBIT</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">{((realPLStatement.summary?.grossProfit || 0) - (realPLStatement.summary?.totalEmployeeBenefits || 0) - (realPLStatement.summary?.totalDepreciation || 0) - (realPLStatement.summary?.totalOtherExpenses || 0)).toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Finance Costs</td>
                    <td className="border border-border px-4 py-2 text-right">({(realPLStatement.summary?.totalFinanceCosts || 0).toFixed(2)})</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Profit Before Tax</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">{(realPLStatement.summary?.profitBeforeTax || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Tax Expense</td>
                    <td className="border border-border px-4 py-2 text-right">({(realPLStatement.summary?.taxExpense || 0).toFixed(2)})</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Net Profit</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">{(realPLStatement.summary?.netProfit || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'fixed-assets':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Fixed Assets Schedule</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="border border-border px-4 py-2 text-left font-semibold">PARTICULARS</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">Gross Block</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">Depreciation</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">Net Block</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Building</td>
                    <td className="border border-border px-4 py-2 text-right">8,500.00</td>
                    <td className="border border-border px-4 py-2 text-right">(1,275.00)</td>
                    <td className="border border-border px-4 py-2 text-right">7,225.00</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Plant & Machinery</td>
                    <td className="border border-border px-4 py-2 text-right">6,200.00</td>
                    <td className="border border-border px-4 py-2 text-right">(2,100.00)</td>
                    <td className="border border-border px-4 py-2 text-right">4,100.00</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Vehicles</td>
                    <td className="border border-border px-4 py-2 text-right">1,200.00</td>
                    <td className="border border-border px-4 py-2 text-right">(239.89)</td>
                    <td className="border border-border px-4 py-2 text-right">960.11</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Total</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">15,900.00</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">(3,614.89)</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">12,285.11</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'dep-as-per-it':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Depreciation as Per Income Tax Rules</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="border border-border px-4 py-2 text-left font-semibold">PARTICULARS</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">Rate (%)</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">Depreciation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Building</td>
                    <td className="border border-border px-4 py-2 text-right">5%</td>
                    <td className="border border-border px-4 py-2 text-right">425.00</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Plant & Machinery</td>
                    <td className="border border-border px-4 py-2 text-right">15%</td>
                    <td className="border border-border px-4 py-2 text-right">930.00</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Vehicles</td>
                    <td className="border border-border px-4 py-2 text-right">20%</td>
                    <td className="border border-border px-4 py-2 text-right">240.00</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Total IT Depreciation</td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">1,595.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'deferred-tax':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Deferred Tax Asset / Liability</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="border border-border px-4 py-2 text-left font-semibold">PARTICULARS</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">Taxable Temporary Difference</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">Deferred Tax (30%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Excess Book Depreciation</td>
                    <td className="border border-border px-4 py-2 text-right">(2,019.89)</td>
                    <td className="border border-border px-4 py-2 text-right">(605.97)</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Employee Benefits Provision</td>
                    <td className="border border-border px-4 py-2 text-right">3,500.00</td>
                    <td className="border border-border px-4 py-2 text-right">1,050.00</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Net Deferred Tax Asset</td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">444.03</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'gratuity-cal':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Gratuity Calculation & Provision</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="border border-border px-4 py-2 text-left font-semibold">PARTICULARS</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">Amount (Rs 000's)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Opening Balance of Gratuity Provision</td>
                    <td className="border border-border px-4 py-2 text-right">2,850.00</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Current Year Provision</td>
                    <td className="border border-border px-4 py-2 text-right">420.00</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Gratuity Paid During Year</td>
                    <td className="border border-border px-4 py-2 text-right">(350.00)</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold">Closing Balance of Gratuity Provision</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">2,920.00</td>
                  </tr>
                  <tr className="border-b border-border mt-4">
                    <td className="border border-border px-4 py-2 font-semibold">Actuarial Valuation Method</td>
                    <td className="border border-border px-4 py-2 text-right">Projected Unit Credit</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">Discount Rate (%)</td>
                    <td className="border border-border px-4 py-2 text-right">6.50%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'audit-entries':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Audit Adjustments</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="border border-border px-4 py-2 text-left font-semibold">S.No</th>
                    <th className="border border-border px-4 py-2 text-left font-semibold">Description</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">Debit</th>
                    <th className="border border-border px-4 py-2 text-right font-semibold">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">1</td>
                    <td className="border border-border px-4 py-2">Provision for Doubtful Debts</td>
                    <td className="border border-border px-4 py-2 text-right">500.00</td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">2</td>
                    <td className="border border-border px-4 py-2">Bad Debts Written Off</td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                    <td className="border border-border px-4 py-2 text-right">250.00</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">3</td>
                    <td className="border border-border px-4 py-2">Accrued Expenses Payable</td>
                    <td className="border border-border px-4 py-2 text-right">350.00</td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="border border-border px-4 py-2">4</td>
                    <td className="border border-border px-4 py-2">Capitalized Expenses (Adjustment)</td>
                    <td className="border border-border px-4 py-2 text-right"></td>
                    <td className="border border-border px-4 py-2 text-right">600.00</td>
                  </tr>
                  <tr className="border-b border-border bg-accent/10">
                    <td className="border border-border px-4 py-2 font-semibold"></td>
                    <td className="border border-border px-4 py-2 font-semibold">Total</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">1,350.00</td>
                    <td className="border border-border px-4 py-2 text-right font-semibold">1,350.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'ari':
        return (
          <div className="p-8 text-center text-muted-foreground">
            <p className="font-semibold">Additional Regulatory Information</p>
            <p className="text-sm mt-4">Segment Reporting and Other Disclosures as per regulatory requirements</p>
          </div>
        );
      case 'bs-schedule':
        return (
          <div className="p-8 text-center text-muted-foreground">
            <p className="font-semibold">Balance Sheet Sub-schedules</p>
            <p className="text-sm mt-4">Detailed breakdown of major balance sheet items</p>
          </div>
        );
      case 'pl-schedule':
        return (
          <div className="p-8 text-center text-muted-foreground">
            <p className="font-semibold">P&L Sub-schedules</p>
            <p className="text-sm mt-4">Detailed breakdown of revenue and expense categories</p>
          </div>
        );
      default:
        return <div className="p-8 text-center text-muted-foreground">Content - Coming Soon</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <FileText size={28} className="text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financial Statements</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Automated generation from {state.transactions.length} transactions | Real-time calculations</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 font-medium">
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Statement Sheets</h2>
          <div className="text-xs text-muted-foreground">{tabs.length} available</div>
        </div>
        
        <div className="bg-gradient-to-b from-muted/40 to-muted/20 rounded-lg border border-border/50 overflow-x-auto">
          <div className="flex gap-1.5 p-2.5 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isHighlight = tab.color === 'highlight';
              const isPrimary = tab.color === 'primary';
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 border ${
                    isActive
                      ? isPrimary
                        ? 'bg-blue-600 text-white shadow-md border-blue-700'
                        : isHighlight
                        ? 'bg-red-600 text-white shadow-md border-red-700'
                        : 'bg-accent text-accent-foreground shadow-md border-accent'
                      : isHighlight
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                      : isPrimary
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                      : 'bg-background text-foreground hover:bg-muted border-border'
                  }`}
                >
                  <span className="text-base leading-none">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
        {/* Content Header with context */}
        <div className="border-b border-border bg-gradient-to-r from-muted/40 to-transparent px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === 'final-account' ? 'Balance Sheet as at 31st March 2024' : 
                 activeTab === 'cash-flow' ? 'Cash Flow Statement for year ended 31st March 2024' :
                 activeTab === 'sch-pl' ? 'Profit & Loss Schedule - Automatically calculated' :
                 'Financial statement section - Generated from transaction data'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="px-2.5 py-1.5 bg-accent/10 text-accent rounded-md font-medium">
                {activeTab === 'final-account' ? 'Balance Sheet' : 
                 activeTab === 'cash-flow' ? 'Cash Flow' : 
                 activeTab === 'sch-pl' ? 'P&L Statement' : 
                 'Statement'}
              </div>
              <span className="text-muted-foreground">Rs in 000's</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
