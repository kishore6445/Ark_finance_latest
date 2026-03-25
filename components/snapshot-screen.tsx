'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle, 
  CheckCircle2, Eye, FileText, BarChart3, PieChart, ArrowRight, Zap, Clock, Landmark, Boxes
} from 'lucide-react';
import { useAppState } from '@/context/app-state';
import { calculateRunway, calculateHealthScore, calculateDSO } from '@/lib/calculations';

interface SnapshotScreenProps {
  onNavigate?: (screen: string) => void;
}

export function SnapshotScreen({ onNavigate }: SnapshotScreenProps) {
  const { state } = useAppState();

  // Calculate metrics from live app state
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date();
  const currentMonthKey = today.slice(0, 7);
  const todayTransactions = state.transactions.filter(t => t.date === today);
  const todayIncome = todayTransactions
    .filter(t => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = todayTransactions
    .filter(t => !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const todayNet = todayIncome - todayExpense;

  const currentMonthTransactions = state.transactions.filter(t => (t.date ?? '').startsWith(currentMonthKey));
  const monthlyRevenue = currentMonthTransactions
    .filter(t => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyBurn = currentMonthTransactions
    .filter(t => !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyNetCashFlow = monthlyRevenue - monthlyBurn;

  const cashBalance = state.bankAccounts.reduce((sum, account) => sum + Number(account.balance ?? 0), 0);
  const runway = calculateRunway(cashBalance, monthlyBurn);
  
  // Health thresholds
  const healthThresholds = {
    minRunwayMonths: 3,
    maxLoanPercentage: 10,
    minCashMonths: 2,
    maxDSODays: 45,
  };

  // Health score parameters from live data
  const monthlyLoans = currentMonthTransactions
    .filter(t => !t.isIncome && (t.accountingType === 'Liability' || t.subtype === 'Loans'))
    .reduce((sum, t) => sum + t.amount, 0);
  const unpaidRevenueAmount = state.invoices
    .filter(inv => inv.type === 'Revenue' && inv.balanceDue > 0)
    .reduce((sum, inv) => sum + inv.balanceDue, 0);
  const dso = calculateDSO(unpaidRevenueAmount, monthlyRevenue);
  
  const healthScore = calculateHealthScore(
    runway,
    monthlyLoans,
    monthlyRevenue,
    cashBalance,
    monthlyBurn,
    dso,
    healthThresholds
  );

  const getHealthStatus = (score: number) => {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Caution';
    return 'Critical';
  };

  // Alerts from live state
  const overdueInvoices = state.invoices.filter(inv => {
    const dueDate = new Date(inv.dueDate);
    return inv.balanceDue > 0 && (inv.status === 'Overdue' || dueDate < todayDate);
  }).length;
  const pendingApprovals = state.pendingApprovals.filter(a => a.status === 'pending');
  const pendingApprovalCount = pendingApprovals.length;
  const pendingApprovalAmount = pendingApprovals.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

  const pendingCompliance = state.complianceItems.filter(c => c.status !== 'Compliant');
  const nearestCompliance = pendingCompliance
    .filter(c => Boolean(c.dueDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const complianceMessage = (() => {
    if (!nearestCompliance) {
      return pendingCompliance.length > 0
        ? `${pendingCompliance.length} compliance items pending`
        : 'No upcoming compliance dues';
    }
    const dueDate = new Date(nearestCompliance.dueDate);
    const days = Math.ceil((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${nearestCompliance.name} overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
    if (days === 0) return `${nearestCompliance.name} due today`;
    if (days === 1) return `${nearestCompliance.name} due tomorrow`;
    return `${nearestCompliance.name} due in ${days} days`;
  })();

  const handleCardClick = (screenId: string) => {
    if (onNavigate) {
      onNavigate(screenId);
    }
  };

  return (
    <div className="w-full h-full overflow-auto p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* SECTION 1: CEO SUMMARY */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-lg text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900">Today your business generated ₹{todayIncome.toLocaleString('en-IN')}</span>,
                  {' '}<span className="text-slate-600">spent ₹{todayExpense.toLocaleString('en-IN')}, and currently has</span>
                  {' '}<span className="font-semibold text-green-700">₹{cashBalance.toLocaleString('en-IN')} in cash</span>
                  {' '}<span className="text-slate-600">with</span>
                  {' '}<span className="font-semibold text-slate-900">{runway.toFixed(1)} months of runway</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: CORE CEO METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Cash Position */}
          <Card className="p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Cash Position</p>
                <p className="text-4xl font-bold text-slate-900">₹{(cashBalance / 100000).toFixed(2)}L</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <p className="text-sm text-slate-600">
                Runway: <span className="font-semibold text-slate-900">{runway.toFixed(1)} months</span>
              </p>
              <p className="text-sm text-slate-600 flex items-center gap-1">
                {monthlyNetCashFlow >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={monthlyNetCashFlow >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  This month net: {monthlyNetCashFlow >= 0 ? '+' : '-'}₹{Math.abs(monthlyNetCashFlow).toLocaleString('en-IN')}
                </span>
              </p>
            </div>
          </Card>

          {/* Card 2: Net Cash Flow Today */}
          <Card className="p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Today's Cash Flow</p>
                <p className="text-4xl font-bold text-slate-900">₹{todayNet.toLocaleString('en-IN')}</p>
              </div>
              <div className={`p-3 rounded-lg ${todayNet >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                {todayNet >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Money In:</span>
                <span className="font-semibold text-green-600">+₹{todayIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Money Out:</span>
                <span className="font-semibold text-red-600">-₹{todayExpense.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </Card>

          {/* Card 3: Business Health */}
          <Card className="p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Business Health</p>
                <p className="text-4xl font-bold text-slate-900">{healthScore}/100</p>
              </div>
              <div className={`p-3 rounded-lg ${
                healthScore >= 80 ? 'bg-green-50' : 
                healthScore >= 60 ? 'bg-orange-50' : 
                'bg-red-50'
              }`}>
                <CheckCircle2 className={`w-6 h-6 ${
                  healthScore >= 80 ? 'text-green-600' : 
                  healthScore >= 60 ? 'text-orange-600' : 
                  'text-red-600'
                }`} />
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className={`text-sm font-semibold px-3 py-1 rounded inline-block ${
                healthScore >= 80 ? 'bg-green-50 text-green-700' : 
                healthScore >= 60 ? 'bg-orange-50 text-orange-700' : 
                'bg-red-50 text-red-700'
              }`}>
                {getHealthStatus(healthScore)}
              </p>
            </div>
          </Card>
        </div>

        {/* SECTION 3: ACTION CENTER */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-slate-900">Needs Attention</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Alert 1: Overdue Invoices */}
            <Card className="p-6 border border-red-200 bg-red-50 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="font-semibold text-slate-900 mb-1">Overdue Invoices</p>
              <p className="text-sm text-slate-600 mb-4">{overdueInvoices} invoices overdue</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600 border-red-300 hover:bg-red-100 text-xs"
                onClick={() => handleCardClick('invoices')}
              >
                Review →
              </Button>
            </Card>

            {/* Alert 2: Pending Approvals */}
            <Card className="p-6 border border-orange-200 bg-orange-50 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="font-semibold text-slate-900 mb-1">Pending Approvals</p>
              <p className="text-sm text-slate-600 mb-4">
                ₹{pendingApprovalAmount.toLocaleString('en-IN')} pending across {pendingApprovalCount} request{pendingApprovalCount === 1 ? '' : 's'}
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-orange-600 border-orange-300 hover:bg-orange-100 text-xs"
                onClick={() => handleCardClick('approval-queue')}
              >
                Approve →
              </Button>
            </Card>

            {/* Alert 3: Compliance Due */}
            <Card className="p-6 border border-orange-200 bg-orange-50 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="font-semibold text-slate-900 mb-1">Compliance Due</p>
              <p className="text-sm text-slate-600 mb-4">{complianceMessage}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-orange-600 border-orange-300 hover:bg-orange-100 text-xs"
                onClick={() => handleCardClick('compliance-deadlines')}
              >
                View →
              </Button>
            </Card>

            {/* Alert 4: Budget Alert */}
            <Card className="p-6 border border-yellow-200 bg-yellow-50 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="font-semibold text-slate-900 mb-1">Budget Alert</p>
              <p className="text-sm text-slate-600 mb-4">Marketing budget 85% used</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-yellow-600 border-yellow-300 hover:bg-yellow-100 text-xs"
                onClick={() => handleCardClick('budget-management')}
              >
                Review →
              </Button>
            </Card>
          </div>
        </div>

        {/* SECTION 4: BANK ACCOUNTS & BUCKET ALLOCATION */}
        <div className="space-y-4 border-t border-slate-200 pt-8">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Cash & Accounts</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bank Accounts */}
            <Card className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Bank Accounts</p>
                  <p className="text-2xl font-bold text-slate-900">{state.bankAccounts.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Landmark className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3 space-y-2">
                {state.bankAccounts.slice(0, 2).map(acc => (
                  <div key={acc.id} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">{acc.accountName}</span>
                    <span className="font-semibold text-slate-900">₹{(acc.balance / 100000).toFixed(1)}L</span>
                  </div>
                ))}
                {state.bankAccounts.length > 2 && (
                  <p className="text-xs text-slate-500 pt-2">+{state.bankAccounts.length - 2} more accounts</p>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs mt-4 w-full"
                onClick={() => handleCardClick('bank-accounts')}
              >
                Manage Accounts →
              </Button>
            </Card>

            {/* Bucket Allocations */}
            <Card className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Bucket Allocation</p>
                  <p className="text-2xl font-bold text-slate-900">{state.bankAccountMappings.length}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Boxes className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="space-y-1 text-sm">
                  {state.bankAccountMappings.slice(0, 2).map(mapping => {
                    const bucket = ['GST', 'Operating', 'Reserve', 'CapEx'][['gst', 'operating', 'reserve', 'capex'].indexOf(mapping.bucketId)] || mapping.bucketId;
                    const account = state.bankAccounts.find(a => a.id === mapping.bankAccountId);
                    return (
                      <p key={mapping.id} className="flex justify-between text-slate-600">
                        <span>{bucket}</span>
                        <span className="text-slate-900 font-medium">{mapping.allocationPercentage}%</span>
                      </p>
                    );
                  })}
                </div>
                {state.bankAccountMappings.length > 2 && (
                  <p className="text-xs text-slate-500 pt-2">+{state.bankAccountMappings.length - 2} more mappings</p>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs mt-4 w-full"
                onClick={() => handleCardClick('bucket-allocation')}
              >
                Configure →
              </Button>
            </Card>

            {/* Recent Transfers */}
            <Card className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Recent Transfers</p>
                  <p className="text-2xl font-bold text-slate-900">{state.interAccountTransfers.length}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <ArrowRight className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="space-y-2 text-sm">
                  {state.interAccountTransfers.slice(-2).reverse().map(transfer => (
                    <div key={transfer.id} className="flex justify-between">
                      <span className="text-slate-600">{transfer.description}</span>
                      <span className="font-semibold text-slate-900">₹{(transfer.amount / 1000).toFixed(0)}k</span>
                    </div>
                  ))}
                </div>
                {state.interAccountTransfers.length === 0 && (
                  <p className="text-sm text-slate-500">No transfers yet</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* SECTION 5: QUICK REPORT ACCESS */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue Breakdown */}
            <Card 
              className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCardClick('revenue-breakdown')}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <PieChart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Revenue Breakdown</p>
                  <p className="text-sm text-slate-600">By source & type</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
              </div>
            </Card>

            {/* Expense Breakdown */}
            <Card 
              className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCardClick('expense-breakdown')}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Expense Breakdown</p>
                  <p className="text-sm text-slate-600">By category</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
              </div>
            </Card>

            {/* Cash Flow Projection */}
            <Card 
              className="p-6 border border-slate-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCardClick('cash-flow-projection')}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Cash Flow Projection</p>
                  <p className="text-sm text-slate-600">30-day forecast</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
