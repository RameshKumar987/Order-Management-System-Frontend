import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../../api/axios';
import { Package, AlertTriangle, Boxes, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

type Product = { id: number; name: string; price: number; stock: number; status: string; category: { name: string } };

export const InventoryDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.get('/inventory/products/with-stock')
      .then(r => setProducts(r.data))
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  }, []);

  const total = products.length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const criticalItems = products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Inventory Dashboard</h1>
        <p className="text-slate-500">Monitor stock levels and resolve low-inventory alerts.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><Boxes className="w-5 h-5 text-indigo-600" /></div>
            <p className="text-sm font-medium text-slate-500">Total SKUs</p>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : total}</p>
        </div>
        <div className={`bg-white rounded-2xl border-2 ${lowStock > 0 ? 'border-yellow-200' : 'border-slate-100'} p-6 shadow-sm`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-yellow-600" /></div>
            <p className="text-sm font-medium text-slate-500">Low Stock Alerts</p>
          </div>
          <p className={`text-3xl font-extrabold ${lowStock > 0 ? 'text-yellow-700' : 'text-slate-900'}`}>{loading ? '...' : lowStock}</p>
        </div>
        <div className={`bg-white rounded-2xl border-2 ${outOfStock > 0 ? 'border-red-200' : 'border-slate-100'} p-6 shadow-sm`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
            <p className="text-sm font-medium text-slate-500">Out of Stock</p>
          </div>
          <p className={`text-3xl font-extrabold ${outOfStock > 0 ? 'text-red-700' : 'text-slate-900'}`}>{loading ? '...' : outOfStock}</p>
        </div>
      </div>

      {/* Critical Items List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">⚠️ Action Required — Critical Stock</h2>
          <Link to="/inventory/manage" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">Manage All <ArrowRight className="w-4 h-4" /></Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Scanning inventory...</div>
        ) : criticalItems.length === 0 ? (
          <div className="p-12 text-center">
            <Boxes className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-700">All clear! Inventory is healthy.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {criticalItems.map(item => (
              <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.stock === 0 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                    <Package className={`w-5 h-5 ${item.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.category?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-lg font-extrabold ${item.stock === 0 ? 'text-red-600' : 'text-yellow-700'}`}>{item.stock}</p>
                    <p className="text-xs text-slate-400">units</p>
                  </div>
                  <Link to="/inventory/manage" className="text-xs font-semibold text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                    Restock
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
