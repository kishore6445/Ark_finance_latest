'use client';

import { useState } from 'react';
import { Phone, Plus, CheckCircle, Calendar, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MonthlyCallsSchedulerScreen() {
  const [calls, setCalls] = useState([
    {
      id: 'call_001',
      clientName: 'ABC Corporation',
      scheduledDate: '2024-02-29',
      callType: 'FinanceReview',
      duration: null,
      status: 'Scheduled',
      agendaItems: ['Q4 Performance Review', 'Cash Flow Forecast', 'Tax Planning'],
      notes: '',
      nextCallDate: '2024-03-28',
    },
    {
      id: 'call_002',
      clientName: 'PQR Systems',
      scheduledDate: '2024-02-25',
      callType: 'Compliance',
      duration: 45,
      status: 'Completed',
      agendaItems: ['Income Tax Filing Status', 'Payroll Compliance', 'GST Updates'],
      notes: 'Discussed multiple compliance issues. Action items assigned.',
      nextCallDate: '2024-03-25',
    },
  ]);

  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const callTypeColors: Record<string, string> = {
    FinanceReview: 'bg-blue-100 text-blue-800',
    Compliance: 'bg-red-100 text-red-800',
    BoardCall: 'bg-purple-100 text-purple-800',
    TaxPlanning: 'bg-green-100 text-green-800',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleCompleteCall = (callId: string) => {
    setCalls(calls.map(c => c.id === callId ? { ...c, status: 'Completed' } : c));
  };

  return (
    <div className="space-y-6 p-6 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monthly Calls Scheduler</h1>
          <p className="text-gray-600 mt-1">Schedule and manage client calls</p>
        </div>
        <Button onClick={() => setShowScheduleModal(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" />
          Schedule New Call
        </Button>
      </div>

      <div className="space-y-4">
        {calls.map(call => (
          <div key={call.id} className={`border rounded-lg p-4 ${call.status === 'Scheduled' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg">{call.clientName}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${callTypeColors[call.callType]}`}>
                    {call.callType}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    call.status === 'Scheduled' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {call.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {call.status === 'Scheduled' ? 'Scheduled' : 'Completed'}: {formatDate(call.scheduledDate)}
                  {call.duration && ` • Duration: ${call.duration} mins`}
                </p>
                <div className="mt-2">
                  <p className="text-sm font-medium">Agenda Items:</p>
                  <ul className="text-sm text-gray-700 ml-4">
                    {call.agendaItems.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
                {call.notes && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm text-gray-700">{call.notes}</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Next: {formatDate(call.nextCallDate)}</p>
                {call.status === 'Scheduled' && (
                  <Button
                    onClick={() => handleCompleteCall(call.id)}
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Done
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Schedule New Call</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Client</label>
                <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Select client...</option>
                  <option>ABC Corporation</option>
                  <option>XYZ Ltd</option>
                  <option>PQR Systems</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Call Type</label>
                <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>FinanceReview</option>
                  <option>Compliance</option>
                  <option>BoardCall</option>
                  <option>TaxPlanning</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scheduled Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Agenda Items</label>
                <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Enter agenda items, one per line" />
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button className="bg-blue-600 hover:bg-blue-700 flex-1">Schedule</Button>
                <Button variant="outline" onClick={() => setShowScheduleModal(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
