'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Edit2, Trash2, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Employee {
  id: string;
  organizationId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: 'M' | 'F' | 'Other';
  joiningDate: string;
  departmentId: string;
  designationId: string;
  reportingManager: string;
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountType: 'Savings' | 'Current';
  };
  status: 'Active' | 'Inactive' | 'On Leave' | 'Separated';
  baseCtc: number;
  createdDate: string;
}

type EmployeeApiRow = {
  id: string;
  organization_id?: string | null;
  employee_code?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  dob?: string | null;
  gender?: 'M' | 'F' | 'Other' | null;
  joining_date?: string | null;
  department_id?: string | null;
  designation_id?: string | null;
  reporting_manager?: string | null;
  bank_account?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    accountType?: 'Savings' | 'Current';
  } | null;
  status?: 'Active' | 'Inactive' | 'On Leave' | 'Separated' | null;
  base_ctc?: number | null;
  created_at?: string | null;
};

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function mapEmployeeRow(row: EmployeeApiRow): Employee {
  return {
    id: row.id,
    organizationId: row.organization_id ?? '',
    employeeCode: row.employee_code ?? 'N/A',
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    dob: row.dob ?? '',
    gender: row.gender ?? 'M',
    joiningDate: row.joining_date ?? '',
    departmentId: row.department_id ?? '',
    designationId: row.designation_id ?? '',
    reportingManager: row.reporting_manager ?? '',
    bankAccount: {
      accountNumber: row.bank_account?.accountNumber ?? '',
      ifscCode: row.bank_account?.ifscCode ?? '',
      bankName: row.bank_account?.bankName ?? '',
      accountType: row.bank_account?.accountType ?? 'Savings',
    },
    status: row.status ?? 'Active',
    baseCtc: Number(row.base_ctc ?? 0),
    createdDate: row.created_at ?? '',
  };
}

function splitName(fullName: string) {
  const normalized = (fullName || '').trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return { firstName: 'Unknown', lastName: '' };
  }
  const parts = normalized.split(' ');
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function buildDerivedEmployees(names: string[]): Employee[] {
  return names.map((name, index) => {
    const { firstName, lastName } = splitName(name);
    return {
      id: `derived-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      organizationId: '',
      employeeCode: `EMP${String(index + 1).padStart(3, '0')}`,
      firstName,
      lastName,
      email: '',
      phone: '',
      dob: '',
      gender: 'Other',
      joiningDate: '',
      departmentId: '',
      designationId: '',
      reportingManager: '',
      bankAccount: {
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountType: 'Savings',
      },
      status: 'Active',
      baseCtc: 0,
      createdDate: '',
    };
  });
}

export function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive' | 'On Leave' | 'Separated'>('All');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'M',
    joiningDate: new Date().toISOString().split('T')[0],
    departmentId: '',
    designationId: '',
    reportingManager: '',
    bankAccount: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountType: 'Savings',
    },
    status: 'Active',
    baseCtc: 0,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();
      const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const response = await fetch('/api/employees', {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('[Employees] fetch failed:', err?.error ?? 'Unknown error');
        setEmployees([]);
        return;
      }

      const data = await response.json();
      const rows: EmployeeApiRow[] = data.employees ?? [];
      if (rows.length > 0) {
        setEmployees(rows.map(mapEmployeeRow));
        return;
      }

      // No employee master rows yet: derive employee names from live salary obligations/transactions.
      const [obligationsResponse, transactionsResponse] = await Promise.all([
        fetch('/api/obligations', { method: 'GET', headers, cache: 'no-store' }),
        fetch('/api/transactions', { method: 'GET', headers, cache: 'no-store' }),
      ]);

      const obligationsData = obligationsResponse.ok ? await obligationsResponse.json() : { obligations: [] };
      const transactionsData = transactionsResponse.ok ? await transactionsResponse.json() : { transactions: [] };

      const employeeNames = new Set<string>();

      for (const item of obligationsData.obligations ?? []) {
        if (item?.category === 'Employee' && typeof item?.party === 'string' && item.party.trim()) {
          employeeNames.add(item.party.trim());
        }
      }

      for (const tx of transactionsData.transactions ?? []) {
        const isIncome = Boolean(tx?.is_income ?? tx?.isIncome);
        const subtype = String(tx?.subtype ?? '');
        const isEmployeeTxn = subtype === 'Salaries' || subtype === 'Employee Benefits';
        if (isIncome || !isEmployeeTxn) continue;

        const candidate =
          tx?.vendor_customer_name ??
          tx?.vendorCustomerName ??
          tx?.vendorcustomername ??
          tx?.description ??
          '';

        if (typeof candidate === 'string' && candidate.trim()) {
          employeeNames.add(candidate.trim());
        }
      }

      setEmployees(buildDerivedEmployees(Array.from(employeeNames)));
    } catch (error) {
      console.error('[Employees] fetch error:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = `${emp.firstName} ${emp.lastName} ${emp.employeeCode}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || emp.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddEmployee = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill required fields');
      return;
    }

    try {
      const accessToken = await getAccessToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dob: formData.dob,
          gender: formData.gender,
          joiningDate: formData.joiningDate,
          departmentId: formData.departmentId,
          designationId: formData.designationId,
          reportingManager: formData.reportingManager,
          bankAccount: formData.bankAccount,
          status: formData.status,
          baseCtc: Number(formData.baseCtc ?? 0),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err?.error ?? 'Failed to add employee');
        return;
      }

      const data = await response.json();
      const created = mapEmployeeRow(data.employee as EmployeeApiRow);
      setEmployees((prev) => [created, ...prev]);
    } catch (error) {
      console.error('[Employees] create error:', error);
      alert('Failed to add employee');
      return;
    }

    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      status: 'Active',
    });
    setShowCreateModal(false);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    const existing = employees.find((emp) => emp.id === employeeId);
    if (!existing) return;

    setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    try {
      const accessToken = await getAccessToken();
      const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const response = await fetch(`/api/employees?id=${encodeURIComponent(employeeId)}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const err = await response.json();
        console.error('[Employees] delete failed:', err?.error ?? 'Unknown error');
        setEmployees((prev) => [existing, ...prev]);
      }
    } catch (error) {
      console.error('[Employees] delete error:', error);
      setEmployees((prev) => [existing, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users size={28} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Employee Master</h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage employee information and details</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or employee code..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
          <option value="Separated">Separated</option>
        </select>
        <Button variant="outline">
          <Download size={18} className="mr-2" />
          Export
        </Button>
      </div>

      {/* Employees Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-gray-500">Loading employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">No employees found.</div>
        ) : (
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.employeeCode}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{emp.firstName} {emp.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{emp.email}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{emp.phone}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{emp.departmentId || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    emp.status === 'Active' ? 'bg-green-100 text-green-800' :
                    emp.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit2 size={16} className="text-blue-600" />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => handleDeleteEmployee(emp.id)}
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Enter employee details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Joining Date</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base CTC (Annual)</label>
                <input
                  type="number"
                  value={formData.baseCtc}
                  onChange={(e) => setFormData({...formData, baseCtc: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-6">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleAddEmployee} className="bg-blue-600 hover:bg-blue-700">Add Employee</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
