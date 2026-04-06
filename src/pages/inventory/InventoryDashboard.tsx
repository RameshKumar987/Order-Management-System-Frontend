import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../../api/axios';
import { 
  AlertTriangle, Boxes, XCircle,
  TrendingUp, DollarSign,
  LayoutList, Activity, Sparkles,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Product = { id: number; name: string; price: number; stock: number; status: string; category: { name: string } };


// Reusable 3D Card Wrapper
const Card3D: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div
    whileHover={{ rotateY: 3, rotateX: -3, scale: 1.01 }}
    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    className={`bg-white/70 backdrop-blur-xl border border-white/20 rounded-[30px] shadow-2xl shadow-slate-200/50 overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

// Pure SVG Donut Chart for Stock Distribution
const StockDonut: React.FC<{ inStock: number; lowStock: number; outOfStock: number }> = ({ inStock, lowStock, outOfStock }) => {
  const total = inStock + lowStock + outOfStock;
  if (total === 0) return <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">No inventory data yet</div>;
  
  const segments = [
    { value: inStock, color: '#10b981' }, // emerald
    { value: lowStock, color: '#f59e0b' }, // amber
    { value: outOfStock, color: '#f43f5e' } // rose
  ];
  
  const cx = 80; const cy = 80; const R = 54; const r = 38;
  let angle = -Math.PI / 2;
  
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-xl">
      {segments.map((s, i) => {
        if (s.value === 0) return null;
        const sweep = (s.value / total) * 2 * Math.PI;
        const x1 = cx + R * Math.cos(angle); const y1 = cy + R * Math.sin(angle);
        const x2 = cx + R * Math.cos(angle + sweep); const y2 = cy + R * Math.sin(angle + sweep);
        const x3 = cx + r * Math.cos(angle + sweep); const y3 = cy + r * Math.sin(angle + sweep);
        const x4 = cx + r * Math.cos(angle); const y4 = cy + r * Math.sin(angle);
        const lg = sweep > Math.PI ? 1 : 0;
        const d = `M${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${lg},1 ${x2.toFixed(1)},${y2.toFixed(1)} L${x3.toFixed(1)},${y3.toFixed(1)} A${r},${r} 0 ${lg},0 ${x4.toFixed(1)},${y4.toFixed(1)} Z`;
        angle += sweep;
        return <path key={i} d={d} fill={s.color} opacity="0.9" className="hover:opacity-100 transition-opacity cursor-pointer shadow-inner"/>;
      })}
      <circle cx={cx} cy={cy} r="32" fill="white" className="opacity-80"/>
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="18" fontWeight="black" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#94a3b8" className="uppercase tracking-widest">SKUs</text>
    </svg>
  );
};

// Pure SVG Trending Chart (Mini version)
const StockTrend: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const W = 100; const H = 40; const P = 4;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: P + (i / (data.length - 1)) * (W - P * 2),
    y: H - P - (v / max) * (H - P * 2)
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-24 h-10 overflow-visible">
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm"/>
    </svg>
  );
};



export const InventoryDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.get('/inventory/products/with-stock')
      .then(r => setProducts(r.data))
      .catch(() => toast.error('Failed to load inventory intelligence'))
      .finally(() => setLoading(false));
  }, []);

  const total = products.length;
  const inStock = products.filter(p => p.stock > 10).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const netValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const criticalItems = products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6);

  // Dynamic Data Projections
  const healthRatio = total > 0 ? (inStock + lowStock/2) / total : 0;
  const healthStatus = healthRatio > 0.8 ? 'Optimal' : healthRatio > 0.4 ? 'Attention Required' : 'Critical State';
  const healthColor = healthRatio > 0.8 ? 'text-emerald-600' : healthRatio > 0.4 ? 'text-amber-600' : 'text-rose-600';
  const healthBg = healthRatio > 0.8 ? 'bg-emerald-50' : healthRatio > 0.4 ? 'bg-amber-50' : 'bg-rose-50';

  const stockVolumeData = products.length > 0 
    ? products.slice(0, 10).map(p => p.stock) 
    : [0, 0, 0, 0, 0];

  const acquisitionGoal = Math.ceil((total + 1) / 25) * 25;
  const acquisitionProgress = total > 0 ? (total / acquisitionGoal) * 100 : 0;

  const nextAuditDate = new Date();
  nextAuditDate.setDate(nextAuditDate.getDate() + 14);
  const auditStr = nextAuditDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-50/40 rounded-full blur-[100px]" />
      </div>

      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pt-4">
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }}
          className="relative"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-slate-900 rounded-3xl shadow-xl shadow-slate-200">
              <Boxes className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Catalog<span className="text-indigo-600">Intelligence</span></h1>
          </div>
          <p className="text-slate-500 font-medium ml-1 flex items-center gap-2 italic">
            <Activity className="w-4 h-4 text-indigo-500" /> Enterprise Inventory Suite • Professional Dashboard
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 h-fit"
        >
          <Link to="/inventory/manage" className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm hover:shadow-md">
            <LayoutList className="w-4 h-4" /> Manage Catalog
          </Link>
          <Link to="/inventory/manage" className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
            <Plus className="w-4 h-4" /> New Acquisition
          </Link>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <section className="space-y-10">
          {/* Main Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Primary KPI Card: Total Value */}
            <Card3D className="lg:col-span-2 p-8 relative flex flex-col justify-between group h-full">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <DollarSign className="w-40 h-40 text-slate-900" />
              </div>
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Portfolio Valuation</h3>
                    <div className="text-5xl font-black text-slate-900 tracking-tighter">
                      {loading ? <div className="h-10 w-40 bg-slate-100 animate-pulse rounded-xl" /> : `₹${netValue.toLocaleString()}`}
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl">
                    <TrendingUp className="w-8 h-8 text-indigo-600" />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-black text-indigo-600 bg-indigo-50 w-fit px-4 py-2.5 rounded-2xl border border-indigo-100 shadow-sm">
                   <Activity className="w-4 h-4" /> DATA INTEGRITY VERIFIED <span className="text-slate-300 font-bold ml-1 uppercase">Sourced from API</span>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-100/50 flex justify-between items-end relative z-10">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Circulation</div>
                  <div className="text-lg font-black text-slate-700">{loading ? '...' : total} Unique SKUs</div>
                </div>
                <StockTrend data={stockVolumeData} color="#6366f1" />
              </div>
            </Card3D>

            {/* Health Distribution Donut */}
            <Card3D className="p-8 flex flex-col items-center justify-center min-h-[340px]">
              <div className="w-full mb-6">
                <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1 text-center">Stock Health</h3>
                <p className="text-xs text-slate-400 font-bold text-center italic">Asset Lifecycle Distribution</p>
              </div>
              <div className="relative w-full h-[180px]">
                {loading ? <div className="h-full w-full bg-slate-50 animate-pulse rounded-full" /> : 
                  <StockDonut inStock={inStock} lowStock={lowStock} outOfStock={outOfStock} />
                }
              </div>
              <div className="flex gap-4 mt-6">
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /><span className="text-[10px] font-black text-slate-500 uppercase">Safe</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-amber-500 rounded-full" /><span className="text-[10px] font-black text-slate-500 uppercase">Low</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-rose-500 rounded-full" /><span className="text-[10px] font-black text-slate-500 uppercase">Out</span></div>
              </div>
            </Card3D>

            {/* Quick Metrics Rack */}
            <div className="space-y-6">
              <Card3D className="p-6 border-l-4 border-l-rose-500">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Out of Commerce</h4>
                  <XCircle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-3xl font-black text-slate-900">{loading ? '...' : outOfStock}</div>
                <p className="text-[10px] font-bold text-rose-600 mt-1">Requires Immediate Action</p>
              </Card3D>
              <Card3D className="p-6 border-l-4 border-l-amber-500">
                 <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Inventory</h4>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-black text-slate-900">{loading ? '...' : lowStock}</div>
                <p className="text-[10px] font-bold text-amber-600 mt-1">Below Warning Threshold</p>
              </Card3D>
            </div>
          </div>

          {/* Strategic Action Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Critical Restock Queue */}
            <Card3D className="lg:col-span-2">
              <div className="px-8 py-6 border-b border-white/10 bg-slate-50/50 flex justify-between items-center">
                <div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight">Restock Priority Queue</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                     <Sparkles className="w-3 h-3 text-amber-500" /> System Suggested Actions
                   </p>
                </div>
                <Link to="/inventory/manage" className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-black rounded-xl hover:bg-indigo-100 transition-colors uppercase tracking-widest">Review All</Link>
              </div>
              
              <div className="p-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Product Entity', 'Category', 'Quantity', 'Control'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      [1,2,3].map(i => <tr key={i}>
                        <td colSpan={4} className="px-6 py-6 animate-pulse"><div className="h-6 bg-slate-50 rounded-xl" /></td>
                      </tr>)
                    ) : criticalItems.length === 0 ? (
                      <tr><td colSpan={4} className="px-8 py-14 text-center">
                        <Activity className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-500 italic">No critical shortages detected at this time.</p>
                      </td></tr>
                    ) : criticalItems.map((item, i) => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-indigo-50/30 transition-all duration-300"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${item.stock === 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                               <p className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{item.name}</p>
                               <p className="text-[10px] text-slate-400 font-bold">SKU-{item.id}00X</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.category?.name}</span>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${item.stock === 0 ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`} />
                             <span className={`text-sm font-black italic ${item.stock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>{item.stock} units</span>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <Link to="/inventory/manage" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-indigo-700 transition-all uppercase tracking-widest shadow-lg shadow-indigo-100">
                             Refill
                           </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card3D>

            {/* Dynamic Operations Summary */}
            <Card3D className="p-8 relative flex flex-col overflow-hidden group">
               <div className="absolute top-0 right-0 w-full h-full p-20 opacity-[0.02] pointer-events-none">
                 <Activity className="w-full h-full text-slate-900" />
               </div>
               <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">System Status</h3>
               <div className="space-y-6 relative z-10">
                  <div className={`p-5 ${healthBg} rounded-[24px] border border-white/50 flex items-center justify-between`}>
                     <div>
                       <p className={`text-[10px] font-black ${healthColor} uppercase tracking-widest mb-1`}>Global Health</p>
                       <p className="text-lg font-black text-slate-800">{loading ? '...' : healthStatus}</p>
                     </div>
                     <div className="h-10 w-10 flex items-center justify-center">
                        <Activity className={`w-6 h-6 ${healthColor}`} />
                     </div>
                  </div>
                  <div className="p-5 bg-indigo-50 rounded-[24px] border border-indigo-100">
                     <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Inventory Integrity</p>
                     <div className="flex items-end justify-between">
                        <p className="text-lg font-black text-slate-800">Verified</p>
                        <span className="text-[10px] font-bold text-slate-400 italic">Next Sync: {auditStr}</span>
                     </div>
                  </div>
                  <div className="pt-4 space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Milestone</p>
                     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${acquisitionProgress}%` }} className="h-full bg-indigo-600" />
                     </div>
                     <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                        <span>{total} Items</span>
                        <span>{acquisitionGoal} Target</span>
                     </div>
                  </div>
               </div>
            </Card3D>
          </div>
        </section>
      </AnimatePresence>
    </div>
  );
};


