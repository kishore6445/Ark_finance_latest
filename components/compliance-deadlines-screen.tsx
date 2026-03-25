'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, Clock, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ComplianceDeadlinesScreen() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const deadlines = [
    {
      id: 'comp_001',
      clientName: 'ABC Corporation',
      type: 'GST',
      frequency: 'Monthly',
      dueDate: '2024-02-20',
      description: 'GST Return Filing for January 2024',
      status: 'Completed',
      submissionMethod: 'Online',
    },
    {
      id: 'comp_002',
      clientName: 'XYZ Ltd',
      type: 'GST',
      frequency: 'Monthly',
      dueDate: '2024-02-20',
      description: 'GST Return Filing for January 2024',
      status: 'Overdue',
      submissionMethod: 'Online',
    },
    {
      id: 'comp_003',
      clientName: 'PQR Systems',
      type: 'IncomeTax',
      frequency: 'Annual',
      dueDate: '2024-02-28',
      description: 'Income Tax Return Filing FY 2023-24',
      status: 'NotStarted',
      submissionMethod: 'Online',
    },
    {
      id: 'comp_004',
      clientName: 'ABC Corporation',
      type: 'PayrollTax',
      frequency: 'Monthly',
      dueDate: '2024-02-15',
      description: 'PF/ESI Remittance for January',
      status: 'Completed',
      submissionMethod: 'Online',
    },
    {
      id: 'comp_005',
      clientName: 'Tech Ventures India',
      type: 'AuditReport',
      frequency: 'Annual',
      dueDate: '2024-03-31',
      description: 'Statutory Audit Report Submission',
      status: 'InProgress',
      submissionMethod: 'Online',
    },
  ];

  const filteredDeadlines = deadlines.filter(d => {
    if (filterStatus !== 'All' && d.status !== filterStatus) return false;
    if (filterType !== 'All' && d.type !== filterType) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'InProgress':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'Overdue':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'NotStarted':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'InProgress':
        return 'bg-blue-100 text-blue-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'NotStarted':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'InProgress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = date.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
  };

  return (
    <div className="space-y-6 p-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Deadlines Calendar</h1>
          <p className="text-gray-600 mt-1">Track all regulatory deadlines across your clients</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Add Deadline_1233</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-2">View</label>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                viewMode === 'calendar' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>All</option>
            <option>Completed</option>
            <option>InProgress</option>
            <option>Overdue</option>
            <option>NotStarted</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>All</option>
            <option>GST</option>
            <option>IncomeTax</option>
            <option>PayrollTax</option>
            <option>AuditReport</option>
            <option>ROC</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-sm text-green-700 font-medium">Completed</p>
          <p className="text-3xl font-bold text-green-900 mt-1">{deadlines.filter(d => d.status === 'Completed').length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">In Progress</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{deadlines.filter(d => d.status === 'InProgress').length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-sm text-red-700 font-medium">Overdue</p>
          <p className="text-3xl font-bold text-red-900 mt-1">{deadlines.filter(d => d.status === 'Overdue').length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <p className="text-sm text-orange-700 font-medium">Not Started</p>
          <p className="text-3xl font-bold text-orange-900 mt-1">{deadlines.filter(d => d.status === 'NotStarted').length}</p>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-semibold">Client</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Due Date</th>
                  <th className="text-left p-4 font-semibold">Days Left</th>
                  <th className="text-left p-4 font-semibold">Description</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeadlines.map(deadline => (
                  <tr key={deadline.id} className={`border-b ${getStatusColor(deadline.status)}`}>
                    <td className="p-4 font-medium">{deadline.clientName}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {deadline.type}
                      </span>
                    </td>
                    <td className="p-4">{formatDate(deadline.dueDate)}</td>
                    <td className="p-4">
                      <span className={`font-bold ${getDaysUntil(deadline.dueDate) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {getDaysUntil(deadline.dueDate) < 0 ? `${Math.abs(getDaysUntil(deadline.dueDate))} ago` : `${getDaysUntil(deadline.dueDate)} days`}
                      </span>
                    </td>
                    <td className="p-4">{deadline.description}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(deadline.status)}
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(deadline.status)}`}>
                          {deadline.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {deadline.status === 'NotStarted' && (
                        <Button variant="outline" size="sm">Start</Button>
                      )}
                      {deadline.status === 'InProgress' && (
                        <Button variant="outline" size="sm">Update</Button>
                      )}
                      {deadline.status === 'Overdue' && (
                        <Button variant="destructive" size="sm">Urgent</Button>
                      )}
                      {deadline.status === 'Completed' && (
                        <Button variant="outline" size="sm" disabled>Done</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View Placeholder */}
      {viewMode === 'calendar' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Calendar className="w-5 h-5" />
            <p>Calendar view coming soon - showing month view of all deadlines</p>
          </div>
        </div>
      )}
    </div>
  );
}
