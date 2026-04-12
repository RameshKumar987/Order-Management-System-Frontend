import React, { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { CreditCard, CheckCircle2, XCircle, Clock, History } from 'lucide-react';
import { toast } from 'sonner';

type Payment = { id: number; orderId: number; amount: number; status: string; paymentId: string; method: string; createdAt: string };

export const CustomerPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ordersMap, setOrdersMap] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);

  // Pagination bounds
  const ITEMS_PER_PAGE = 7;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    Promise.all([
      api.get('/payments/history'),
      api.get('/orders/my-orders')
    ])
      .then(([payRes, ordRes]) => {
        const payload = payRes.data?.data ?? payRes.data;
        setPayments(Array.isArray(payload) ? payload : []);

        const ordersList = ordRes.data && Array.isArray(ordRes.data) ? ordRes.data : [];
        const map: Record<number, any> = {};
        ordersList.forEach(o => map[o.id] = o);
        setOrdersMap(map);
      })
      .catch((err) => {
        if (err.response?.config?.url?.includes('/payments/history')) {
          toast.error('Failed to load payments');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const sortedPayments = [...payments].sort((a, b) => b.id - a.id);
  const totalPages = Math.ceil(sortedPayments.length / ITEMS_PER_PAGE);
  const currentPayments = sortedPayments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
        <p className="text-slate-500">View and track all your transactions.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Transaction', 'Method', 'Date', 'Status', 'Amount'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 animate-pulse">Loading payments...</td></tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-slate-600">No payment history</p>
                    <p className="text-sm text-slate-400">Your completed transactions will appear here.</p>
                  </td>
                </tr>
              ) : (
                currentPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {ordersMap[p.orderId]?.items?.[0]?.productName || `Order #${p.orderId}`}
                            {ordersMap[p.orderId]?.items?.length > 1 && <span className="text-xs text-slate-400 ml-1">(+{ordersMap[p.orderId].items.length - 1} more)</span>}
                          </p>
                          <p className="text-xs text-slate-400">Order #{p.orderId} • TXN #{p.id}</p>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
            <span className="text-sm font-medium text-slate-500">Showing page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
