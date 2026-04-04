import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../../api/axios';
import { Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type Product = { id: number; name: string; price: number; stock: number; status: string; category: { name: string } };

export const AdminInventoryView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    inventoryApi.get('/inventory/products/with-stock')
      .then(r => setProducts(r.data))
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const stockColor = (s: number) => s === 0 ? 'text-red-600 bg-red-50' : s <= 5 ? 'text-yellow-700 bg-yellow-50' : 'text-green-700 bg-green-50';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Inventory Overview</h1>
        <p className="text-slate-500">Read-only snapshot of current product stock levels.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total Products', val: products.length, color: 'border-indigo-100' },
          { label: 'Low Stock (≤5)', val: products.filter(p => p.stock > 0 && p.stock <= 5).length, color: 'border-yellow-200' },
          { label: 'Out of Stock', val: products.filter(p => p.stock === 0).length, color: 'border-red-200' }
        ].map(m => (
          <div key={m.label} className={`bg-white rounded-2xl border-2 ${m.color} p-5`}>
            <p className="text-sm text-slate-500 mb-1">{m.label}</p>
            <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : m.val}</p>
          </div>
        ))}
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product name..."
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Product', 'Category', 'Price', 'Stock', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="font-medium text-slate-900 text-sm">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">₹{p.price.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full ${stockColor(p.stock)}`}>
                    {p.stock <= 5 && <AlertTriangle className="w-3 h-3" />} {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {p.stock === 0 ? 'Out of Stock' : p.stock <= 5 ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
