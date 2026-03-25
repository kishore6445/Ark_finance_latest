'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@/context/organization-context';
import { CreateOrganizationScreen } from '@/components/create-organization-screen';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/app-shell';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { SnapshotScreen } from '@/components/snapshot-screen';
import { SnapshotDrillDown } from '@/components/snapshot-drilldown';
import { InboxScreen } from '@/components/inbox-screen';
import { FinanceInboxScreen } from '@/components/finance-inbox-screen';
import { BucketsScreen } from '@/components/buckets-screen';
import { InvoicesScreen } from '@/components/invoices-screen';
import { BankReconciliationScreen } from '@/components/bank-reconciliation-screen';
import { CashRunwayScreen } from '@/components/cash-runway-screen';
import { ObligationsScreen } from '@/components/obligations-screen';
import { ComplianceScreen } from '@/components/compliance-screen';
import { ImportScreen } from '@/components/import-screen';
import { ReportsScreen } from '@/components/reports-screen';
import { SettingsScreen } from '@/components/settings-screen';
import { ApprovalQueueScreen } from '@/components/approval-queue-screen';
import { AgingAnalysisScreen } from '@/components/aging-analysis-screen';
import { NotificationCenter } from '@/components/notification-center';
import { RecurringTransactionsScreen } from '@/components/recurring-transactions-screen';
import { VendorManagementScreen } from '@/components/vendor-management-screen';
import { BudgetTrackingScreen } from '@/components/budget-tracking-screen';
import { RevenueBreakdownScreen } from '@/components/revenue-breakdown-screen';
import { ExpenseBreakdownScreen } from '@/components/expense-breakdown-screen';
import { CashFlowProjectionScreen } from '@/components/cash-flow-projection-screen';
import { FinancialStatementsScreen } from '@/components/financial-statements-screen';
import { BankManagementScreen } from '@/components/bank-management-screen';
import { EmployeesScreen } from '@/components/employees-screen';
import { SalaryStructureScreen } from '@/components/salary-structure-screen';
import { PayrollProcessingScreen } from '@/components/payroll-processing-screen';
import { PayrollRegisterScreen } from '@/components/payroll-register-screen';
import { SalarySlipScreen } from '@/components/salary-slip-screen';
import { PayrollSettingsScreen } from '@/components/payroll-settings-screen';
import { StockMasterScreen } from '@/components/stock-master-screen';
import { StockMovementsScreen } from '@/components/stock-movements-screen';
import { StockValuationScreen } from '@/components/stock-valuation-screen';
import { StockAdjustmentsScreen } from '@/components/stock-adjustments-screen';
import { StockReportsScreen } from '@/components/stock-reports-screen';
import { CFODashboardScreen } from '@/components/cfo-dashboard-screen';
import { ComplianceDeadlinesScreen } from '@/components/compliance-deadlines-screen';
import { WeeklyReportsScreen } from '@/components/weekly-reports-screen';
import { MonthlyCallsSchedulerScreen } from '@/components/monthly-calls-screen';
import { ClientAlertsHealthScreen } from '@/components/client-alerts-health-screen';
import { CFOClientDirectoryScreen } from '@/components/cfo-client-directory-screen';
import { CreateInvoicePage } from '@/components/create-invoice-page';
import { BucketAccountMapping } from '@/components/bucket-account-mapping';

