'use client';

import { useState } from 'react';
import { useAppState } from '@/context/app-state';
import { Button } from '@/components/ui/button';
import { TrendingDown, AlertTriangle, BarChart3, Download } from 'lucide-react';

export function StockReportsScreen() {
  const { state } = useAppState();
  const [reportType, setReportType] = useState<'aging' | 'slowmoving' | 'reorder'>('aging');

  const stockAging = state.products.map(p => ({
    ...p,
    lastMovement: Math.floor(Math.random() * 180),
  })).sort((a, b) => b.lastMovement - a.lastMovement);

  const slowMoving = state.products.filter(p => Math.random() > 0.7);
  const lowStock = state.products.filter(p => p.reorderLevel > 0);
  const outOfStock = state.products.filter(p => Math.random() > 0.8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Inventory analysis and insights</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download size={18} className="mr-2" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total SKUs</p>
          <p className="text-3xl font-bold mt-2">{state.products.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-700">Slow Moving Items</p>
              <p className="text-3xl font-bold mt-2 text-orange-700">{slowMoving.length}</p>
            </div>
            <TrendingDown size={32} className="text-orange-400" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-700">Low Stock Alert</p>
              <p className="text-3xl font-bold mt-2 text-red-700">{lowStock.length}</p>
            </div>
            <AlertTriangle size={32} className="text-red-400" />
          </div>
        </div>
        <div className="bg-red-100 border border-red-400 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-800 font-semibold">Out of Stock</p>
              <p className="text-3xl font-bold mt-2 text-red-700">{outOfStock.length}</p>
            </div>
            <AlertTriangle size={32} className="text-red-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg p-4">
        <div className="flex gap-2 mb-4">
          {(['aging', 'slowmoving', 'reorder'] as const).map(type => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                reportType === type 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {type === 'aging' && 'Stock Aging'}
              {type === 'slowmoving' && 'Slow Moving'}
              {type === 'reorder' && 'Reorder Analysis'}
            </button>
          ))}
        </div>

        {reportType === 'aging' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-left font-semibold">SKU</th>
                  <th className="px-4 py-3 text-right font-semibold">Days in Stock</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {stockAging.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.productName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.skuCode}</td>
                    <td className="px-4 py-3 text-right">{p.lastMovement} days</td>
                    <td className="px-4 py-3 text-center">
                      {p.lastMovement > 120 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Old Stock</span>
                      ) : p.lastMovement > 60 ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Aging</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Fresh</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'slowmoving' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-right font-semibold">Movement Score</th>
                  <th className="px-4 py-3 text-center font-semibold">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {slowMoving.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.productName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3 text-right">{(Math.random() * 50).toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">Discount/Promote</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'reorder' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-right font-semibold">Reorder Level</th>
                  <th className="px-4 py-3 text-right font-semibold">Reorder Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Lead Time</th>
                  <th className="px-4 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.productName}</td>
                    <td className="px-4 py-3 text-right">{p.reorderLevel}</td>
                    <td className="px-4 py-3 text-right">{p.reorderQuantity}</td>
                    <td className="px-4 py-3 text-right">{Math.floor(Math.random() * 14) + 1} days</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Reorder Now</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
