import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { Package, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// OrderDto: { id, userId, status, items: [{productId, productName, quantity, price}] }
type OrderItem = { productId: number; productName: string; quantity: number; price: number };
type Order = { id: number; userId: number; status: string; items: OrderItem[] };

const statusColor = (s: string) => ({
  DELIVERED: 'bg-green-100 text-green-700 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PAYMENT_PENDING: 'bg-orange-100 text-orange-700 border-orange-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}[s] ?? 'bg-slate-100 text-slate-700 border-slate-200');

const orderTotal = (o: Order) =>
  o.items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

declare var Razorpay: any;

export const CustomerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my-orders')
      .then(r => setOrders(r.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const cancelOrder = async (id: number) => {
    try {
      await api.put(`/orders/${id}/cancel`);
      toast.success('Order cancelled');
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o));
    } catch { toast.error('Failed to cancel order'); }
  };

  const payOrder = async (id: number) => {
    try {
      // 1. Create Razorpay Order in backend
      const res = await api.post(`/payments/razorpay/create-order/${id}`);
      const rzpData = res.data.data; // { rzpOrderId, amount, currency, keyId, orderId }

      const options = {
        key: rzpData.keyId,
        amount: rzpData.amount * 100,
        currency: rzpData.currency,
        name: "Order Management System",
        description: `Payment for Order #${id}`,
        order_id: rzpData.rzpOrderId,
        handler: async (response: any) => {
          try {
            // 2. Verify Payment in backend
            const verifyRes = await api.post('/payments/razorpay/verify', {
              ...response,
              orderId: id
            });
            
            if (verifyRes.data.success) {
              toast.success('Payment successful! Order confirmed.');
              setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CONFIRMED' } : o));
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            toast.error('Verification error');
          }
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
        },
        theme: {
          color: "#4f46e5",
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();

    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Sort natively by newest ID first
  const sortedOrders = [...orders].sort((a, b) => b.id - a.id);
  const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE);
  const currentOrders = sortedOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">My Orders</h1>
        <p className="text-slate-500">Track and manage your recent purchases and active orders.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-lg">No orders found</p>
          <Link to="/customer/products" className="inline-flex mt-4 text-indigo-600 font-medium hover:text-indigo-700">Start shopping <ArrowRight className="w-4 h-4 ml-1 my-auto" /></Link>
        </div>
      ) : (
        <div className="space-y-6">
          {currentOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 gap-4">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-xl border text-sm font-bold ${statusColor(order.status)}`}>
                    {order.status}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Order #{order.id}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Estimated Total: <span className="font-semibold text-slate-700">₹{orderTotal(order).toLocaleString()}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/customer/orders/${order.id}`} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors bg-white">Track Order</Link>
                  {(order.status === 'PENDING' || order.status === 'PAYMENT_PENDING') && (
                    <button onClick={() => cancelOrder(order.id)} className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">Cancel Order</button>
                  )}
                  {order.status === 'PAYMENT_PENDING' && (
                    <button onClick={() => payOrder(order.id)} className="px-4 py-2 bg-indigo-600 text-white border border-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">Pay Now</button>
                  )}
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{item.productName || `Product #${item.productId}`}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Qty: {item.quantity} × ₹{(item.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <span className="text-sm font-medium text-slate-500">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
