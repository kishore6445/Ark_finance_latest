'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Shield, Mail, MoreHorizontal } from 'lucide-react';

type UserRole = 'Owner' | 'Finance Manager' | 'Accountant' | 'Viewer';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinedDate: string;
  status: 'Active' | 'Invited' | 'Inactive';
  lastLogin?: string;
}

interface RolePermission {
  role: UserRole;
  description: string;
  permissions: string[];
  canManageUsers: boolean;
  canViewAll: boolean;
  canEditTransactions: boolean;
  canApprovePayments: boolean;
  canViewReports: boolean;
}

export function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Amit Patel',
      email: 'amit@company.com',
      role: 'Owner',
      joinedDate: 'Jan 15, 2026',
      status: 'Active',
      lastLogin: 'Feb 4, 2026 2:30 PM',
    },
    {
      id: '2',
      name: 'Priya Sharma',
      email: 'priya@company.com',
      role: 'Finance Manager',
      joinedDate: 'Jan 20, 2026',
      status: 'Active',
      lastLogin: 'Feb 3, 2026 10:15 AM',
    },
    {
      id: '3',
      name: 'Rajesh Kumar',
      email: 'rajesh@company.com',
      role: 'Accountant',
      joinedDate: 'Feb 1, 2026',
      status: 'Active',
      lastLogin: 'Feb 2, 2026 3:45 PM',
    },
    {
      id: '4',
      name: 'Nina Gupta',
      email: 'nina@company.com',
      role: 'Viewer',
      joinedDate: 'Jan 25, 2026',
      status: 'Invited',
    },
  ]);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Accountant');

  const rolePermissions: RolePermission[] = [
    {
      role: 'Owner',
      description: 'Full access to all features and user management',
      permissions: [
        'View all transactions',
        'Record transactions',
        'Approve payments',
        'Manage invoices',
        'View reports',
        'Manage users',
        'Configure settings',
      ],
      canManageUsers: true,
      canViewAll: true,
      canEditTransactions: true,
      canApprovePayments: true,
      canViewReports: true,
    },
    {
      role: 'Finance Manager',
      description: 'Manage finances and approve transactions',
      permissions: [
        'View all transactions',
        'Record transactions',
        'Approve payments',
        'Manage invoices',
        'View reports',
        'View compliance',
      ],
      canManageUsers: false,
      canViewAll: true,
      canEditTransactions: true,
      canApprovePayments: true,
      canViewReports: true,
    },
    {
      role: 'Accountant',
      description: 'Record transactions and manage records',
      permissions: [
        'View own transactions',
        'Record transactions',
        'Manage invoices',
        'View compliance',
      ],
      canManageUsers: false,
      canViewAll: false,
      canEditTransactions: true,
      canApprovePayments: false,
      canViewReports: false,
    },
    {
      role: 'Viewer',
      description: 'View-only access to reports and dashboards',
      permissions: ['View reports', 'View dashboard', 'View compliance'],
      canManageUsers: false,
      canViewAll: true,
      canEditTransactions: false,
      canApprovePayments: false,
      canViewReports: true,
    },
  ];

  const handleInviteUser = () => {
    if (!inviteEmail) return;

    const newUser: User = {
      id: String(users.length + 1),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Invited',
    };

    setUsers([...users, newUser]);
    setInviteEmail('');
    setShowInviteForm(false);
  };

  const handleRemoveUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId));
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'Owner':
        return 'text-accent bg-accent/10';
      case 'Finance Manager':
        return 'text-primary bg-primary/10';
      case 'Accountant':
        return 'text-warning bg-warning/10';
      case 'Viewer':
        return 'text-muted-foreground bg-muted/10';
      default:
        return 'text-foreground bg-muted/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-accent bg-accent/10';
      case 'Invited':
        return 'text-warning bg-warning/10';
      case 'Inactive':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-foreground bg-muted/10';
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="pt-6 pb-4 px-8 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Manage team access and permissions</p>
          <p className="text-xs text-muted-foreground">
            {users.filter((u) => u.status === 'Active').length} active members, {users.filter((u) => u.status === 'Invited').length} invitations pending
          </p>
        </div>

        <button
          onClick={() => setShowInviteForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Invite User
        </button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="border-b border-border bg-muted/5 px-8 py-6">
          <div className="max-w-2xl">
            <h3 className="text-sm font-semibold mb-4">Invite New User</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@company.com"
                  className="w-full px-3 py-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="Owner">Owner</option>
                  <option value="Finance Manager">Finance Manager</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleInviteUser}
                  className="px-3 py-2 bg-accent text-accent-foreground text-xs font-medium rounded hover:bg-accent/90 transition-colors"
                >
                  Send Invite
                </button>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="px-3 py-2 bg-muted text-muted-foreground text-xs font-medium rounded hover:bg-muted/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8">
            {/* Team Members */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Team Members</h2>

              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="border border-border rounded-lg p-4 hover:bg-muted/5 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      {user.status === 'Active' && (
                        <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className={`text-xs font-medium px-2 py-1 rounded ${getRoleColor(user.role)}`}>
                        {user.role}
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(user.status)}`}>
                        {user.status}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Joined: {user.joinedDate}</p>
                      {user.lastLogin && <p>Last login: {user.lastLogin}</p>}
                    </div>

                    {user.status === 'Active' && (
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="mt-3 w-full flex items-center justify-center gap-1 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors"
                      >
                        <Trash2 size={12} />
                        Remove Access
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Role Permissions */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Role Permissions</h2>

              <div className="space-y-4">
                {rolePermissions.map((rolePerms) => (
                  <div key={rolePerms.role} className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <Shield size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{rolePerms.role}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{rolePerms.description}</p>
                      </div>
                    </div>

                    <ul className="space-y-1.5">
                      {rolePerms.permissions.map((perm, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Log Section */}
          <div className="mt-8 border-t border-border pt-8">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Date</div>
                <div>User</div>
                <div>Action</div>
                <div>Details</div>
              </div>

              {/* Sample Audit Logs */}
              <div className="divide-y divide-border">
                {[
                  {
                    date: 'Feb 4, 2026 2:30 PM',
                    user: 'Amit Patel',
                    action: 'Recorded Transaction',
                    details: 'Acme Studios - Project Delivery (₹45,000)',
                  },
                  {
                    date: 'Feb 3, 2026 10:15 AM',
                    user: 'Priya Sharma',
                    action: 'Approved Payment',
                    details: 'AWS Services payment (₹8,500)',
                  },
                  {
                    date: 'Feb 2, 2026 3:45 PM',
                    user: 'Rajesh Kumar',
                    action: 'Updated Invoice',
                    details: 'INV-2401-002 marked as Partial',
                  },
                  {
                    date: 'Feb 1, 2026 11:20 AM',
                    user: 'Amit Patel',
                    action: 'Invited User',
                    details: 'Rajesh Kumar added as Accountant',
                  },
                ].map((log, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-4 px-4 py-3 items-center hover:bg-muted/5 transition-colors">
                    <div className="text-xs text-muted-foreground">{log.date}</div>
                    <div className="text-xs font-medium text-foreground">{log.user}</div>
                    <div className="text-xs text-foreground">{log.action}</div>
                    <div className="text-xs text-muted-foreground truncate">{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
