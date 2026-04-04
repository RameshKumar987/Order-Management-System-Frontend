import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { Package, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// OrderDto: { id, userId, status, items: [{productId, quantity, price}] }
type OrderItem = { productId: number; quantity: number; price: number };
type Order = { id: number; userId: number; status: string; items: OrderItem[] };

const statusColor = (s: string) => ({
  DELIVERED: 'bg-green-100 text-green-700 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  SHIPPED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
}[s] ?? 'bg-slate-100 text-slate-700 border-slate-200');

const orderTotal = (o: Order) =>
  o.items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

export const CustomerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // correct endpoint: GET /orders/my-orders (not /orders/customer)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">My Orders</h1>
        <p className="text-slate-500">Track the status of all your past and current orders.</p>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Order #{o.id}</p>
                    <p className="text-sm text-slate-500">{o.items?.length ?? 0} item(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${statusColor(o.status)}`}>{o.status}</span>
                  <span className="font-bold text-slate-900">₹{orderTotal(o).toLocaleString()}</span>
                  <Link to={`/customer/orders/${o.id}`} className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    Track <ArrowRight className="w-4 h-4" />
                  </Link>
                  {o.status === 'PENDING' && (
                    <button onClick={() => cancelOrder(o.id)} className="text-sm font-medium text-red-500 hover:text-red-700">Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
