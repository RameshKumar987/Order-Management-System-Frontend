import React, { useEffect, useState, useCallback } from 'react';
import { api, inventoryApi } from '../../api/axios';
import { Plus, Pencil, X, Search, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

type Product = { id: number; name: string; description: string; price: number; stock: number; category: { id: number; name: string } };
type Category = { id: number; name: string; description: string };

export const InventoryManage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<number | null>(null);

  // Modals
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showUpdateStock, setShowUpdateStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Forms
  const [prodForm, setProdForm] = useState({ name: '', description: '', price: '', categoryId: '' });
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [newStock, setNewStock] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pr, cr] = await Promise.all([inventoryApi.get('/inventory/products/with-stock'), inventoryApi.get('/inventory/categories')]);
      setProducts(pr.data); setCategories(cr.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await inventoryApi.post('/inventory/products', { ...prodForm, price: parseFloat(prodForm.price), categoryId: parseInt(prodForm.categoryId) });
      toast.success('Product created!'); setShowAddProduct(false);
      setProdForm({ name: '', description: '', price: '', categoryId: '' }); fetchData();
    } catch { toast.error('Failed to create product'); }
    finally { setSubmitting(false); }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await inventoryApi.post('/inventory/categories', catForm);
      toast.success('Category created!'); setShowAddCategory(false);
      setCatForm({ name: '', description: '' }); fetchData();
    } catch { toast.error('Failed to create category'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedProduct) return; setSubmitting(true);
    try {
      await inventoryApi.put(`/inventory/products/${selectedProduct.id}/stock`, { stock: parseInt(newStock) });
      toast.success('Stock updated!'); setShowUpdateStock(false); setSelectedProduct(null); fetchData();
    } catch { toast.error('Failed to update stock'); }
    finally { setSubmitting(false); }
  };

  const filtered = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === null || p.category?.id === filterCat;
    return matchName && matchCat;
  });

  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1";

  const Modal = ({ title, onClose, onSubmit, children }: { title: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative my-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        <h2 className="text-xl font-bold text-slate-900 mb-5">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-4">{children}
          <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Catalog Management</h1>
          <p className="text-slate-500">Create products, manage categories, and update stock.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAddCategory(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Category
          </button>
          <button onClick={() => setShowAddProduct(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <select value={filterCat ?? ''} onChange={e => setFilterCat(e.target.value ? parseInt(e.target.value) : null)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white min-w-40">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (<tr><td colSpan={6} className="text-center py-8 text-slate-400 animate-pulse">Loading catalog...</td></tr>)
                : filtered.length === 0 ? (<tr><td colSpan={6} className="text-center py-10 text-slate-400"><Package className="w-8 h-8 mx-auto mb-2 opacity-50" />No products found</td></tr>)
                : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-400 truncate max-w-40">{p.description}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-sm">₹{p.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{p.stock}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock === 0 ? 'Out of Stock' : p.stock <= 5 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelectedProduct(p); setNewStock(String(p.stock)); setShowUpdateStock(true); }}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Update Stock
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <Modal title="Add New Product" onClose={() => setShowAddProduct(false)} onSubmit={handleAddProduct}>
          <div><label className={labelCls}>Product Name</label><input className={inputCls} value={prodForm.name} onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Blue T-Shirt" /></div>
          <div><label className={labelCls}>Description</label><textarea className={inputCls} value={prodForm.description} onChange={e => setProdForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Short description..." /></div>
          <div><label className={labelCls}>Price (₹)</label><input type="number" step="0.01" className={inputCls} value={prodForm.price} onChange={e => setProdForm(f => ({ ...f, price: e.target.value }))} required placeholder="299.00" /></div>
          <div><label className={labelCls}>Category</label>
            <select className={inputCls} value={prodForm.categoryId} onChange={e => setProdForm(f => ({ ...f, categoryId: e.target.value }))} required>
              <option value="">Select category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <Modal title="Add New Category" onClose={() => setShowAddCategory(false)} onSubmit={handleAddCategory}>
          <div><label className={labelCls}>Category Name</label><input className={inputCls} value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Electronics" /></div>
          <div><label className={labelCls}>Description</label><input className={inputCls} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" /></div>
        </Modal>
      )}

      {/* Update Stock Modal */}
      {showUpdateStock && selectedProduct && (
        <Modal title={`Update Stock — ${selectedProduct.name}`} onClose={() => { setShowUpdateStock(false); setSelectedProduct(null); }} onSubmit={handleUpdateStock}>
          <p className="text-sm text-slate-500">Current stock: <span className="font-bold text-slate-900">{selectedProduct.stock} units</span></p>
          <div><label className={labelCls}>New Stock Quantity</label><input type="number" min="0" className={inputCls} value={newStock} onChange={e => setNewStock(e.target.value)} required placeholder="e.g. 100" /></div>
        </Modal>
      )}
    </div>
  );
};
