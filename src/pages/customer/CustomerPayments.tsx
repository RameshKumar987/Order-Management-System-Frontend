import React, { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

// Payment entity: { id, orderId, amount, status, paymentId, method, createdAt }
// PaymentController GET /payments/history → ApiResponse { success, message, data }
type Payment = { id: number; orderId: number; amount: number; status: string; paymentId: string; method: string; createdAt: string };

export const CustomerPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // GET /payments/history → ApiResponse { success, message, data: Payment[] }
    api.get('/payments/history')
      .then(r => {
        // Backend wraps in ApiResponse { success, message, data }
        const payload = r.data?.data ?? r.data;
        setPayments(Array.isArray(payload) ? payload : []);
      })
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  }, []);

  const statusIcon = (s: string) => {
    if (s === 'SUCCESS' || s === 'COMPLETED') return <CheckCircle2 className="w-3 h-3" />;
    if (s === 'FAILED') return <XCircle className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  const statusClass = (s: string) =>
    s === 'SUCCESS' || s === 'COMPLETED' ? 'bg-green-100 text-green-700'
    : s === 'FAILED' ? 'bg-red-100 text-red-700'
    : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Payment History</h1>
        <p className="text-slate-500">View all your past transactions and their statuses.</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />)}</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <CreditCard className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-xl font-semibold text-slate-700">No payments yet</p>
          <p className="text-slate-400 mt-2">Your payment history will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Transaction', 'Method', 'Date', 'Status', 'Amount'].map(h => (
                  <th key={h} className="text-left p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Order #{p.orderId}</p>
                        <p className="text-xs text-slate-400">TXN #{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 capitalize">{p.method?.toLowerCase() ?? '—'}</td>
                  <td className="p-4 text-sm text-slate-500">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass(p.status)}`}>
                      {statusIcon(p.status)} {p.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900">₹{p.amount?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
