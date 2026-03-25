'use client';

import { useState } from 'react';
import { useAppState } from '@/context/app-state';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

export function StockAdjustmentsScreen() {
  const { state, createStockAdjustment, approveStockAdjustment, rejectStockAdjustment } = useAppState();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  
  const [formData, setFormData] = useState({
    adjustmentType: 'Damaged' as const,
    productId: '',
    adjustmentQuantity: 0,
    previousQuantity: 100,
    reason: '',
    adjustmentDate: new Date().toISOString().split('T')[0],
  });

  const filtered = state.stockAdjustments.filter(a => statusFilter === 'All' || a.status === statusFilter);
  
  const pendingCount = state.stockAdjustments.filter(a => a.status === 'Pending').length;
  const approvedCount = state.stockAdjustments.filter(a => a.status === 'Approved').length;
  const rejectedCount = state.stockAdjustments.filter(a => a.status === 'Rejected').length;

  const handleCreate = () => {
    createStockAdjustment({
      adjustmentType: formData.adjustmentType,
      productId: formData.productId,
      adjustmentQuantity: formData.adjustmentQuantity,
      previousQuantity: formData.previousQuantity,
      adjustedQuantity: formData.previousQuantity - formData.adjustmentQuantity,
      reason: formData.reason,
      adjustmentDate: formData.adjustmentDate,
      status: 'Pending',
      organizationId: 'org_default'
    });
    setFormData({
      adjustmentType: 'Damaged', productId: '', adjustmentQuantity: 0,
      previousQuantity: 100, reason: '', adjustmentDate: new Date().toISOString().split('T')[0],
    });
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Adjustments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage stock damage, loss, and corrections</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-orange-600 hover:bg-orange-700">
          <AlertCircle size={18} className="mr-2" /> Create Adjustment
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-700">Pending Approvals</p>
              <p className="text-3xl font-bold mt-2 text-yellow-700">{pendingCount}</p>
            </div>
            <Clock size={32} className="text-yellow-400" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700">Approved</p>
              <p className="text-3xl font-bold mt-2 text-green-700">{approvedCount}</p>
            </div>
            <CheckCircle size={32} className="text-green-400" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-700">Rejected</p>
              <p className="text-3xl font-bold mt-2 text-red-700">{rejectedCount}</p>
            </div>
            <XCircle size={32} className="text-red-400" />
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total Adjustments</p>
          <p className="text-3xl font-bold mt-2">{state.stockAdjustments.length}</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg p-4">
        <div className="flex gap-2 mb-4">
          {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === status 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Product</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">Adjusted Qty</th>
                <th className="px-4 py-3 text-left font-semibold">Reason</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((adj) => (
                <tr key={adj.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">{new Date(adj.adjustmentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium">{state.products.find(p => p.id === adj.productId)?.productName || 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-medium">
                      {adj.adjustmentType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">-{adj.adjustmentQuantity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{adj.reason}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      adj.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      adj.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {adj.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {adj.status === 'Pending' && (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => approveStockAdjustment(adj.id, 'manager')}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectStockAdjustment(adj.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    )}
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
            <DialogTitle>Create Stock Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Adjustment Type</label>
                <select
                  value={formData.adjustmentType}
                  onChange={(e) => setFormData({...formData, adjustmentType: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Damaged">Damaged</option>
                  <option value="Loss">Loss/Theft</option>
                  <option value="Shrinkage">Shrinkage</option>
                  <option value="Correction">Correction</option>
                  <option value="Write-off">Write-off</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select product</option>
                  {state.products.map(p => <option key={p.id} value={p.id}>{p.productName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Previous Quantity</label>
                <input
                  type="number"
                  value={formData.previousQuantity}
                  onChange={(e) => setFormData({...formData, previousQuantity: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adjustment Quantity</label>
                <input
                  type="number"
                  value={formData.adjustmentQuantity}
                  onChange={(e) => setFormData({...formData, adjustmentQuantity: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={formData.adjustmentDate}
                  onChange={(e) => setFormData({...formData, adjustmentDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={2}
                  placeholder="Reason for adjustment"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700">Create Adjustment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