export default function Home() {
  const { currentOrganization } = useOrganization();
  const [userRole, setUserRole] = useState<'Owner' | 'Admin' | 'Accountant' | 'Viewer' | 'CFO' | null>(null);
  const [showOrgCreation, setShowOrgCreation] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [activeNav, setActiveNav] = useState('snapshot');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadRole = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;

        if (!userId) {
          if (isMounted) {
            setUserRole('Viewer');
          }
          return;
        }

        const { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          throw new Error(error.message);
        }

        if (isMounted) {
          setUserRole((profile?.role ?? 'Viewer') as 'Owner' | 'Admin' | 'Accountant' | 'Viewer' | 'CFO');
        }
      } catch {
        if (isMounted) {
          setUserRole('Viewer');
        }
      }
    };

    void loadRole();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setShowOrgCreation(Boolean(userRole === 'Admin' && !currentOrganization));
  }, [userRole, currentOrganization]);

  // Show organization creation if no organization exists
  if (showOrgCreation) {
    return (
      <CreateOrganizationScreen
        onComplete={() => {
          setShowOrgCreation(false);
          setHasCompletedOnboarding(false);
        }}
      />
    );
  }

  const handleNavClick = (navItem: string) => {
    setActiveNav(navItem);
  };

  const pageTitle = () => {
    switch (activeNav) {
      case 'snapshot':
        return "Today's Snapshot";
      case 'inbox':
        return 'Inbox';
      case 'buckets':
        return 'Buckets';
      case 'invoices':
        return 'Invoices';
      case 'reconciliation':
        return 'Bank Reconciliation';
      case 'bank-accounts':
        return 'Bank Accounts';
      case 'runway':
        return 'Cash Runway';
      case 'obligations':
        return 'Obligations';
      case 'compliance':
        return 'Compliance';
      case 'recurring':
        return 'Recurring Transactions';
      case 'vendors':
        return 'Vendor Management';
      case 'budgets':
        return 'Budget Tracking';
      case 'revenue-breakdown':
        return 'Revenue Breakdown';
      case 'expense-breakdown':
        return 'Expense Breakdown';
      case 'cash-flow-projection':
        return 'Cash Flow Projection';
      case 'approvals':
        return 'Approval Queue';
      case 'aging':
        return 'Aging Analysis';
      case 'financial-statements':
        return 'Financial Statements';
      case 'notifications':
        return 'Notifications';
      case 'import':
        return 'Import Bank Statement';
      case 'reports':
        return 'Reports';
      case 'employees':
        return 'Employee Master';
      case 'salary-structure':
        return 'Salary Structure';
      case 'payroll-processing':
        return 'Payroll Processing';
      case 'payroll-register':
        return 'Payroll Register';
      case 'salary-slip':
        return 'Salary Slips';
      case 'payroll-settings':
        return 'Payroll Settings';
      case 'stock-master':
        return 'Stock Master';
      case 'stock-movements':
        return 'Stock Movements';
      case 'stock-valuation':
        return 'Stock Valuation';
      case 'stock-adjustments':
        return 'Stock Adjustments';
      case 'stock-reports':
        return 'Stock Reports';
      case 'cfo-dashboard':
        return 'CFO Hub Dashboard';
      case 'compliance-deadlines':
        return 'Compliance Deadlines Calendar';
      case 'weekly-reports':
        return 'Weekly Reports';
      case 'monthly-calls':
        return 'Monthly Calls Scheduler';
      case 'client-alerts':
        return 'Client Alerts & Health';
      case 'client-directory':
        return 'Client Directory';
      case 'create-invoice':
        return 'Create Invoice';
      case 'bucket-allocation':
        return 'Bucket Allocation';
      case 'settings':
        return 'Settings';
      default:
        return "Today's Snapshot";
    }
  };

  const renderScreen = () => {
    switch (activeNav) {
      case 'inbox':
        return <FinanceInboxScreen onNavigate={handleNavClick} />;
      case 'buckets':
        return <BucketsScreen />;
      case 'invoices':
        return <InvoicesScreen onNavigate={handleNavClick} />;
      case 'reconciliation':
        return <BankReconciliationScreen />;
      case 'bank-accounts':
        return <BankManagementScreen />;
      case 'runway':
        return <CashRunwayScreen />;
      case 'obligations':
        return <ObligationsScreen />;
      case 'compliance':
        return <ComplianceScreen />;
      case 'recurring':
        return <RecurringTransactionsScreen />;
      case 'vendors':
        return <VendorManagementScreen />;
      case 'budgets':
        return <BudgetTrackingScreen />;
      case 'revenue-breakdown':
        return <RevenueBreakdownScreen onNavigate={handleNavClick} />;
      case 'expense-breakdown':
        return <ExpenseBreakdownScreen onNavigate={handleNavClick} />;
      case 'cash-flow-projection':
        return <CashFlowProjectionScreen onNavigate={handleNavClick} />;
      case 'import':
        return <ImportScreen />;
      case 'approvals':
        return <ApprovalQueueScreen />;
      case 'aging':
        return <AgingAnalysisScreen />;
      case 'financial-statements':
        return <FinancialStatementsScreen />;
      case 'notifications':
        return <NotificationCenter />;
      case 'reports':
        return <ReportsScreen />;
      case 'employees':
        return <EmployeesScreen />;
      case 'salary-structure':
        return <SalaryStructureScreen />;
      case 'payroll-processing':
        return <PayrollProcessingScreen />;
      case 'payroll-register':
        return <PayrollRegisterScreen />;
      case 'salary-slip':
        return <SalarySlipScreen />;
      case 'payroll-settings':
        return <PayrollSettingsScreen />;
      case 'stock-master':
        return <StockMasterScreen />;
      case 'stock-movements':
        return <StockMovementsScreen />;
      case 'stock-valuation':
        return <StockValuationScreen />;
      case 'stock-adjustments':
        return <StockAdjustmentsScreen />;
      case 'stock-reports':
        return <StockReportsScreen />;
      case 'cfo-dashboard':
        return <CFODashboardScreen />;
      case 'compliance-deadlines':
        return <ComplianceDeadlinesScreen />;
      case 'weekly-reports':
        return <WeeklyReportsScreen />;
      case 'monthly-calls':
        return <MonthlyCallsSchedulerScreen />;
      case 'client-alerts':
        return <ClientAlertsHealthScreen />;
      case 'client-directory':
        return <CFOClientDirectoryScreen />;
      case 'create-invoice':
        return <CreateInvoicePage onBack={() => setActiveNav('invoices')} nextInvoiceNumber="INV-202403-001" />;
      case 'bucket-allocation':
        return <BucketAccountMapping />;
      case 'settings':
        return <SettingsScreen />;
      case 'snapshot':
        return <SnapshotScreen onNavigate={handleNavClick} />;
      default:
        return <SnapshotScreen onNavigate={handleNavClick} />;
    }
  };

  const renderDrillDown = () => {
    if (activeNav === 'snapshot') {
      return <SnapshotDrillDown />;
    }
    return null;
  };

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={() => setHasCompletedOnboarding(true)} />;
  }

  return (
    <AppShell activeNavItem={activeNav} pageTitle={pageTitle()} onNavChange={setActiveNav}>
      {renderScreen()}
    </AppShell>
  );
}
