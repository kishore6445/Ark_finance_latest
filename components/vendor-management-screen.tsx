'use client';

import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Mail, Phone, MapPin, DollarSign, MoreHorizontal, X, AlertCircle, Calendar, Bell, CheckCircle } from 'lucide-react';
import { useAppState } from '@/context/app-state';

export function VendorManagementScreen() {
  const { state, addVendorPayment, updateVendorPayment, deleteVendorPayment, markVendorPaymentAsPaid, addNotification } = useAppState();
  const [activeTab, setActiveTab] = useState<'vendors' | 'payments'>('payments');
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorId: '',
    description: '',
    paymentType: 'Software' as const,
    amount: '',
    dueDate: '',
    frequency: 'One-time' as const,
    isRecurring: false,
    notificationDaysBeforeDue: 7,
    category: '',
    notes: '',
  });

  // Get upcoming payments (within 7 days)
  const upcomingPayments = useMemo(() => {
    return state.vendorPayments.filter(p => {
      const dueDate = new Date(p.dueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue > 0 && p.status !== 'Paid' && p.status !== 'Cancelled';
    });
  }, [state.vendorPayments]);

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorName || !formData.dueDate || !formData.amount) return;

    addVendorPayment({
      vendorName: formData.vendorName,
      vendorId: formData.vendorId,
      description: formData.description,
      paymentType: formData.paymentType,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      frequency: formData.frequency,
      isRecurring: formData.isRecurring,
      status: 'Scheduled',
      notificationSent: false,
      notificationDaysBeforeDue: formData.notificationDaysBeforeDue,
      category: formData.category,
      notes: formData.notes,
    });

    // Add notification for upcoming payment
    const daysUntilDue = Math.ceil((new Date(formData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= formData.notificationDaysBeforeDue && daysUntilDue > 0) {
      addNotification({
        type: 'general',
        title: `Upcoming Vendor Payment: ${formData.vendorName}`,
        message: `${formData.description} payment of ₹${formData.amount} is due in ${daysUntilDue} days on ${formData.dueDate}`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    setFormData({
      vendorName: '',
      vendorId: '',
      description: '',
      paymentType: 'Software',
      amount: '',
      dueDate: '',
      frequency: 'One-time',
      isRecurring: false,
      notificationDaysBeforeDue: 7,
      category: '',
      notes: '',
    });
    setShowAddPayment(false);
  };

  const handlePaymentStatusUpdate = (paymentId: string, newStatus: string) => {
    if (newStatus === 'Paid') {
      markVendorPaymentAsPaid(paymentId, new Date().toISOString().split('T')[0]);
    } else {
      updateVendorPayment(paymentId, { status: newStatus as any });
    }
  };

  const filteredPayments = state.vendorPayments.filter(p =>
    p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'Software': return 'bg-purple-100 text-purple-800';
      case 'Internet': return 'bg-blue-100 text-blue-800';
      case 'Subscription': return 'bg-pink-100 text-pink-800';
      case 'Maintenance': return 'bg-orange-100 text-orange-800';
      case 'Utilities': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-2 font-medium text-sm ${
            activeTab === 'payments'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Vendor Payments
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 px-2 font-medium text-sm ${
            activeTab === 'vendors'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Vendors
        </button>
      </div>

      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Payment Schedule</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage and track vendor payment obligations</p>
            </div>
            <button
              onClick={() => setShowAddPayment(!showAddPayment)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Add Payment
            </button>
          </div>

          {/* Upcoming Payments Alert */}
          {upcomingPayments.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">{upcomingPayments.length} payment{upcomingPayments.length > 1 ? 's' : ''} due within 7 days</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Total: ₹{upcomingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Add Payment Form */}
          {showAddPayment && (
            <div className="bg-muted rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Add New Payment</h3>
                <button
                  onClick={() => setShowAddPayment(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddPayment} className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Vendor Name"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  className="col-span-2 px-3 py-2 border border-border rounded-lg text-sm font-normal"
                  required
                />

                <input
                  type="text"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-2 px-3 py-2 border border-border rounded-lg text-sm font-normal"
                />

                <select
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as any })}
                  className="px-3 py-2 border border-border rounded-lg text-sm font-normal"
                >
                  <option>Software</option>
                  <option>Internet</option>
                  <option>Maintenance</option>
                  <option>Subscription</option>
                  <option>Utilities</option>
                  <option>Other</option>
                </select>

                <input
                  type="number"
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg text-sm font-normal"
                  required
                />

                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg text-sm font-normal"
                  required
                />

                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  className="px-3 py-2 border border-border rounded-lg text-sm font-normal"
                >
                  <option>One-time</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Yearly</option>
                </select>

                <input
                  type="number"
                  placeholder="Notify days before"
                  value={formData.notificationDaysBeforeDue}
                  onChange={(e) => setFormData({ ...formData, notificationDaysBeforeDue: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-border rounded-lg text-sm font-normal"
                />

                <input
                  type="text"
                  placeholder="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="col-span-2 px-3 py-2 border border-border rounded-lg text-sm font-normal"
                />

                <textarea
                  placeholder="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="col-span-2 px-3 py-2 border border-border rounded-lg text-sm font-normal"
                  rows={3}
                />

                <label className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Recurring Payment</span>
                </label>

                <button
                  type="submit"
                  className="col-span-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90"
                >
                  Create Payment
                </button>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm font-normal"
            />
          </div>

          {/* Payment List */}
          <div className="space-y-3">
            {filteredPayments.map((payment) => {
              const daysUntilDue = Math.ceil((new Date(payment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysUntilDue < 0 && payment.status !== 'Paid';

              return (
                <div key={payment.id} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between hover:shadow-sm transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{payment.vendorName}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPaymentTypeColor(payment.paymentType)}`}>
                        {payment.paymentType}
                      </span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{payment.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">₹{payment.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{payment.dueDate}</span>
                        {isOverdue && <span className="ml-1 text-destructive font-medium">({Math.abs(daysUntilDue)} days overdue)</span>}
                        {!isOverdue && daysUntilDue > 0 && <span className="ml-1 text-blue-600">({daysUntilDue} days left)</span>}
                      </div>
                      {payment.isRecurring && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Recurring</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {payment.status !== 'Paid' && (
                      <button
                        onClick={() => handlePaymentStatusUpdate(payment.id, 'Paid')}
                        className="px-3 py-1.5 bg-accent text-accent-foreground rounded text-sm font-medium hover:opacity-90"
                      >
                        Mark Paid
                      </button>
                    )}
                    {payment.status === 'Paid' && <CheckCircle className="w-5 h-5 text-accent" />}
                    <button
                      onClick={() => deleteVendorPayment(payment.id)}
                      className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredPayments.length === 0 && !showAddPayment && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No payments found. Add your first vendor payment to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vendor management features coming soon</p>
        </div>
      )}
    </div>
  );
}
