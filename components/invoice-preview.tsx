'use client';

import { Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRef, useState } from 'react';

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

interface InvoicePreviewProps {
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  invoiceType: string;
  partyName: string;
  partyGSTNo: string;
  billingAddress: string;
  shippingAddress: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  companyGSTNo: string;
  lineItems: LineItem[];
  subtotal: number;
  totalGST: number;
  discount: number;
  grandTotal: number;
  paymentType: string;
  paymentMethod: string;
  bankDetails: string;
  notesForClient: string;
  termsConditions: string;
  onExportPDF: () => void;
  isExportDisabled: boolean;
}

export function InvoicePreview({
  invoiceNo,
  invoiceDate,
  dueDate,
  invoiceType,
  partyName,
  partyGSTNo,
  billingAddress,
  shippingAddress,
  contactPerson,
  phoneNumber,
  email,
  companyGSTNo,
  lineItems,
  subtotal,
  totalGST,
  discount,
  grandTotal,
  paymentType,
  paymentMethod,
  bankDetails,
  notesForClient,
  termsConditions,
  onExportPDF,
  isExportDisabled,
}: InvoicePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const InvoiceContent = () => (
    <div ref={previewRef} className="bg-white p-8 space-y-6 print:p-0">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">TAX INVOICE</h1>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700">Invoice No.</p>
            <p className="text-lg font-bold text-slate-900">{invoiceNo || 'INV-XXX'}</p>
          </div>
          <div className="text-right space-y-3">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Invoice Date</p>
              <p className="text-sm font-semibold text-slate-900">{formatDate(invoiceDate)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Due Date</p>
              <p className="text-sm font-semibold text-slate-900">{formatDate(dueDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Company & Party Info */}
      <div className="grid grid-cols-2 gap-8">
        {/* From */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">From</p>
          <p className="text-sm font-semibold text-slate-900">Your Company Name</p>
          <p className="text-xs text-slate-600">GST: {companyGSTNo}</p>
        </div>

        {/* Bill To */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Bill To</p>
          <p className="text-sm font-semibold text-slate-900">{partyName || 'Party Name'}</p>
          {partyGSTNo && <p className="text-xs text-slate-600">GST: {partyGSTNo}</p>}
          {billingAddress && <p className="text-xs text-slate-600 whitespace-pre-wrap">{billingAddress}</p>}
          {contactPerson && <p className="text-xs text-slate-600">{contactPerson}</p>}
          {phoneNumber && <p className="text-xs text-slate-600">{phoneNumber}</p>}
          {email && <p className="text-xs text-slate-600">{email}</p>}
        </div>
      </div>

      {/* Shipping Address if different */}
      {shippingAddress && billingAddress !== shippingAddress && (
        <div className="grid grid-cols-2 gap-8 pt-4">
          <div />
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Ship To</p>
            <p className="text-xs text-slate-600 whitespace-pre-wrap">{shippingAddress}</p>
          </div>
        </div>
      )}

      {/* Line Items Table */}
      <div className="space-y-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-300">
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">S.No</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Service/Item</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Description</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">Qty</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">Rate</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">GST %</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">GST Amount</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length > 0 ? (
              lineItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="px-3 py-2 text-slate-900">{idx + 1}</td>
                  <td className="px-3 py-2 text-slate-900 font-medium">{item.serviceName}</td>
                  <td className="px-3 py-2 text-slate-600 text-xs">{item.description}</td>
                  <td className="px-3 py-2 text-right text-slate-900">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-slate-900">{formatCurrency(item.rate)}</td>
                  <td className="px-3 py-2 text-right text-slate-900">{item.gstPercent}%</td>
                  <td className="px-3 py-2 text-right text-slate-900">{formatCurrency(item.gstAmount)}</td>
                  <td className="px-3 py-2 text-right text-slate-900 font-semibold">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400 text-sm">
                  No line items added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-80 space-y-2 border-t-2 border-slate-300 pt-4">
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Subtotal</span>
            <span className="text-sm font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Total GST</span>
            <span className="text-sm font-semibold text-slate-900">{formatCurrency(totalGST)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Discount</span>
              <span className="text-sm font-semibold text-slate-900">-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
            <span className="text-sm font-bold text-slate-900">Grand Total</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      {(paymentType || paymentMethod || bankDetails) && (
        <div className="space-y-2 pt-4 border-t border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payment Details</p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {paymentType && (
              <div>
                <p className="text-slate-500">Payment Type</p>
                <p className="text-slate-900 font-medium">{paymentType}</p>
              </div>
            )}
            {paymentMethod && (
              <div>
                <p className="text-slate-500">Payment Method</p>
                <p className="text-slate-900 font-medium">{paymentMethod}</p>
              </div>
            )}
            {bankDetails && (
              <div className="col-span-2">
                <p className="text-slate-500">Bank Details</p>
                <p className="text-slate-900 font-medium whitespace-pre-wrap">{bankDetails}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes & Terms */}
      {(notesForClient || termsConditions) && (
        <div className="space-y-2 pt-4 border-t border-slate-200">
          {notesForClient && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">{notesForClient}</p>
            </div>
          )}
          {termsConditions && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Terms & Conditions</p>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">{termsConditions}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-4xl my-8">
          <Card className="p-0 space-y-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Invoice Preview</h3>
              <div className="flex gap-2">
                <Button
                  onClick={onExportPDF}
                  disabled={isExportDisabled}
                  size="sm"
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download size={16} />
                  Export PDF
                </Button>
                <Button onClick={() => setIsFullscreen(false)} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </div>
            <div className="px-6 pb-6 overflow-y-auto max-h-[calc(100vh-180px)]">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <InvoiceContent />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Card className="space-y-4 h-fit sticky top-20">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Invoice Preview</h3>
          <p className="text-xs text-slate-500 mt-1">Live preview of printable invoice</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsFullscreen(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Maximize2 size={16} />
          </Button>
          <Button
            onClick={onExportPDF}
            disabled={isExportDisabled}
            size="sm"
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            <Download size={16} />
            Export PDF
          </Button>
        </div>
      </div>
      <div className="px-6 pb-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <InvoiceContent />
        </div>
      </div>
    </Card>
  );
}
