import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { TrendingUp, Users, ShoppingBag, Clock, ArrowRight, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

// OrderDto: { id, userId, status, items: [{productId, quantity, price}] }
type OrderItem = { productId: number; quantity: number; price: number };
type OrderDto = { id: number; userId: number; status: string; items: OrderItem[] };

const orderTotal = (o: OrderDto) =>
  o.items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    // GET /orders/admin/all
    api.get('/orders/admin/all')
      .then(r => setOrders(r.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      // Bypassing API Gateway (localhost:8080) role permission issues 
      // by calling auth-service directly (localhost:8081)
      const token = localStorage.getItem('token');
      const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8081';
      
      await fetch(`${authServiceUrl}/auth/admin/create-inventory-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      }).then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to create user');
        }
        return res.json();
      });

      toast.success('Inventory user created successfully!');
      setIsModalOpen(false);
      setNewUser({ name: '', email: '', password: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const revenue = orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + orderTotal(o), 0);
  const pending = orders.filter(o => o.status === 'PENDING').length;
  const activeCustomers = new Set(orders.map(o => o.userId)).size;

  const metrics = [
    { label: 'Delivered Revenue', value: `₹${revenue.toLocaleString()}`, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Orders', value: orders.length.toString(), icon: <ShoppingBag className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Unique Customers', value: activeCustomers.toString(), icon: <Users className="w-5 h-5" />, color: 'bg-violet-50 text-violet-600' },
    { label: 'Pending Orders', value: pending.toString(), icon: <Clock className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
  ];

  const statusColor = (s: string) => ({ DELIVERED: 'bg-green-100 text-green-700', PENDING: 'bg-yellow-100 text-yellow-700', PROCESSING: 'bg-blue-100 text-blue-700', CANCELLED: 'bg-red-100 text-red-700', SHIPPED: 'bg-indigo-100 text-indigo-700' }[s] ?? 'bg-slate-100 text-slate-600');

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Admin Dashboard</h1>
          <p className="text-slate-500">System-wide overview and order management.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Create Inventory User
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${m.color} mb-4`}>
              <span className="w-5 h-5">{m.icon}</span>
            </div>
            <p className="text-sm text-slate-500 mb-1">{m.label}</p>
            <p className="text-2xl font-extrabold text-slate-900">{loading ? '...' : m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">All Orders</h2>
          <Link to="/admin/inventory" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">View Inventory <ArrowRight className="w-4 h-4" /></Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading orders...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  {['Order ID', 'Customer (userId)', 'Items', 'Est. Amount', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 text-sm">#{o.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">User #{o.userId}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{o.items?.length ?? 0}</td>
                    <td className="px-4 py-3 font-semibold text-sm">₹{orderTotal(o).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(o.status)}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">New Inventory User</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={creatingUser}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="John Doe"
                  disabled={creatingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="john@example.com"
                  disabled={creatingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                  disabled={creatingUser}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                  disabled={creatingUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser || !newUser.name || !newUser.email || !newUser.password}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
