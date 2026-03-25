'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/organization-context';
import { LayoutGrid, Mail, Boxes, FileText, BarChart3, Upload, LogOut, Settings, UserSearch as UserSwitch, ChevronDown, Shield, AlertCircle, CheckSquare, TrendingDown, Clock, ListTodo, Bell, Users, Target, Search, ChevronRight, PieChart, Landmark, DollarSign, Users2, TrendingUp, Package, ArrowRight, Calendar, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { getBreadcrumbs } from '@/lib/breadcrumb-paths';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavCategory {
  id: string;
  label: string;
  items: NavItem[];
  defaultExpanded?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
}

interface AppShellProps {
  children: React.ReactNode;
  activeNavItem?: string;
  pageTitle?: string;
  onNavChange?: (navId: string) => void;
}

export function AppShell({ children, activeNavItem = 'snapshot', pageTitle = "Today's Snapshot", onNavChange }: AppShellProps) {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [activeNav, setActiveNav] = useState(activeNavItem);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    dashboard: true,
    operations: true,
    cash: true,
    obligations: true,
    automation: true,
    payroll: true,
    inventory: true,
    analysis: true,
    approvals: true,
    admin: false,
  });

  const handleNavClick = (navId: string) => {
    setActiveNav(navId);
    onNavChange?.(navId);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      router.push('/signin');
      setIsSigningOut(false);
    }
  };

  const navCategories: NavCategory[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      items: [
        { id: 'snapshot', label: 'Snapshot', icon: LayoutGrid },
      ],
      defaultExpanded: true,
    },
    {
      id: 'operations',
      label: 'Core Operations',
      items: [
        { id: 'inbox', label: 'Inbox', icon: Mail },
        { id: 'buckets', label: 'Buckets', icon: Boxes },
        { id: 'invoices', label: 'Invoices', icon: FileText },
      ],
      defaultExpanded: true,
    },
    {
      id: 'cash',
      label: 'Cash Management',
      items: [
        { id: 'reconciliation', label: 'Bank Reconciliation', icon: CheckSquare },
        { id: 'bank-accounts', label: 'Bank Accounts', icon: Landmark },
        { id: 'bucket-allocation', label: 'Bucket Allocation', icon: Boxes },
        { id: 'runway', label: 'Cash Runway', icon: TrendingDown },
      ],
      defaultExpanded: true,
    },
    {
      id: 'obligations',
      label: 'Compliance & Obligations',
      items: [
        { id: 'obligations', label: 'Obligations', icon: AlertCircle },
        { id: 'compliance', label: 'Compliance Tasks', icon: Shield },
      ],
      defaultExpanded: true,
    },
    {
      id: 'automation',
      label: 'Automation & Planning',
      items: [
        { id: 'recurring', label: 'Recurring Transactions', icon: Clock },
        { id: 'vendors', label: 'Vendors', icon: Users },
        { id: 'budgets', label: 'Budgets', icon: Target },
      ],
      defaultExpanded: true,
    },
    {
      id: 'payroll',
      label: 'Payroll Management',
      items: [
        { id: 'employees', label: 'Employees', icon: Users2 },
        { id: 'salary-structure', label: 'Salary Structure', icon: DollarSign },
        { id: 'payroll-processing', label: 'Payroll Processing', icon: FileText },
        { id: 'payroll-register', label: 'Payroll Register', icon: BarChart3 },
        { id: 'salary-slip', label: 'Salary Slips', icon: FileText },
        { id: 'payroll-settings', label: 'Payroll Settings', icon: Settings },
      ],
      defaultExpanded: true,
    },
    {
      id: 'inventory',
      label: 'Inventory Management',
      items: [
        { id: 'stock-master', label: 'Stock Master', icon: Package },
        { id: 'stock-movements', label: 'Stock Movements', icon: ArrowRight },
        { id: 'stock-valuation', label: 'Stock Valuation', icon: PieChart },
        { id: 'stock-adjustments', label: 'Stock Adjustments', icon: Settings },
        { id: 'stock-reports', label: 'Stock Reports', icon: BarChart3 },
      ],
      defaultExpanded: true,
    },
    {
      id: 'cfo-hub',
      label: 'CFO Hub',
      items: [
        { id: 'cfo-dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'compliance-deadlines', label: 'Compliance Calendar', icon: Calendar },
        { id: 'weekly-reports', label: 'Weekly Reports', icon: FileText },
        { id: 'monthly-calls', label: 'Monthly Calls', icon: Phone },
        { id: 'client-alerts', label: 'Client Alerts', icon: AlertCircle },
        { id: 'client-directory', label: 'Client Directory', icon: Users },
      ],
      defaultExpanded: true,
    },
    {
      id: 'analysis',
      label: 'Analysis & Reports',
      items: [
        { id: 'aging', label: 'Aging Analysis', icon: ListTodo },
        { id: 'financial-statements', label: 'Financial Statements', icon: PieChart },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
      ],
      defaultExpanded: false,
    },
    {
      id: 'approvals',
      label: 'Team & Approvals',
      items: [
        { id: 'approvals', label: 'Approval Queue', icon: Clock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ],
      defaultExpanded: false,
    },
    {
      id: 'admin',
      label: 'Administration',
      items: [
        { id: 'import', label: 'Import Data', icon: Upload },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
      defaultExpanded: false,
    },
  ];

  // Filter navigation categories based on organization settings
  const filteredNavCategories = navCategories.filter((category) => {
    // Hide inventory management if not enabled for this organization
    if (category.id === 'inventory' && !currentOrganization?.settings?.inventoryManagementEnabled) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-background flex flex-col overflow-hidden">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Warrior Finance</h2>
          <p className="text-xs text-muted-foreground mt-1">v1.0</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <div className="space-y-6">
            {filteredNavCategories.map((category) => {
              const isExpanded = expandedCategories[category.id];
              return (
                <div key={category.id} className="space-y-2">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/10 transition-colors group"
                  >
                    <span className="text-xs font-bold text-foreground uppercase tracking-widest">{category.label}</span>
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-300 flex-shrink-0 text-muted-foreground group-hover:text-foreground ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="space-y-1 pl-2">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeNav === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isActive
                                ? 'bg-accent text-accent-foreground shadow-sm'
                                : 'text-foreground/70 hover:text-foreground hover:bg-accent/10'
                            }`}
                          >
                            <Icon size={18} className="flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-3 py-4">
          <button
            onClick={handleLogout}
            disabled={isSigningOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LogOut size={18} />
            <span>{isSigningOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb */}
        <div className="bg-background border-b border-border px-8 py-3">
          <Breadcrumbs 
            items={getBreadcrumbs(activeNav).map((item) => ({
              label: item.label,
              onClick: item.path ? () => handleNavClick(item.path) : undefined,
            }))}
          />
        </div>

        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="h-16 flex items-center justify-between px-8 gap-6">
            {/* Left: Page Title */}
            <h1 className="text-lg font-medium text-foreground">{pageTitle}</h1>

            {/* Center: Global Search */}
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg hover:border-accent transition-colors text-sm text-muted-foreground hover:text-foreground">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search anywhere..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
                />
                <div className="flex items-center gap-1 text-xs opacity-60 ml-auto">
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">Cmd</kbd>
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">K</kbd>
                </div>
              </div>
            </div>

            {/* Right: Organization Switcher + User Menu */}
            <div className="flex items-center gap-4">
              <OrganizationSwitcher onCreateNew={() => {}} />

              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <p className="text-sm font-medium text-foreground">{currentOrganization?.name || 'Acme Corp'}</p>
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {currentOrganization?.name?.substring(0, 2).toUpperCase() || 'AC'}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>
                      <Settings size={16} className="mr-2" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserSwitch size={16} className="mr-2" />
                      <span>Switch Role</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={isSigningOut}>
                      <LogOut size={16} className="mr-2" />
                      <span>{isSigningOut ? 'Logging out...' : 'Logout'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
