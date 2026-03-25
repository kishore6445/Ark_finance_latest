'use client';

import { useState } from 'react';
import { useAppState } from '@/context/app-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package, Plus, Search, Filter, Edit2, Trash2, AlertCircle } from 'lucide-react';

export function StockMasterScreen() {
  const { state, addProduct, updateProduct, deleteProduct } = useAppState();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    skuCode: '',
    productName: '',
    category: 'Raw Materials',
    unit: 'Pcs' as const,
    description: '',
    hsnCode: '',
    gstRate: 18,
    unitCost: 0,
    reorderLevel: 0,
    reorderQuantity: 0,
    status: 'Active' as const,
  });

  const filtered = state.products.filter(p => {
    const matchesSearch = p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.skuCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    const matchesStatus = p.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockItems = filtered.filter(p => p.currentQuantity <= p.reorderLevel).length;

  const handleAddProduct = () => {
    if (editingId) {
      updateProduct(editingId, formData);
      setEditingId(null);
    } else {
      addProduct(formData);
    }
    setFormData({
      skuCode: '', productName: '', category: 'Raw Materials', unit: 'Pcs',
      description: '', hsnCode: '', gstRate: 18, unitCost: 0, reorderLevel: 0,
      reorderQuantity: 0, status: 'Active',
    });
    setShowCreateModal(false);
  };

  const handleEdit = (product: any) => {
    setFormData(product);
    setEditingId(product.id);
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Master</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage products and inventory SKUs</p>
        </div>
        <Button onClick={() => { setEditingId(null); setShowCreateModal(true); }} className="bg-green-600 hover:bg-green-700">
          <Plus size={18} className="mr-2" /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total Products</p>
          <p className="text-3xl font-bold mt-2">{filtered.length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Low Stock Items</p>
          <p className="text-3xl font-bold mt-2 text-orange-600">{lowStockItems}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total Inventory Value</p>
          <p className="text-3xl font-bold mt-2">₹{(filtered.reduce((sum, p) => sum + (p.unitCost * 10), 0)).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Active SKUs</p>
          <p className="text-3xl font-bold mt-2">{filtered.filter(p => p.status === 'Active').length}</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg p-4">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by SKU or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option>All Categories</option>
            <option>Raw Materials</option>
            <option>Finished Goods</option>
            <option>Trading</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Discontinued">Discontinued</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold">SKU Code</th>
                <th className="px-4 py-3 text-left font-semibold">Product Name</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Unit</th>
                <th className="px-4 py-3 text-right font-semibold">Cost</th>
                <th className="px-4 py-3 text-right font-semibold">Reorder Level</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-blue-600">{product.skuCode}</td>
                  <td className="px-4 py-3">{product.productName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{product.category}</td>
                  <td className="px-4 py-3">{product.unit}</td>
                  <td className="px-4 py-3 text-right">₹{product.unitCost}</td>
                  <td className="px-4 py-3 text-right">{product.reorderLevel} {product.unit}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      product.status === 'Active' ? 'bg-green-100 text-green-700' :
                      product.status === 'Inactive' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center flex gap-2 justify-center">
                    <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-700">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>Enter product details and inventory settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">SKU Code</label>
                <input
                  type="text"
                  value={formData.skuCode}
                  onChange={(e) => setFormData({...formData, skuCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="SKU-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({...formData, productName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Raw Materials</option>
                  <option>Finished Goods</option>
                  <option>Trading</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Pcs">Pieces</option>
                  <option value="Kg">Kilogram</option>
                  <option value="Liter">Liter</option>
                  <option value="Box">Box</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Product description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HSN Code</label>
                <input
                  type="text"
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({...formData, hsnCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="HSN code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GST Rate %</label>
                <input
                  type="number"
                  value={formData.gstRate}
                  onChange={(e) => setFormData({...formData, gstRate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="18"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Cost (₹)</label>
                <input
                  type="number"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({...formData, unitCost: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reorder Level</label>
                <input
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({...formData, reorderLevel: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reorder Quantity</label>
                <input
                  type="number"
                  value={formData.reorderQuantity}
                  onChange={(e) => setFormData({...formData, reorderQuantity: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleAddProduct} className="bg-green-600 hover:bg-green-700">
              {editingId ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
