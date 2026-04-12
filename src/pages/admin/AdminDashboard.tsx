import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { 
  TrendingUp, ShoppingBag, Clock, 
  UserPlus, X, CheckCircle, XCircle, DollarSign, 
  ShieldCheck, MapPin, Mail, User, 
  LayoutDashboard, UsersRound, Ban, Loader2,
  ChevronRight, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type OrderItem = { productId: number; productName: string; quantity: number; price: number };
type OrderDto = { id: number; userId: number; status: string; items: OrderItem[] };
type UserEntity = { 
  id: number; 
  name: string; 
  email: string; 
  role: { name: string }; 
  isActive: boolean;
  addressLine?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
};

const orderTotal = (o: OrderDto) => o.items?.reduce((s, i) => s + (i.price || 0) * i.quantity, 0) ?? 0;

// Reusable 3D Card Wrapper
const Card3D: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div
    whileHover={{ rotateY: 5, rotateX: -5, y: -5 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className={`bg-white/70 backdrop-blur-xl border border-white/20 rounded-[24px] shadow-xl shadow-slate-200/50 overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

// Pure SVG Area Chart
const AreaChart: React.FC<{ data: number[] }> = ({ data }) => {
  if (!data.length) return <div className="flex items-center justify-center h-full text-slate-300 text-sm italic">No activity data available</div>;
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
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#ag)"/>
      <path d={line} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Pure SVG Donut Chart
const DonutChart: React.FC<{ segments: { label: string; value: number; color: string }[] }> = ({ segments }) => {
  const total = segments.reduce((s, g) => s + g.value, 0);
  if (!total) return <div className="flex items-center justify-center h-full text-slate-300 text-sm">Waiting for orders...</div>;
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
    <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} opacity="0.9"/>)}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="black" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#94a3b8" className="uppercase tracking-widest">Total</text>
    </svg>
  );
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const [userSubTab, setUserSubTab] = useState<'CUSTOMER' | 'INVENTORY'>('CUSTOMER');
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [togglingUser, setTogglingUser] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 8;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, usersRes] = await Promise.all([
        api.get('/orders/admin/all'),
        api.get('/auth/admin/users')
      ]);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const r = await api.get('/auth/admin/users');
      setUsers(r.data);
    } catch (err) {
      toast.error('Failed to refresh user list');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); setCreatingUser(true);
    try {
      await api.post('/auth/admin/create-inventory-user', newUser);
      toast.success('Inventory user created successfully!');
      setIsModalOpen(false); 
      setNewUser({ name: '', email: '', password: '' });
      fetchUsers();
    } catch (err: any) { 
      toast.error(err.response?.data?.message || 'Failed to create user'); 
    } finally { 
      setCreatingUser(false); 
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    setTogglingUser(userId);
    try {
      await api.put(`/auth/admin/users/${userId}/toggle-active`);
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
      toast.success('User status updated');
    } catch (err: any) {
      toast.error('Failed to update status');
    } finally {
      setTogglingUser(null);
    }
  };

  // Metrics
  const confirmed = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').length;
  const cancelled = orders.filter(o => o.status === 'CANCELLED').length;
  const shipped = orders.filter(o => o.status === 'SHIPPED').length;
  const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'PAYMENT_PENDING').length;
  const revenue = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').reduce((s, o) => s + orderTotal(o), 0);
  
  const chartData = useMemo(() => {
    if (!orders.length) return [0];
    const sorted = [...orders].sort((a, b) => a.id - b.id);
    const buckets = 10;
    const size = Math.max(1, Math.ceil(sorted.length / buckets));
    let acc = 0;
    return Array.from({ length: buckets }, (_, i) => {
      const slice = sorted.slice(i * size, (i + 1) * size);
      acc += slice.filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').reduce((s, o) => s + orderTotal(o), 0);
      return acc;
    });
  }, [orders]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.role.name === userSubTab && (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )).sort((a, b) => b.id - a.id);
  }, [users, userSubTab, searchTerm]);

  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const currentUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  useEffect(() => { setUserPage(1); }, [userSubTab, searchTerm]);

  const getOrderCountForUser = (userId: number) => orders.filter(o => o.userId === userId).length;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const statusColor = (s: string) => ({
    DELIVERED: 'bg-green-100 text-green-700 bubble-green', PENDING: 'bg-yellow-100 text-yellow-700 bubble-yellow',
    PAYMENT_PENDING: 'bg-orange-100 text-orange-700 bubble-orange', CONFIRMED: 'bg-emerald-100 text-emerald-700 bubble-emerald',
    CANCELLED: 'bg-red-100 text-red-700 bubble-red', SHIPPED: 'bg-indigo-100 text-indigo-700 bubble-indigo',
  }[s] ?? 'bg-slate-100 text-slate-600');

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-50/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-violet-50/50 rounded-full blur-[100px]" />
      </div>

      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enterprise<span className="text-indigo-600">OMS</span> Central</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1 flex items-center gap-2 italic">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Professional Dashboard • {today}
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-200 backdrop-blur-sm self-start sm:self-center">
          {[
            { id: 'overview', label: 'System Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'users', label: 'User Management', icon: <UsersRound className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Volume', value: orders.length, icon: <ShoppingBag className="w-6 h-6"/>, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                { label: 'Confirmed', value: confirmed, icon: <CheckCircle className="w-6 h-6"/>, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                { label: 'Gross Revenue', value: `₹${revenue.toLocaleString()}`, icon: <DollarSign className="w-6 h-6"/>, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
                { label: 'Cancelled', value: cancelled, icon: <XCircle className="w-6 h-6"/>, color: 'text-rose-600', bg: 'bg-rose-500/10' },
              ].map((m) => (
                <Card3D key={m.label} className="p-6">
                  <div className={`w-12 h-12 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center mb-4 shadow-inner`}>
                    {m.icon}
                  </div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</h3>
                  <div className="text-3xl font-black text-slate-900 tracking-tight">
                    {loading ? <div className="h-8 w-1/2 bg-slate-100 animate-pulse rounded-lg" /> : m.value}
                  </div>
                </Card3D>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card3D className="lg:col-span-2 p-8 h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Revenue Dynamics</h2>
                    <p className="text-sm text-slate-400 font-medium italic">Performance trends per logic cycle</p>
                  </div>
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> Synchronized
                  </div>
                </div>
                <div className="flex-1 w-full flex items-end">
                  {loading ? <div className="h-full w-full bg-slate-50 animate-pulse rounded-2xl"/> : <AreaChart data={chartData}/>}
                </div>
              </Card3D>

              <Card3D className="p-8 h-[400px] flex flex-col">
                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">Status Allocation</h2>
                <p className="text-sm text-slate-400 font-medium mb-6 italic">Current inventory flow</p>
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-full h-full max-h-[220px]">
                    {loading ? <div className="h-64 w-64 mx-auto bg-slate-50 animate-pulse rounded-full"/> : <DonutChart segments={[
                      { label: 'Confirmed', value: confirmed, color: '#10b981' },
                      { label: 'Pending', value: pending, color: '#6366f1' },
                      { label: 'Cancelled', value: cancelled, color: '#f43f5e' },
                      { label: 'Shipped', value: shipped, color: '#f59e0b' },
                    ]}/>}
                  </div>
                </div>
              </Card3D>
            </div>

            {/* Recent Orders Table - Enterprise Style */}
            <Card3D>
              <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent System Transactions</h2>
                <button className="text-sm font-bold text-indigo-600 px-4 py-2 hover:bg-indigo-50 rounded-xl transition-colors">
                  Export Log
                </button>
              </div>
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Reference', 'Entity', 'Status', 'Net Value'].map(h => (
                        <th key={h} className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.slice(0, 10).map((o) => (
                      <motion.tr 
                        key={o.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group hover:bg-indigo-50/30 transition-all duration-300"
                      >
                        <td className="px-6 py-4 font-black text-indigo-600 text-sm">#TXN-{o.id}</td>
                        <td className="px-6 py-4">
                          <Link to={`/admin/customers/${o.userId}`} className="flex items-center gap-3 group/link">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 group-hover/link:bg-indigo-600 group-hover/link:text-white transition-all">U{o.userId}</div>
                            <span className="text-sm font-bold text-slate-700 group-hover/link:text-indigo-600 underline decoration-indigo-200 underline-offset-4 decoration-2">User ID {o.userId}</span>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${statusColor(o.status)}`}>
                            {o.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-black text-slate-900 text-sm italic">₹{orderTotal(o).toLocaleString()}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card3D>
          </motion.div>
        ) : (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            {/* User Controls */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-200 backdrop-blur-sm shadow-inner">
                {['CUSTOMER', 'INVENTORY'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setUserSubTab(role as any)}
                    className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      userSubTab === role 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                        : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50'
                    }`}
                  >
                    {role === 'CUSTOMER' ? 'Client Database' : 'Internal Staff'}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium shadow-sm"
                  />
                </div>
                {userSubTab === 'INVENTORY' && (
                  <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">
                    <UserPlus className="w-4 h-4"/> New Staff
                  </button>
                )}
              </div>
            </div>

            {/* User List Detail View */}
            <Card3D className="min-h-[400px]">
              {loadingUsers ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                  <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Accessing Secure Records...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        {['Entity Credentials', userSubTab === 'CUSTOMER' ? 'Location & Data' : '', 'Account Logic', 'Actions'].map(h => h && (
                          <th key={h} className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentUsers.map((user, i) => (
                        <motion.tr 
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-indigo-50/20 group"
                        >
                          {/* Info Column */}
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${user.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-base flex items-center gap-2">
                                  {user.name} 
                                  {!user.isActive && <Ban className="w-3.5 h-3.5 text-rose-500" />}
                                </h3>
                                <p className="text-sm text-slate-400 flex items-center gap-1.5 italic font-medium"><Mail className="w-3.5 h-3.5"/> {user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Extra Data / Location Column */}
                          {userSubTab === 'CUSTOMER' && (
                            <td className="px-8 py-6">
                              <div className="space-y-1.5">
                                <div className="text-xs text-slate-600 font-bold flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> 
                                  {user.addressLine ? `${user.city}` : <span className="text-slate-300 italic">No address registry</span>}
                                </div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                  <ShoppingBag className="w-3.5 h-3.5 text-slate-300" />
                                  Total Logistics: {getOrderCountForUser(user.id)} Orders
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Status Logic Column */}
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full blur-[2px] ${user.isActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
                              <span className={`text-[11px] font-black uppercase tracking-widest ${user.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {user.isActive ? 'Active Node' : 'System Blocked'}
                              </span>
                            </div>
                          </td>

                          {/* Actions Column */}
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              {userSubTab === 'CUSTOMER' && (
                                <Link to={`/admin/customers/${user.id}`} title="View Detailed Logistics" className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all">
                                  <ChevronRight className="w-5 h-5" />
                                </Link>
                              )}
                              <button 
                                onClick={() => handleToggleUserStatus(user.id)}
                                disabled={togglingUser === user.id}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                  user.isActive 
                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 shadow-sm'
                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 shadow-sm'
                                }`}
                              >
                                {togglingUser === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : (user.isActive ? <Ban className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />)}
                                {user.isActive ? 'Restrict Access' : 'Restore Node'}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="p-20 text-center">
                      <p className="text-slate-400 font-bold italic">No matching entities found in current directory.</p>
                    </div>
                  )}
                </div>
              )}
              </Card3D>

              {/* Pagination Footer */}
              {totalUserPages > 1 && (
                <div className="flex items-center justify-between px-10 py-6 bg-white/50 backdrop-blur-sm rounded-[30px] border border-slate-100 shadow-sm mt-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Registry <span className="text-slate-900 ml-2">{userPage} / {totalUserPages}</span></div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setUserPage(p => Math.max(1, p - 1))} 
                      disabled={userPage === 1} 
                      className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))} 
                      disabled={userPage === totalUserPages} 
                      className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pending Badge - Glassmorphism Edit */}
      {!loading && pending > 0 && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-10 right-10 z-40 bg-amber-500/90 backdrop-blur-xl text-white px-6 py-4 rounded-[28px] shadow-2xl shadow-amber-500/20 flex items-center gap-4 group border border-white/20 border-t-white/40"
        >
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce group-hover:animate-none">
            <Clock className="w-5 h-5"/>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80 opacity-group-hover:100 transition-opacity">Critical Action Required</div>
            <div className="text-lg font-black">{pending} Processing Orders</div>
          </div>
        </motion.div>
      )}

      {/* Modern Glass Modal for Create User */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Provision Entity</h3>
                  <p className="text-sm text-slate-400 font-medium font-italic">Enabling secure service credentials</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-full transition-all">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                {[
                  { label: 'Entity Name', type: 'text', key: 'name', ph: 'Full Name', icon: <User className="w-4 h-4" /> },
                  { label: 'Access Email', type: 'email', key: 'email', ph: 'name@enterprise.com', icon: <Mail className="w-4 h-4" /> },
                  { label: 'Security Key', type: 'password', key: 'password', ph: '••••••••', icon: <Clock className="w-4 h-4" /> },
                ].map(f => (
                  <div key={f.key}>
                    <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                       {f.icon} {f.label}
                    </label>
                    <input type={f.type} required value={(newUser as any)[f.key]}
                      onChange={e => setNewUser({ ...newUser, [f.key]: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                      placeholder={f.ph} disabled={creatingUser}/>
                  </div>
                ))}
                <div className="pt-4 flex gap-4">
                  <button type="submit" disabled={creatingUser || !newUser.name || !newUser.email || !newUser.password} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 disabled:opacity-50">
                    {creatingUser ? 'Authorizing...' : 'Create Credentials'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

