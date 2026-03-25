export interface BreadcrumbPath {
  navId: string;
  breadcrumbs: Array<{ label: string; path?: string }>;
}

export const breadcrumbPaths: Record<string, Array<{ label: string; path?: string }>> = {
  'snapshot': [
    { label: 'Dashboard', path: 'snapshot' },
    { label: 'Snapshot' },
  ],
  'inbox': [
    { label: 'Core Operations', path: 'dashboard' },
    { label: 'Inbox' },
  ],
  'buckets': [
    { label: 'Core Operations', path: 'dashboard' },
    { label: 'Buckets' },
  ],
  'invoices': [
    { label: 'Core Operations', path: 'dashboard' },
    { label: 'Invoices' },
  ],
  'reconciliation': [
    { label: 'Cash Management', path: 'dashboard' },
    { label: 'Bank Reconciliation' },
  ],
  'bank-accounts': [
    { label: 'Cash Management', path: 'dashboard' },
    { label: 'Bank Accounts' },
  ],
  'runway': [
    { label: 'Cash Management', path: 'dashboard' },
    { label: 'Cash Runway' },
  ],
  'obligations': [
    { label: 'Compliance & Obligations', path: 'dashboard' },
    { label: 'Obligations' },
  ],
  'compliance': [
    { label: 'Compliance & Obligations', path: 'dashboard' },
    { label: 'Compliance Tasks' },
  ],
  'compliance-deadlines': [
    { label: 'Compliance & Obligations', path: 'dashboard' },
    { label: 'Compliance Deadlines' },
  ],
  'recurring': [
    { label: 'Automation', path: 'dashboard' },
    { label: 'Recurring Transactions' },
  ],
  'vendors': [
    { label: 'Automation', path: 'dashboard' },
    { label: 'Vendor Management' },
  ],
  'budgets': [
    { label: 'Analysis & Insights', path: 'dashboard' },
    { label: 'Budget Tracking' },
  ],
  'budget-management': [
    { label: 'Analysis & Insights', path: 'dashboard' },
    { label: 'Budget Management' },
  ],
  'revenue-breakdown': [
    { label: 'Reports', path: 'dashboard' },
    { label: 'Reports', path: 'reports' },
    { label: 'Revenue Breakdown' },
  ],
  'expense-breakdown': [
    { label: 'Reports', path: 'dashboard' },
    { label: 'Reports', path: 'reports' },
    { label: 'Expense Breakdown' },
  ],
  'cash-flow-projection': [
    { label: 'Cash Management', path: 'dashboard' },
    { label: 'Cash Flow Projection' },
  ],
  'financial-statements': [
    { label: 'Reports', path: 'dashboard' },
    { label: 'Reports', path: 'reports' },
    { label: 'Financial Statements' },
  ],
  'employees': [
    { label: 'Payroll', path: 'dashboard' },
    { label: 'Employees' },
  ],
  'salary-structure': [
    { label: 'Payroll', path: 'dashboard' },
    { label: 'Salary Structure' },
  ],
  'payroll-processing': [
    { label: 'Payroll', path: 'dashboard' },
    { label: 'Payroll Processing' },
  ],
  'payroll-register': [
    { label: 'Payroll', path: 'dashboard' },
    { label: 'Payroll Register' },
  ],
  'salary-slip': [
    { label: 'Payroll', path: 'dashboard' },
    { label: 'Salary Slips' },
  ],
  'payroll-settings': [
    { label: 'Payroll', path: 'dashboard' },
    { label: 'Payroll Settings' },
  ],
  'stock-master': [
    { label: 'Inventory', path: 'dashboard' },
    { label: 'Stock Master' },
  ],
  'stock-movements': [
    { label: 'Inventory', path: 'dashboard' },
    { label: 'Stock Movements' },
  ],
  'stock-valuation': [
    { label: 'Inventory', path: 'dashboard' },
    { label: 'Stock Valuation' },
  ],
  'stock-adjustments': [
    { label: 'Inventory', path: 'dashboard' },
    { label: 'Stock Adjustments' },
  ],
  'stock-reports': [
    { label: 'Inventory', path: 'dashboard' },
    { label: 'Stock Reports' },
  ],
  'approval-queue': [
    { label: 'Approvals', path: 'dashboard' },
    { label: 'Approval Queue' },
  ],
  'aging-analysis': [
    { label: 'Analysis & Insights', path: 'dashboard' },
    { label: 'Aging Analysis' },
  ],
  'reports': [
    { label: 'Analysis & Insights', path: 'dashboard' },
    { label: 'Reports' },
  ],
  'import': [
    { label: 'Core Operations', path: 'dashboard' },
    { label: 'Import Data' },
  ],
  'settings': [
    { label: 'Administration', path: 'dashboard' },
    { label: 'Settings' },
  ],
  'cfo-dashboard': [
    { label: 'CFO Tools', path: 'dashboard' },
    { label: 'CFO Dashboard' },
  ],
  'cfo-client-directory': [
    { label: 'CFO Tools', path: 'dashboard' },
    { label: 'Client Directory' },
  ],
  'weekly-reports': [
    { label: 'CFO Tools', path: 'dashboard' },
    { label: 'Weekly Reports' },
  ],
  'monthly-calls': [
    { label: 'CFO Tools', path: 'dashboard' },
    { label: 'Monthly Calls Scheduler' },
  ],
  'client-alerts': [
    { label: 'CFO Tools', path: 'dashboard' },
    { label: 'Client Alerts & Health' },
  ],
};

export function getBreadcrumbs(navId: string) {
  return breadcrumbPaths[navId] || [{ label: 'Dashboard' }];
}
