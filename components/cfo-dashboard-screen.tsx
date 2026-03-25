'use client';

import { useState } from 'react';
import { AlertCircle, TrendingDown, CheckCircle, Clock, Phone, FileText, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CFODashboardScreen() {
  // Mock data - in production this comes from app state
  const alerts = [
    {
      id: 'alert_001',
      clientName: 'XYZ Ltd',
      severity: 'Critical',
      title: 'Low Runway Alert',
      description: 'Only 2 months of cash runway at current burn rate',
      type: 'Financial',
    },
    {
      id: 'alert_002',
      clientName: 'PQR Systems',
      severity: 'Critical',
      title: 'Income Tax Filing Overdue',
      description: 'Has not filed income tax return for FY 2023-24',
      type: 'Compliance',
    },
    {
      id: 'alert_003',
      clientName: 'PQR Systems',
      severity: 'High',
      title: 'Payroll Tax Compliance Issue',
      description: 'Pending ESI/PF remittances for January',
      type: 'Operational',
    },
    {
      id: 'alert_004',
      clientName: 'XYZ Ltd',
      severity: 'High',
      title: 'GST Return Not Filed',
      description: 'Has not filed GST return for January 2024',
      type: 'Compliance',
    },
  ];

  const clients = [
    { id: 'client_001', name: 'ABC Corporation', runway: 8, compliance: 100, alerts: 0, lastCall: '2d ago', nextCall: 'Fri', status: 'Healthy' },
    { id: 'client_002', name: 'XYZ Ltd', runway: 2, compliance: 60, alerts: 2, lastCall: '1w ago', nextCall: 'Sun', status: 'Critical' },
    { id: 'client_003', name: 'PQR Systems', runway: 1.5, compliance: 75, alerts: 3, lastCall: '3w ago', nextCall: 'Tue', status: 'Critical' },
    { id: 'client_004', name: 'Tech Ventures India', runway: 12, compliance: 98, alerts: 0, lastCall: '2d ago', nextCall: 'Mon', status: 'Healthy' },
  ];

  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const filteredAlerts = selectedSeverity === 'All' ? alerts : alerts.filter(a => a.severity === selectedSeverity);

  const criticalCount = alerts.filter(a => a.severity === 'Critical').length;
  const highCount = alerts.filter(a => a.severity === 'High').length;
  const healthyClients = clients.filter(c => c.status === 'Healthy').length;
  const atRiskClients = clients.filter(c => c.status === 'Critical').length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'High':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Healthy') return 'text-green-600 bg-green-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6 p-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CFO Hub Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome Tanuja - Manage your 100+ clients effortlessly</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">Generate Weekly Report</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Healthy Clients</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{healthyClients}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">At Risk</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{atRiskClients}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Critical Alerts</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{criticalCount}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-red-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Action Items</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{filteredAlerts.length}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Critical Alerts Hub */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Critical Alerts Hub
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSeverity('All')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                selectedSeverity === 'All' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setSelectedSeverity('Critical')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                selectedSeverity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setSelectedSeverity('High')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                selectedSeverity === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700'
              }`}
            >
              High ({highCount})
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No alerts matching filter</div>
          ) : (
            filteredAlerts.map(alert => (
              <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-medium">{alert.type}</span>
                    </div>
                    <h3 className="font-bold text-sm">{alert.clientName}: {alert.title}</h3>
                    <p className="text-sm mt-1">{alert.description}</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-4">Resolve</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Client Health Matrix */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Client Health Matrix
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-semibold">Client Name</th>
                <th className="text-center p-3 font-semibold">Runway (mo)</th>
                <th className="text-center p-3 font-semibold">Compliance %</th>
                <th className="text-center p-3 font-semibold">Alerts</th>
                <th className="text-center p-3 font-semibold">Last Call</th>
                <th className="text-center p-3 font-semibold">Next Call</th>
                <th className="text-center p-3 font-semibold">Status</th>
                <th className="text-center p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{client.name}</td>
                  <td className={`text-center p-3 font-bold ${client.runway < 3 ? 'text-red-600' : 'text-green-600'}`}>
                    {client.runway}
                  </td>
                  <td className="text-center p-3">
                    <div className="inline-block">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${client.compliance >= 80 ? 'bg-green-500' : client.compliance >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${client.compliance}%` }}
                        />
                      </div>
                      <p className="text-xs mt-1">{client.compliance}%</p>
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      client.alerts === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {client.alerts}
                    </span>
                  </td>
                  <td className="text-center p-3 text-gray-600">{client.lastCall}</td>
                  <td className="text-center p-3 font-medium">{client.nextCall}</td>
                  <td className="text-center p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <Button variant="outline" size="sm">Schedule Call</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* This Week's Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          This Week's Compliance Deadlines
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-700">Mon 20 Feb</p>
            <p className="font-bold text-blue-900 mt-1">GST Return Due (XYZ Ltd)</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">Take Action</Button>
          </div>
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-sm font-medium text-red-700">Wed 22 Feb</p>
            <p className="font-bold text-red-900 mt-1">Income Tax Filing (PQR)</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">Take Action</Button>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <p className="text-sm font-medium text-orange-700">Thu 23 Feb</p>
            <p className="font-bold text-orange-900 mt-1">Payroll Setup (Client C)</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">Take Action</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
