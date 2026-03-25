'use client';

import { useState } from 'react';
import { useAppState } from '@/context/app-state';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, Download, Filter } from 'lucide-react';

export function StockValuationScreen() {
  const { state, finalizeStockValuation } = useAppState();
  const [selectedMethod, setSelectedMethod] = useState<'FIFO' | 'WEIGHTED_AVG' | 'LIFO'>('FIFO');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const calculateValuation = (method: 'FIFO' | 'WEIGHTED_AVG' | 'LIFO') => {
    const movements = state.stockMovements.filter(m => m.status === 'Processed');
    let totalQuantity = 0;
    let totalValue = 0;
    const productWise = new Map();

    movements.forEach(m => {
      if (['Purchase', 'Return'].includes(m.movementType)) {
        totalQuantity += m.quantity;
        totalValue += m.totalValue;
        const key = m.productId;
        productWise.set(key, (productWise.get(key) || 0) + m.totalValue);
      } else if (['Sale', 'Damage'].includes(m.movementType)) {
        totalQuantity -= m.quantity;
        totalValue -= m.totalValue;
      }
    });

    return {
      totalQuantity: Math.max(0, totalQuantity),
      totalValue: Math.max(0, totalValue),
      productWiseBreakdown: Array.from(productWise.entries()).map(([id, value]) => ({
        productId: id,
        quantity: Math.max(0, totalQuantity / Math.max(1, productWise.size)),
        value: value
      }))
    };
  };

  const valuation = calculateValuation(selectedMethod);
  const avgUnitValue = valuation.totalQuantity > 0 ? valuation.totalValue / valuation.totalQuantity : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Valuation</h1>
          <p className="text-sm text-muted-foreground mt-1">Inventory valuation using {selectedMethod.replace('_', ' ')}</p>
        </div>
        <Button onClick={() => setShowFinalizeModal(true)} className="bg-green-600 hover:bg-green-700">
          <TrendingUp size={18} className="mr-2" /> Finalize Valuation
        </Button>
      </div>

      <div className="bg-white border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Select Valuation Method</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['FIFO', 'WEIGHTED_AVG', 'LIFO'] as const).map(method => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={`p-4 rounded-lg border-2 transition ${
                selectedMethod === method 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold">{method === 'WEIGHTED_AVG' ? 'Weighted Average' : method}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {method === 'FIFO' && 'First In, First Out - Conservative valuation'}
                {method === 'WEIGHTED_AVG' && 'Smoothed average cost valuation'}
                {method === 'LIFO' && 'Last In, First Out - Lower inventory value'}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total Quantity</p>
          <p className="text-3xl font-bold mt-2">{valuation.totalQuantity.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">units</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total Value</p>
          <p className="text-3xl font-bold mt-2">₹{valuation.totalValue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Average Unit Value</p>
          <p className="text-3xl font-bold mt-2">₹{avgUnitValue.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-700 font-medium">Asset Value (Balance Sheet)</p>
          <p className="text-3xl font-bold mt-2 text-blue-600">₹{valuation.totalValue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Product-wise Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold">Product</th>
                <th className="px-4 py-3 text-right font-semibold">Quantity</th>
                <th className="px-4 py-3 text-right font-semibold">Value</th>
                <th className="px-4 py-3 text-right font-semibold">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {valuation.productWiseBreakdown.map((item, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">{state.products.find(p => p.id === item.productId)?.productName || 'Unknown'}</td>
                  <td className="px-4 py-3 text-right">{item.quantity.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{item.value.toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                  <td className="px-4 py-3 text-right">{((item.value / valuation.totalValue) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showFinalizeModal} onOpenChange={setShowFinalizeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Stock Valuation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Valuation Summary</p>
              <div className="mt-2 space-y-1 text-sm">
                <p>Method: <span className="font-semibold">{selectedMethod.replace('_', ' ')}</span></p>
                <p>Total Quantity: <span className="font-semibold">{valuation.totalQuantity.toFixed(2)} units</span></p>
                <p>Total Value: <span className="font-semibold">₹{valuation.totalValue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span></p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">This will finalize the stock valuation and create a record in your financial statements.</p>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowFinalizeModal(false)}>Cancel</Button>
            <Button onClick={() => {
              finalizeStockValuation({
                valuationDate: new Date().toISOString().split('T')[0],
                valuationMethod: selectedMethod,
                totalQuantity: valuation.totalQuantity,
                totalValue: valuation.totalValue,
                productWiseBreakdown: valuation.productWiseBreakdown,
                approvalStatus: 'Draft',
                organizationId: 'org_default'
              });
              setShowFinalizeModal(false);
            }} className="bg-green-600 hover:bg-green-700">Finalize</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
