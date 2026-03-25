'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trash2, Plus, Save } from 'lucide-react';
import { InvoicePreview } from '@/components/invoice-preview';
import { exportInvoiceToPDF } from '@/lib/pdf-export';

interface LineItem {
  id: string;
  serviceName: string;
  description: string;
  quantity: number;
  rate: number;
  gstPercent: number;
  gstAmount: number;
  lineTotal: number;
}

interface CreateInvoicePageProps {
  onBack: () => void;
  nextInvoiceNumber: string;
}

export function CreateInvoicePage({ onBack, nextInvoiceNumber }: CreateInvoicePageProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    invoiceNo: nextInvoiceNumber,
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceType: 'Revenue Invoice',
    referenceNo: '',
    currency: 'INR',
    partyName: '',
    partyGSTNo: '',
    billingAddress: '',
    shippingAddress: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    companyGSTNo: '18ABCDE1234F1Z0',
    taxType: 'GST Exclusive',
    applyUniformGST: false,
    uniformGSTPercent: 18,
    notesForClient: '',
    termsConditions: '',
    paymentType: 'Full Payment',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    bankDetails: '',
    discount: 0,
  });

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      serviceName: '',
      description: '',
      quantity: 1,
      rate: 0,
      gstPercent: 18,
      gstAmount: 0,
      lineTotal: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const deleteLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // Auto-calculate GST and line total
          const quantity = updated.quantity || 1;
          const rate = updated.rate || 0;
          const gstPercent = updated.gstPercent || 18;
          const subtotal = quantity * rate;
          updated.gstAmount = formData.taxType === 'GST Exclusive' ? (subtotal * gstPercent) / 100 : 0;
          updated.lineTotal = subtotal + updated.gstAmount;
          return updated;
        }
        return item;
      })
    );
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const totalGST = lineItems.reduce((sum, item) => sum + item.gstAmount, 0);
  const grandTotal = subtotal + totalGST - formData.discount;

  const handleSubmit = () => {
    if (!formData.partyName) {
      alert('Please enter party name');
      return;
    }
    if (lineItems.length === 0) {
      alert('Please add at least one service/line item');
      return;
    }
    // TODO: Submit to backend
    alert(`Invoice ${formData.invoiceNo} created successfully!`);
    onBack();
  };

  const isExportDisabled = !formData.partyName || lineItems.length === 0;

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    await exportInvoiceToPDF(previewRef.current, formData.invoiceNo);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create New Invoice</h1>
              <p className="text-sm text-muted-foreground">Fill in the details below to generate a new invoice.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-primary text-primary-foreground">
              Create Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column (70%) */}
          <div className="col-span-2 space-y-6">
            {/* Section 1: Basic Information */}
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-3">Basic Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Invoice Number</label>
                  <input type="text" value={formData.invoiceNo} disabled className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm font-medium cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground mt-1">Auto-generated</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Invoice Date</label>
                  <input type="date" value={formData.invoiceDate} onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Type</label>
                  <select value={formData.invoiceType} onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm">
                    <option>Revenue Invoice</option>
                    <option>Proforma Invoice</option>
                    <option>Credit Note</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Reference / PO Number (Optional)</label>
                  <input type="text" value={formData.referenceNo} onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })} placeholder="PO-2024-001" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Currency</label>
                  <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm">
                    <option>INR</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Section 2: Party Information */}
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-3">Party Information</h3>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Party Name *</label>
                <input type="text" value={formData.partyName} onChange={(e) => setFormData({ ...formData, partyName: e.target.value })} placeholder="Enter party name" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Party GST Number</label>
                <input type="text" value={formData.partyGSTNo} onChange={(e) => setFormData({ ...formData, partyGSTNo: e.target.value })} placeholder="18AABCT1234H1Z0" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Billing Address</label>
                <textarea value={formData.billingAddress} onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })} placeholder="Enter complete billing address" rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Shipping Address</label>
                <textarea value={formData.shippingAddress} onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })} placeholder="Leave blank if same as billing" rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
                <p className="text-xs text-muted-foreground mt-1">Leave shipping address empty if same as billing address.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Contact Person</label>
                  <input type="text" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Phone Number</label>
                  <input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
              </div>
            </Card>

            {/* Section 3: Services / Line Items */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-semibold text-foreground">Services / Line Items</h3>
                <Button onClick={addLineItem} size="sm" variant="outline" className="gap-2">
                  <Plus size={16} />
                  Add Service
                </Button>
              </div>

              {lineItems.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No services added yet. Click "Add Service" to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-semibold text-foreground w-1/4">Service Name</th>
                        <th className="text-left py-2 px-3 font-semibold text-foreground w-1/4">Description</th>
                        <th className="text-right py-2 px-3 font-semibold text-foreground w-12">Qty</th>
                        <th className="text-right py-2 px-3 font-semibold text-foreground w-16">Rate</th>
                        <th className="text-right py-2 px-3 font-semibold text-foreground w-16">GST %</th>
                        <th className="text-right py-2 px-3 font-semibold text-foreground w-16">GST Amt</th>
                        <th className="text-right py-2 px-3 font-semibold text-foreground w-20">Line Total</th>
                        <th className="text-center py-2 px-3 font-semibold text-foreground w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-3">
                            <input type="text" value={item.serviceName} onChange={(e) => updateLineItem(item.id, { serviceName: e.target.value })} placeholder="Service name" className="w-full px-2 py-1 bg-background border border-border rounded text-sm" />
                          </td>
                          <td className="py-3 px-3">
                            <input type="text" value={item.description} onChange={(e) => updateLineItem(item.id, { description: e.target.value })} placeholder="Description" className="w-full px-2 py-1 bg-background border border-border rounded text-sm" />
                          </td>
                          <td className="py-3 px-3">
                            <input type="number" value={item.quantity} onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-right" />
                          </td>
                          <td className="py-3 px-3">
                            <input type="number" value={item.rate} onChange={(e) => updateLineItem(item.id, { rate: parseFloat(e.target.value) || 0 })} placeholder="0" className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-right" />
                          </td>
                          <td className="py-3 px-3">
                            <input type="number" value={item.gstPercent} onChange={(e) => updateLineItem(item.id, { gstPercent: parseFloat(e.target.value) || 0 })} placeholder="18" className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-right" />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-medium text-foreground">₹{item.gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-semibold text-foreground">₹{item.lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button onClick={() => deleteLineItem(item.id)} className="p-1 hover:bg-red-50 rounded transition-colors">
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Section 4: Tax Settings */}
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-3">Tax Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Tax Type</label>
                  <select value={formData.taxType} onChange={(e) => setFormData({ ...formData, taxType: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm">
                    <option>No Tax</option>
                    <option>GST Inclusive</option>
                    <option>GST Exclusive</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.applyUniformGST} onChange={(e) => setFormData({ ...formData, applyUniformGST: e.target.checked })} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm font-medium text-foreground">Apply same GST % to all</span>
                  </label>
                </div>
              </div>
            </Card>

            {/* Section 5: Notes */}
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-3">Notes</h3>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Notes for Client</label>
                <textarea value={formData.notesForClient} onChange={(e) => setFormData({ ...formData, notesForClient: e.target.value })} placeholder="Add any additional notes for the client" rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Terms & Conditions</label>
                <textarea value={formData.termsConditions} onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })} placeholder="Payment due within 7 days of invoice date." rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
              </div>
            </Card>
          </div>

          {/* Right Column (30%) - Sticky Summary */}
          <div className="col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Invoice Summary */}
              <Card className="p-6 space-y-4 border-border">
                <h3 className="text-lg font-semibold text-foreground border-b pb-3">Invoice Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total GST</span>
                    <span className="font-medium text-foreground">₹{totalGST.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Discount</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-muted rounded text-foreground">₹</span>
                      <input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })} className="w-16 px-2 py-1 bg-background border border-border rounded text-sm text-right" />
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground font-semibold">Grand Total</span>
                      <span className="text-2xl font-bold text-primary">₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Details */}
              <Card className="p-6 space-y-4 border-border">
                <h3 className="text-lg font-semibold text-foreground border-b pb-3">Payment Details</h3>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Payment Type</label>
                  <select value={formData.paymentType} onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm">
                    <option>Full Payment</option>
                    <option>Partial Payment</option>
                    <option>Advance Payment</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Due Date</label>
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Payment Method</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm">
                    <option>Bank Transfer</option>
                    <option>UPI</option>
                    <option>Credit Card</option>
                    <option>Cash</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Bank Details (Optional)</label>
                  <textarea value={formData.bankDetails} onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })} placeholder="Bank name, account number, IFSC code" rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
                </div>
              </Card>

              {/* Company Info */}
              <Card className="p-6 space-y-4 border-border">
                <h3 className="text-lg font-semibold text-foreground border-b pb-3">Company Information</h3>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Company GST Number</label>
                  <input type="text" value={formData.companyGSTNo} onChange={(e) => setFormData({ ...formData, companyGSTNo: e.target.value })} placeholder="18ABCDE1234F1Z0" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
              </Card>
            </div>
          </div>

          {/* Right Column (30%) - Invoice Preview */}
          <div className="col-span-1">
            <div className="sticky top-24 space-y-6">
              <div ref={previewRef} className="hidden">
                <InvoicePreview
                  invoiceNo={formData.invoiceNo}
                  invoiceDate={formData.invoiceDate}
                  dueDate={formData.dueDate}
                  invoiceType={formData.invoiceType}
                  partyName={formData.partyName}
                  partyGSTNo={formData.partyGSTNo}
                  billingAddress={formData.billingAddress}
                  shippingAddress={formData.shippingAddress}
                  contactPerson={formData.contactPerson}
                  phoneNumber={formData.phoneNumber}
                  email={formData.email}
                  companyGSTNo={formData.companyGSTNo}
                  lineItems={lineItems}
                  subtotal={subtotal}
                  totalGST={totalGST}
                  discount={formData.discount}
                  grandTotal={grandTotal}
                  paymentType={formData.paymentType}
                  paymentMethod={formData.paymentMethod}
                  bankDetails={formData.bankDetails}
                  notesForClient={formData.notesForClient}
                  termsConditions={formData.termsConditions}
                  onExportPDF={handleExportPDF}
                  isExportDisabled={isExportDisabled}
                />
              </div>
              <InvoicePreview
                invoiceNo={formData.invoiceNo}
                invoiceDate={formData.invoiceDate}
                dueDate={formData.dueDate}
                invoiceType={formData.invoiceType}
                partyName={formData.partyName}
                partyGSTNo={formData.partyGSTNo}
                billingAddress={formData.billingAddress}
                shippingAddress={formData.shippingAddress}
                contactPerson={formData.contactPerson}
                phoneNumber={formData.phoneNumber}
                email={formData.email}
                companyGSTNo={formData.companyGSTNo}
                lineItems={lineItems}
                subtotal={subtotal}
                totalGST={totalGST}
                discount={formData.discount}
                grandTotal={grandTotal}
                paymentType={formData.paymentType}
                paymentMethod={formData.paymentMethod}
                bankDetails={formData.bankDetails}
                notesForClient={formData.notesForClient}
                termsConditions={formData.termsConditions}
                onExportPDF={handleExportPDF}
                isExportDisabled={isExportDisabled}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 mt-8 justify-end">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary text-primary-foreground">
            Create Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}
