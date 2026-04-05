import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { TrendingUp, Users, ShoppingBag, Clock, ArrowRight, UserPlus, X, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

type OrderItem = { productId: number; productName: string; quantity: number; price: number };
type OrderDto = { id: number; userId: number; status: string; items: OrderItem[] };

const orderTotal = (o: OrderDto) => o.items?.reduce((s, i) => s + (i.price || 0) * i.quantity, 0) ?? 0;

// Pure SVG Area Chart
const AreaChart: React.FC<{ data: number[] }> = ({ data }) => {
  if (!data.length) return <div className="flex items-center justify-center h-full text-slate-300 text-sm">No data</div>;
  const W = 600; const H = 160; const P = 10;
  const max = Math.max(...data, 1); const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: P + (i / Math.max(data.length - 1, 1)) * (W - P * 2),
    y: H - P - ((v - min) / range) * (H - P * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fill = `${line} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#ag)"/>
      <path d={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Pure SVG Donut Chart
const DonutChart: React.FC<{ segments: { label: string; value: number; color: string }[] }> = ({ segments }) => {
  const total = segments.reduce((s, g) => s + g.value, 0);
  if (!total) return <div className="flex items-center justify-center h-full text-slate-300 text-sm">No data</div>;
  const cx = 80; const cy = 80; const R = 58; const r = 36;
  let angle = -Math.PI / 2;
  const paths = segments.filter(s => s.value > 0).map(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle); const y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(angle + sweep); const y2 = cy + R * Math.sin(angle + sweep);
    const x3 = cx + r * Math.cos(angle + sweep); const y3 = cy + r * Math.sin(angle + sweep);
    const x4 = cx + r * Math.cos(angle); const y4 = cy + r * Math.sin(angle);
    const lg = sweep > Math.PI ? 1 : 0;
    const d = `M${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${lg},1 ${x2.toFixed(1)},${y2.toFixed(1)} L${x3.toFixed(1)},${y3.toFixed(1)} A${r},${r} 0 ${lg},0 ${x4.toFixed(1)},${y4.toFixed(1)} Z`;
    angle += sweep;
    return { d, color: seg.color };
  });
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full">
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} opacity="0.9"/>)}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#94a3b8">Orders</text>
    </svg>
  );
};

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    api.get('/orders/admin/all')
      .then(r => setOrders(r.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); setCreatingUser(true);
    try {
      const token = localStorage.getItem('token');
      const url = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8081';
      const res = await fetch(`${url}/auth/admin/create-inventory-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed'); }
      toast.success('Inventory user created!');
      setIsModalOpen(false); setNewUser({ name: '', email: '', password: '' });
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setCreatingUser(false); }
  };

  const confirmed = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').length;
  const cancelled = orders.filter(o => o.status === 'CANCELLED').length;
  const shipped = orders.filter(o => o.status === 'SHIPPED').length;
  const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'PAYMENT_PENDING').length;
  const revenue = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').reduce((s, o) => s + orderTotal(o), 0);
  const activeUsers = new Set(orders.map(o => o.userId)).size;
  const uniqueProducts = new Set(orders.flatMap(o => o.items?.map(i => i.productId) || [])).size;
  const convRate = orders.length > 0 ? ((confirmed / orders.length) * 100).toFixed(1) : '0.0';

  const chartData = useMemo(() => {
    if (!orders.length) return [0];
    const sorted = [...orders].sort((a, b) => a.id - b.id);
    const buckets = 14;
    const size = Math.max(1, Math.ceil(sorted.length / buckets));
    let acc = 0;
    return Array.from({ length: buckets }, (_, i) => {
      const slice = sorted.slice(i * size, (i + 1) * size);
      acc += slice.filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').reduce((s, o) => s + orderTotal(o), 0);
      return acc;
    });
  }, [orders]);

  const donutSegments = [
    { label: 'Confirmed/Delivered', value: confirmed, color: '#22c55e' },
    { label: 'Pending', value: pending, color: '#6366f1' },
    { label: 'Cancelled', value: cancelled, color: '#ef4444' },
    { label: 'Shipped', value: shipped, color: '#f59e0b' },
  ];

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; sales: number; revenue: number }>();
    orders.forEach(o => o.items?.forEach(item => {
      const name = item.productName || `#${item.productId}`;
      const e = map.get(name) || { name, sales: 0, revenue: 0 };
      map.set(name, { name, sales: e.sales + item.quantity, revenue: e.revenue + (item.price || 0) * item.quantity });
    }));
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const recentOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 5);
  const sortedOrders = [...orders].sort((a, b) => b.id - a.id);
  const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE);
  const currentOrders = sortedOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const statusColor = (s: string) => ({
    DELIVERED: 'bg-green-100 text-green-700', PENDING: 'bg-yellow-100 text-yellow-700',
    PAYMENT_PENDING: 'bg-orange-100 text-orange-700', CONFIRMED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700', SHIPPED: 'bg-indigo-100 text-indigo-700',
  }[s] ?? 'bg-slate-100 text-slate-600');

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-400">Welcome back! Here's what's happening with your orders today.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{today}</span>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm">
            <UserPlus className="w-4 h-4"/> Create Inventory User
          </button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, icon: <ShoppingBag className="w-5 h-5"/>, light: 'bg-blue-50', text: 'text-blue-600', trend: null },
          { label: 'Confirmed Orders', value: confirmed, icon: <CheckCircle className="w-5 h-5"/>, light: 'bg-emerald-50', text: 'text-emerald-600', trend: null },
          { label: 'Cancelled Orders', value: cancelled, icon: <XCircle className="w-5 h-5"/>, light: 'bg-red-50', text: 'text-red-600', trend: null },
          { label: 'Revenue', value: `₹${revenue.toLocaleString()}`, icon: <DollarSign className="w-5 h-5"/>, light: 'bg-green-50', text: 'text-green-600', trend: null },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${m.light} ${m.text} flex items-center justify-center mb-3`}>{m.icon}</div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{m.label}</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{loading ? '—' : m.value}</p>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Users', value: activeUsers, icon: <Users className="w-4 h-4"/> },
          { label: 'Products Ordered', value: uniqueProducts, icon: <ShoppingBag className="w-4 h-4"/> },
          { label: 'Conversion Rate', value: `${convRate}%`, icon: <TrendingUp className="w-4 h-4"/> },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 flex-shrink-0">{m.icon}</div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{m.label}</p>
              <p className="text-xl font-extrabold text-slate-900">{loading ? '—' : m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue Overview</h2>
              <p className="text-xs text-slate-400">Cumulative confirmed revenue across orders</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Live</span>
          </div>
          <div className="h-44">
            {loading ? <div className="h-full bg-slate-50 animate-pulse rounded-xl"/> : <AreaChart data={chartData}/>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1">Orders by Status</h2>
          <p className="text-xs text-slate-400 mb-3">Current breakdown</p>
          <div className="h-40">
            {loading ? <div className="h-full bg-slate-50 animate-pulse rounded-xl"/> : <DonutChart segments={donutSegments}/>}
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {donutSegments.map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }}/>
                <span className="text-[10px] text-slate-500 truncate">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Top Performing Products</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-14 mx-6 my-3 bg-slate-50 animate-pulse rounded-lg"/>) :
              topProducts.length === 0 ? <p className="text-center py-8 text-slate-400 text-sm">No order data yet</p> :
              topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sales} units sold</p>
                  </div>
                  <p className="font-bold text-slate-900 text-sm flex-shrink-0">₹{p.revenue.toLocaleString()}</p>
                </div>
              ))
            }
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
            <Link to="/admin/inventory" className="text-xs font-medium text-indigo-600 flex items-center gap-1">View all <ArrowRight className="w-3 h-3"/></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50">
                {['Order ID', 'User', 'Status', 'Amount'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">Loading...</td></tr> :
                  recentOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-indigo-600">#{o.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">User #{o.userId}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(o.status)}`}>{o.status.replace(/_/g, ' ')}</span></td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">₹{orderTotal(o).toLocaleString()}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">All Orders</h2>
          <Link to="/admin/inventory" className="text-sm font-medium text-indigo-600 flex items-center gap-1">View Inventory <ArrowRight className="w-4 h-4"/></Link>
        </div>
        {loading ? <div className="p-8 text-center text-slate-400">Loading orders...</div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50"><tr>
                  {['Order ID', 'Customer', 'Items', 'Amount', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {currentOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 text-sm">#{o.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">User #{o.userId}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div className="flex flex-wrap gap-1">
                          {o.items?.map((item, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.productName || 'Product'} (x{item.quantity})</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-sm">₹{orderTotal(o).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(o.status)}`}>{o.status}</span></td>
                    </tr>
                  ))}
                  {currentOrders.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No orders found.</td></tr>}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                <span className="text-sm font-medium text-slate-500">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">New Inventory User</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600" disabled={creatingUser}><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {[
                { label: 'Name', type: 'text', key: 'name', ph: 'John Doe' },
                { label: 'Email', type: 'email', key: 'email', ph: 'john@example.com' },
                { label: 'Password', type: 'password', key: 'password', ph: '••••••••' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                  <input type={f.type} required value={(newUser as any)[f.key]}
                    onChange={e => setNewUser({ ...newUser, [f.key]: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder={f.ph} disabled={creatingUser}/>
                </div>
              ))}
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium" disabled={creatingUser}>Cancel</button>
                <button type="submit" disabled={creatingUser || !newUser.name || !newUser.email || !newUser.password} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50">
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending badge in header */}
      {!loading && pending > 0 && (
        <div className="fixed bottom-6 right-6 z-40 bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2">
          <Clock className="w-4 h-4"/> {pending} pending order{pending > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
