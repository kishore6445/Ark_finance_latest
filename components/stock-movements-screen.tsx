'use client';

import { useState } from 'react';
import { useAppState } from '@/context/app-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

export function StockMovementsScreen() {
  const { state, recordStockMovement } = useAppState();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [formData, setFormData] = useState({
    movementType: 'Purchase' as const,
    referenceNo: '',
    productId: '',
    quantity: 0,
    unitPrice: 0,
    movementDate: new Date().toISOString().split('T')[0],
    supplier: '',
    customer: '',
    notes: '',
    status: 'Draft' as const,
  });

  const filtered = state.stockMovements.filter(m => {
    const matchesSearch = m.referenceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || m.movementType === filterType;
    return matchesSearch && matchesType;
  });

  const handleRecordMovement = () => {
    recordStockMovement(formData);
    setFormData({
      movementType: 'Purchase', referenceNo: '', productId: '', quantity: 0,
      unitPrice: 0, movementDate: new Date().toISOString().split('T')[0],
      supplier: '', customer: '', notes: '', status: 'Draft',
    });
    setShowCreateModal(false);
  };

  const totalInValue = filtered.filter(m => ['Purchase', 'Return'].includes(m.movementType))
    .reduce((sum, m) => sum + m.totalValue, 0);
  const totalOutValue = filtered.filter(m => ['Sale', 'Adjustment', 'Damage'].includes(m.movementType))
    .reduce((sum, m) => sum + m.totalValue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Movements</h1>
          <p className="text-sm text-muted-foreground mt-1">Track all inventory transactions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" /> Record Movement
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total Movements</p>
          <p className="text-3xl font-bold mt-2">{filtered.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700">Stock In Value</p>
              <p className="text-2xl font-bold mt-2 text-green-700">₹{totalInValue.toLocaleString('en-IN')}</p>
            </div>
            <TrendingUp size={32} className="text-green-400" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-700">Stock Out Value</p>
              <p className="text-2xl font-bold mt-2 text-red-700">₹{totalOutValue.toLocaleString('en-IN')}</p>
            </div>
            <TrendingDown size={32} className="text-red-400" />
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Net Movement</p>
          <p className={`text-3xl font-bold mt-2 ${totalInValue - totalOutValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{(totalInValue - totalOutValue).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg p-4">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by reference number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Types</option>
            <option value="Purchase">Purchase</option>
            <option value="Sale">Sale</option>
            <option value="Adjustment">Adjustment</option>
            <option value="Transfer">Transfer</option>
            <option value="Damage">Damage</option>
            <option value="Return">Return</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Reference No</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">Quantity</th>
                <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                <th className="px-4 py-3 text-right font-semibold">Total Value</th>
                <th className="px-4 py-3 text-left font-semibold">Party</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((movement) => (
                <tr key={movement.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">{new Date(movement.movementDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-blue-600">{movement.referenceNo}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      movement.movementType === 'Purchase' ? 'bg-green-100 text-green-700' :
                      movement.movementType === 'Sale' ? 'bg-blue-100 text-blue-700' :
                      movement.movementType === 'Damage' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {movement.movementType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{movement.quantity}</td>
                  <td className="px-4 py-3 text-right">₹{movement.unitPrice}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{movement.totalValue.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{movement.supplier || movement.customer || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      movement.status === 'Processed' ? 'bg-green-100 text-green-700' :
                      movement.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {movement.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Record Stock Movement</DialogTitle>
            <DialogDescription>Log a new inventory transaction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Movement Type</label>
                <select
                  value={formData.movementType}
                  onChange={(e) => setFormData({...formData, movementType: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Purchase">Purchase</option>
                  <option value="Sale">Sale</option>
                  <option value="Adjustment">Adjustment</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Damage">Damage</option>
                  <option value="Return">Return</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reference No</label>
                <input
                  type="text"
                  value={formData.referenceNo}
                  onChange={(e) => setFormData({...formData, referenceNo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="INV/PO number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select product</option>
                  {state.products.map(p => <option key={p.id} value={p.id}>{p.productName} ({p.skuCode})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={formData.movementDate}
                  onChange={(e) => setFormData({...formData, movementDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supplier/Customer</label>
                <input
                  type="text"
                  value={formData.supplier || formData.customer}
                  onChange={(e) => setFormData(formData.movementType === 'Purchase' ? 
                    {...formData, supplier: e.target.value} : 
                    {...formData, customer: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Party name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Processed">Processed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Additional notes"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleRecordMovement} className="bg-blue-600 hover:bg-blue-700">Record Movement</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
