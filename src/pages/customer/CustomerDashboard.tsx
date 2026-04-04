import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, inventoryApi } from '../../api/axios';
import { ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { toast } from 'sonner';

// OrderDto: { id, userId, status, items: [{productId, quantity, price}] }
type OrderItem = { productId: number; quantity: number; price: number };
type Order = { id: number; userId: number; status: string; items: OrderItem[] };

// Product from inventory service
type Product = { id: number; name: string; price: number; stock: number; category: { name: string }; imageUrls: string[] };

export const CustomerDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      inventoryApi.get('/inventory/products/with-stock'),
      api.get('/orders/my-orders'), // correct endpoint per backend
    ]).then(([prodRes, ordRes]) => {
      setProducts(prodRes.data.slice(0, 6));
      setOrders(ordRes.data.slice(0, 3));
    }).catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const handleOrder = async (productId: number, quantity = 1) => {
    try {
      // CreateOrderRequest: { items: [{productId, quantity}] } — no price field
      await api.post('/orders', { items: [{ productId, quantity }] });
      toast.success('Order placed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    }
  };

  const statusColor = (s: string) =>
    s === 'DELIVERED' ? 'bg-green-100 text-green-700'
    : s === 'PENDING' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-blue-100 text-blue-700';

  const orderTotal = (o: Order) =>
    o.items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 text-white p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">Welcome to the Store</h1>
          <p className="text-indigo-200 text-lg mb-6 max-w-lg">Discover fresh products and track your orders — all in one place.</p>
          <Link to="/customer/products" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-6 py-3 rounded-2xl hover:bg-indigo-50 transition-colors shadow-md">
            Shop Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="absolute right-0 top-0 h-full opacity-10">
          <ShoppingBag className="w-96 h-96 translate-x-20 -translate-y-12" />
        </div>
      </div>

      {/* Featured Products */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
          <Link to="/customer/products" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
                  {p.imageUrls?.[0] ? <img src={p.imageUrls[0]} className="h-full w-full object-cover" alt={p.name} /> : <Package className="w-16 h-16 text-slate-300" />}
                </div>
                <div className="p-5">
                  <p className="text-xs text-indigo-500 font-medium mb-1">{p.category?.name}</p>
                  <h3 className="font-semibold text-slate-900 mb-1 truncate">{p.name}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-slate-900">₹{p.price.toLocaleString()}</span>
                    <button onClick={() => handleOrder(p.id)} disabled={p.stock === 0}
                      className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      {p.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
          <Link to="/customer/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="space-y-3">
          {loading ? <div className="h-24 bg-slate-100 animate-pulse rounded-2xl" /> :
            orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No orders yet. Start shopping!</p>
              </div>
            ) : orders.map(o => (
              <Link to={`/customer/orders/${o.id}`} key={o.id} className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div>
                  <p className="font-semibold text-slate-900">Order #{o.id}</p>
                  <p className="text-sm text-slate-500">{o.items?.length ?? 0} item(s)</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900">₹{orderTotal(o).toLocaleString()}</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(o.status)}`}>{o.status}</span>
                </div>
              </Link>
            ))
          }
        </div>
      </div>
    </div>
  );
};
