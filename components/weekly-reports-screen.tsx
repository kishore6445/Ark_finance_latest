'use client';

import { useState } from 'react';
import { FileText, Plus, Download, Mail, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WeeklyReportsScreen() {
  const [reports, setReports] = useState([
    {
      id: 'report_001',
      weekEndDate: '2024-02-18',
      daysWorked: 5,
      summary: 'Good week - 2 clients in compliance, 1 critical issue identified in PQR Systems',
      clientsReviewed: ['ABC Corporation', 'PQR Systems', 'Tech Ventures India'],
      alertsSummary: { total: 3, critical: 2, resolved: 1 },
      keyActions: [
        { clientName: 'PQR Systems', action: 'Filed income tax extension request', status: 'Completed' },
        { clientName: 'XYZ Ltd', action: 'Scheduled GST reconciliation call', status: 'Pending' },
      ],
      upcomingDeadlines: [
        { clientName: 'XYZ Ltd', deadline: '2024-02-20', type: 'GST Filing' },
        { clientName: 'PQR Systems', deadline: '2024-02-28', type: 'Income Tax Filing' },
      ],
      status: 'Submitted',
      createdDate: '2024-02-19',
    },
    {
      id: 'report_002',
      weekEndDate: '2024-02-11',
      daysWorked: 5,
      summary: 'Regular week - all clients on track except XYZ Ltd runway concerns',
      clientsReviewed: ['ABC Corporation', 'XYZ Ltd', 'Tech Ventures India'],
      alertsSummary: { total: 2, critical: 1, resolved: 0 },
      keyActions: [
        { clientName: 'XYZ Ltd', action: 'Cash flow review meeting', status: 'Completed' },
      ],
      upcomingDeadlines: [
        { clientName: 'ABC Corporation', deadline: '2024-02-15', type: 'Payroll Setup' },
      ],
      status: 'Submitted',
      createdDate: '2024-02-12',
    },
  ]);

  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<typeof reports[0] | null>(null);

  const handleGenerateNewReport = () => {
    const newReport = {
      id: `report_${Date.now()}`,
      weekEndDate: new Date().toISOString().split('T')[0],
      daysWorked: 5,
      summary: '',
      clientsReviewed: [],
      alertsSummary: { total: 0, critical: 0, resolved: 0 },
      keyActions: [],
      upcomingDeadlines: [],
      status: 'Draft',
      createdDate: new Date().toISOString().split('T')[0],
    };
    setReports([newReport, ...reports]);
    setSelectedReport(newReport);
    setShowNewReportModal(true);
  };

  const handleSubmitReport = (reportId: string) => {
    setReports(reports.map(r => r.id === reportId ? { ...r, status: 'Submitted' } : r));
    setSelectedReport(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 p-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Weekly Reports</h1>
          <p className="text-gray-600 mt-1">Auto-generated weekly summaries for your manager</p>
        </div>
        <Button onClick={handleGenerateNewReport} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" />
          Generate New Report
        </Button>
      </div>

      {/* Report List */}
      <div className="space-y-4">
        {reports.map(report => (
          <div
            key={report.id}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              report.status === 'Draft'
                ? 'bg-yellow-50 border-yellow-200 hover:shadow-md'
                : 'bg-green-50 border-green-200 hover:shadow-md'
            }`}
            onClick={() => setSelectedReport(report)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg">Week Ending {formatDate(report.weekEndDate)}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    report.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{report.summary}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Days Worked: <span className="font-bold">{report.daysWorked}</span></p>
                <p className="text-sm text-gray-600">Created: {formatDate(report.createdDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4 py-3 border-t border-b">
              <div>
                <p className="text-xs text-gray-600">Clients Reviewed</p>
                <p className="text-2xl font-bold text-blue-600">{report.clientsReviewed.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-orange-600">{report.alertsSummary.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{report.alertsSummary.critical}</p>
              </div>
            </div>

            {report.status === 'Draft' && (
              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmitReport(report.id);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Submit Report
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download Draft
                </Button>
              </div>
            )}
            {report.status === 'Submitted' && (
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                <Button variant="outline" className="gap-2">
                  <Archive className="w-4 h-4" />
                  Archive
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Weekly Report - Week of {formatDate(selectedReport.weekEndDate)}</h2>
              <button onClick={() => setSelectedReport(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Section */}
              <div>
                <h3 className="font-bold text-lg mb-2">Summary</h3>
                <textarea
                  value={selectedReport.summary}
                  onChange={(e) => setSelectedReport({ ...selectedReport, summary: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Clients Reviewed */}
              <div>
                <h3 className="font-bold text-lg mb-2">Clients Reviewed ({selectedReport.clientsReviewed.length})</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  {selectedReport.clientsReviewed.length === 0 ? (
                    <p className="text-sm text-gray-500">No clients selected</p>
                  ) : (
                    <ul className="space-y-1">
                      {selectedReport.clientsReviewed.map((client, idx) => (
                        <li key={idx} className="text-sm">• {client}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Key Actions */}
              <div>
                <h3 className="font-bold text-lg mb-2">Key Actions Taken</h3>
                <div className="space-y-2">
                  {selectedReport.keyActions.map((action, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                      <p className="font-medium text-sm">{action.clientName}</p>
                      <p className="text-sm">{action.action}</p>
                      <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                        action.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {action.status}
                      </span>
                    </div>
                  ))}
                  {selectedReport.keyActions.length === 0 && (
                    <p className="text-sm text-gray-500">No actions recorded</p>
                  )}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div>
                <h3 className="font-bold text-lg mb-2">Upcoming Deadlines</h3>
                <div className="space-y-2">
                  {selectedReport.upcomingDeadlines.map((deadline, idx) => (
                    <div key={idx} className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                      <p className="font-medium text-sm">{deadline.clientName}</p>
                      <p className="text-sm">{deadline.type} - Due {formatDate(deadline.deadline)}</p>
                    </div>
                  ))}
                  {selectedReport.upcomingDeadlines.length === 0 && (
                    <p className="text-sm text-gray-500">No upcoming deadlines</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedReport.status === 'Draft' && (
                  <>
                    <Button onClick={() => handleSubmitReport(selectedReport.id)} className="bg-blue-600 hover:bg-blue-700">
                      Submit Report
                    </Button>
                    <Button variant="outline">Save as Draft</Button>
                  </>
                )}
                {selectedReport.status === 'Submitted' && (
                  <>
                    <Button variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
