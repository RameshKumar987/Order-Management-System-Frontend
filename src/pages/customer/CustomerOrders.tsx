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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">My Orders</h1>
        <p className="text-slate-500">Track and manage your orders.</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-xl font-semibold text-slate-700">No orders yet</p>
          <p className="text-slate-400 mt-2">Start shopping to see your orders here!</p>
          <Link to="/customer/products" className="mt-6 inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Order #{o.id}</p>
                      <div className="flex gap-2 mt-1">
                        {o.items.map((item, idx) => (
                          <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {item.productName || 'Product'} (x{item.quantity})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{orderTotal(o).toLocaleString()}</p>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border mt-1 inline-block ${statusColor(o.status)}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 border-top pt-3 mt-1">
                  {o.status === 'PAYMENT_PENDING' && (
                    <button onClick={() => payOrder(o.id)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                      Pay Now
                    </button>
                  )}
                  {(o.status === 'PENDING' || o.status === 'PAYMENT_PENDING') && (
                    <button onClick={() => cancelOrder(o.id)} className="text-sm font-medium text-red-500 hover:text-red-700 px-2">
                      Cancel Order
                    </button>
                  )}
                  <Link to={`/customer/orders/${o.id}`} className="text-sm font-medium text-slate-400 hover:text-indigo-600">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
