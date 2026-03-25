'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ClientAlertsHealthScreen() {
  const [alerts, setAlerts] = useState([
    {
      id: 'alert_001',
      clientName: 'XYZ Ltd',
      severity: 'Critical',
      title: 'Low Runway Alert',
      description: 'Only 2 months of cash runway at current burn rate',
      type: 'Financial',
      suggestedAction: 'Schedule urgent meeting to discuss cash management strategy',
      status: 'Open',
      createdDate: '2024-02-20',
    },
    {
      id: 'alert_002',
      clientName: 'PQR Systems',
      severity: 'Critical',
      title: 'Income Tax Filing Overdue',
      description: 'Has not filed income tax return for FY 2023-24',
      type: 'Compliance',
      suggestedAction: 'File return immediately to avoid penalties',
      status: 'Open',
      createdDate: '2024-02-19',
    },
    {
      id: 'alert_003',
      clientName: 'PQR Systems',
      severity: 'High',
      title: 'Payroll Tax Compliance Issue',
      description: 'Pending ESI/PF remittances for January',
      type: 'Operational',
      suggestedAction: 'Submit remittance before 15th of next month',
      status: 'Open',
      createdDate: '2024-02-18',
    },
  ]);

  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const clients = [
    { id: 'client_001', name: 'ABC Corporation', status: 'Healthy', alertCount: 0 },
    { id: 'client_002', name: 'XYZ Ltd', status: 'Critical', alertCount: 2 },
    { id: 'client_003', name: 'PQR Systems', status: 'Critical', alertCount: 3 },
    { id: 'client_004', name: 'Tech Ventures India', status: 'Healthy', alertCount: 0 },
  ];

  const filteredAlerts = selectedClient ? alerts.filter(a => clients.find(c => c.id === selectedClient && c.name === a.clientName)) : alerts;

  const getSeverityColor = (severity: string) => {
    if (severity === 'Critical') return 'bg-red-100 text-red-800';
    if (severity === 'High') return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getTypeColor = (type: string) => {
    if (type === 'Financial') return 'bg-blue-100 text-blue-800';
    if (type === 'Compliance') return 'bg-red-100 text-red-800';
    return 'bg-purple-100 text-purple-800';
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: 'Resolved' } : a));
  };

  return (
    <div className="space-y-6 p-6 bg-white">
      <div>
        <h1 className="text-3xl font-bold">Client Alerts & Health</h1>
        <p className="text-gray-600 mt-1">Manage and resolve client alerts</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {clients.map(client => (
          <div
            key={client.id}
            onClick={() => setSelectedClient(client.id)}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedClient === client.id ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400' : 'bg-white hover:shadow-md'
            } ${client.status === 'Healthy' ? 'border-green-200' : 'border-red-200'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm">{client.name}</h3>
              {client.status === 'Healthy' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className={`text-xs font-medium ${client.status === 'Healthy' ? 'text-green-700' : 'text-red-700'}`}>
              {client.status}
            </p>
            <p className="text-xs text-gray-600 mt-2">{client.alertCount} Alert{client.alertCount !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-lg">
        <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
          <h2 className="font-bold text-lg">
            {selectedClient ? `Alerts for ${clients.find(c => c.id === selectedClient)?.name}` : 'All Alerts'}
          </h2>
          {selectedClient && (
            <button onClick={() => setSelectedClient(null)} className="text-blue-600 text-sm font-medium">Clear Filter</button>
          )}
        </div>

        <div className="divide-y">
          {filteredAlerts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2 opacity-50" />
              <p>All clear! No alerts to show.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div key={alert.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(alert.type)}`}>
                        {alert.type}
                      </span>
                    </div>
                    <h3 className="font-bold">{alert.clientName}: {alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                    {alert.suggestedAction && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                        <p className="text-sm font-medium text-blue-900">Suggested Action:</p>
                        <p className="text-sm text-blue-800">{alert.suggestedAction}</p>
                      </div>
                    )}
                  </div>
                  {alert.status === 'Open' && (
                    <Button
                      onClick={() => handleResolveAlert(alert.id)}
                      variant="outline"
                      size="sm"
                      className="ml-4 gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolve
                    </Button>
                  )}
                  {alert.status === 'Resolved' && (
                    <span className="text-sm text-green-700 font-medium">Resolved</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Created: {alert.createdDate}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
