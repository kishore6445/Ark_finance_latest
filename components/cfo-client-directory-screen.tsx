'use client';

import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CFOClientDirectoryScreen() {
  const [clients, setClients] = useState([
    {
      id: 'client_001',
      clientName: 'ABC Corporation',
      industry: 'Technology',
      companySize: 'Mid-Market',
      engagementTier: 'Premium',
      contactPerson: 'Rajesh Sharma',
      contactEmail: 'rajesh@abccorp.com',
      contactPhone: '+91-9876543210',
      monthlyFee: 50000,
      status: 'Active',
    },
    {
      id: 'client_002',
      clientName: 'XYZ Ltd',
      industry: 'Manufacturing',
      companySize: 'SME',
      engagementTier: 'Standard',
      contactPerson: 'Priya Singh',
      contactEmail: 'priya@xyzltd.com',
      contactPhone: '+91-9876543211',
      monthlyFee: 35000,
      status: 'Active',
    },
    {
      id: 'client_003',
      clientName: 'PQR Systems',
      industry: 'Software',
      companySize: 'Startup',
      engagementTier: 'VIP',
      contactPerson: 'Arun Kumar',
      contactEmail: 'arun@pqrsystems.com',
      contactPhone: '+91-9876543212',
      monthlyFee: 75000,
      status: 'Active',
    },
    {
      id: 'client_004',
      clientName: 'Tech Ventures India',
      industry: 'Technology',
      companySize: 'Mid-Market',
      engagementTier: 'Premium',
      contactPerson: 'Deepak Mehta',
      contactEmail: 'deepak@techventures.com',
      contactPhone: '+91-9876543213',
      monthlyFee: 60000,
      status: 'Active',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(c => 
    c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierColor = (tier: string) => {
    if (tier === 'VIP') return 'bg-purple-100 text-purple-800';
    if (tier === 'Premium') return 'bg-gold-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getSizeColor = (size: string) => {
    if (size === 'Startup') return 'bg-green-100 text-green-800';
    if (size === 'SME') return 'bg-blue-100 text-blue-800';
    if (size === 'Mid-Market') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const totalMRR = clients.reduce((sum, c) => sum + c.monthlyFee, 0);

  return (
    <div className="space-y-6 p-6 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Client Directory</h1>
          <p className="text-gray-600 mt-1">Manage all your clients and their information</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">Total Clients</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{clients.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-sm text-green-700 font-medium">Monthly Recurring</p>
          <p className="text-3xl font-bold text-green-900 mt-1">₹{(totalMRR / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <p className="text-sm text-purple-700 font-medium">VIP Clients</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">{clients.filter(c => c.engagementTier === 'VIP').length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by client name or industry..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Client Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-4 font-semibold">Client Name</th>
                <th className="text-left p-4 font-semibold">Industry</th>
                <th className="text-left p-4 font-semibold">Size</th>
                <th className="text-left p-4 font-semibold">Tier</th>
                <th className="text-left p-4 font-semibold">Contact</th>
                <th className="text-left p-4 font-semibold">Monthly Fee</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{client.clientName}</td>
                  <td className="p-4">{client.industry}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getSizeColor(client.companySize)}`}>
                      {client.companySize}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTierColor(client.engagementTier)}`}>
                      {client.engagementTier}
                    </span>
                  </td>
                  <td className="p-4 text-xs">
                    <div>{client.contactPerson}</div>
                    <div className="text-gray-500">{client.contactEmail}</div>
                  </td>
                  <td className="p-4 font-bold">₹{client.monthlyFee.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                      {client.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" className="gap-1">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Add New Client</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Industry</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company Size</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Startup</option>
                    <option>SME</option>
                    <option>Mid-Market</option>
                    <option>Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Engagement Tier</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input type="tel" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Fee (₹)</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button className="bg-blue-600 hover:bg-blue-700 flex-1">Add Client</Button>
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
