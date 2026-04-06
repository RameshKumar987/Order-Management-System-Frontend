import React, { useEffect, useState, useCallback } from 'react';
import { inventoryApi } from '../../api/axios';
import { 
  Plus, Pencil, X, Search, Loader2, Package, Trash2, 
  Image as ImageIcon, Filter, LayoutGrid, LayoutList,
  Boxes, History, Settings2, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// --- Shared Enterprise Components ---

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/70 backdrop-blur-xl border border-white/20 rounded-[28px] shadow-xl shadow-slate-200/50 overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

const IconButton: React.FC<{ icon: React.ReactNode; onClick: () => void; color?: string; title?: string }> = ({ icon, onClick, color = "indigo", title }) => (
  <button 
    onClick={onClick}
    title={title}
    className={`w-9 h-9 flex items-center justify-center rounded-xl bg-${color}-50 text-${color}-600 hover:bg-${color}-600 hover:text-white transition-all duration-300 border border-${color}-100 shadow-sm`}
  >
    {icon}
  </button>
);

const Modal = ({ title, onClose, onSubmit, children, submitting }: { title: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void; children: React.ReactNode; submitting: boolean }) => (
  <AnimatePresence>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-white/20"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Registry Protocol</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-full transition-all">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-8 space-y-6">
          {children}
          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 disabled:opacity-50 hover:bg-indigo-700 transition-all"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Selection'}
          </button>
        </form>
      </motion.div>
    </div>
  </AnimatePresence>
);

type Product = { id: number; name: string; description: string; price: number; stock: number; category: { id: number; name: string } };
type Category = { id: number; name: string; description: string };
type ProductImage = { id: number; imageUrl: string };

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
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showManageImages, setShowManageImages] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  // Forms
  const [prodForm, setProdForm] = useState({ name: '', description: '', price: '', categoryId: '' });
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [newStock, setNewStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [submitting, setSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [pr, cr] = await Promise.all([inventoryApi.get('/inventory/products/with-stock'), inventoryApi.get('/inventory/categories')]);
      setProducts(pr.data); setCategories(cr.data);
    } catch { toast.error('Discovery failure: Could not sync catalog'); }
    finally { setLoading(false); setIsRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchProductImages = async (productId: number) => {
    try {
      const res = await inventoryApi.get(`/inventory/products/${productId}/images`);
      setProductImages(res.data);
    } catch { toast.error('Failed to load images'); }
  };

  const handleDeleteImage = async (productId: number, imageId: number) => {
    try {
      await inventoryApi.delete(`/inventory/products/${productId}/images/${imageId}`);
      toast.success('Image deleted!');
      fetchProductImages(productId);
    } catch { toast.error('Failed to delete image'); }
  };

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

  const [showEditCategory, setShowEditCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedProduct) return; setSubmitting(true);
    try {
      await inventoryApi.put(`/inventory/products/${selectedProduct.id}/stock`, { stock: parseInt(newStock) });
      toast.success('Stock updated!'); setShowUpdateStock(false); setSelectedProduct(null); fetchData();
    } catch { toast.error('Failed to update stock'); }
    finally { setSubmitting(false); }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedProduct) return; setSubmitting(true);
    try {
      await inventoryApi.put(`/inventory/products/${selectedProduct.id}`, { ...prodForm, price: parseFloat(prodForm.price), categoryId: parseInt(prodForm.categoryId) });
      toast.success('Product updated!'); setShowEditProduct(false); setSelectedProduct(null); fetchData();
    } catch { toast.error('Failed to update product'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await inventoryApi.delete(`/inventory/products/${id}`);
      toast.success('Product deleted!'); fetchData();
    } catch { toast.error('Failed to delete product'); }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedProduct) return; setSubmitting(true);
    try {
      if (uploadMethod === 'url') {
        if (!imageUrl) return;
        await inventoryApi.post(`/inventory/products/${selectedProduct.id}/images/url`, null, { params: { url: imageUrl } });
      } else {
        if (!imageFile) return;
        const formData = new FormData();
        formData.append('file', imageFile);
        await inventoryApi.post(`/inventory/products/${selectedProduct.id}/images/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      toast.success('Image added!'); 
      setImageUrl(''); setImageFile(null);
      if (selectedProduct) fetchProductImages(selectedProduct.id);
      fetchData();
    } catch { toast.error('Failed to add image'); }
    finally { setSubmitting(false); }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedCategory) return; setSubmitting(true);
    try {
      await inventoryApi.put(`/inventory/categories/${selectedCategory.id}`, catForm);
      toast.success('Category updated!'); setShowEditCategory(false); setSelectedCategory(null); fetchData();
    } catch { toast.error('Failed to update category'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? It might fail if products are linked.')) return;
    try {
      await inventoryApi.delete(`/inventory/categories/${id}`);
      toast.success('Category deleted!'); fetchData();
    } catch { toast.error('Failed to delete category'); }
  };

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === null || p.category?.id === filterCat;
    return matchName && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page relative to search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCat]);



  const inputCls = "w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm";
  const labelCls = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1";

  return (
    <div className="relative min-h-screen pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-50/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-violet-50/30 rounded-full blur-[100px]" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 pt-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enterprise<span className="text-indigo-600">Stock</span></h1>
          </div>
          <p className="text-slate-500 font-medium ml-1 flex items-center gap-2 italic">
            <Sparkles className="w-4 h-4 text-emerald-500" /> Operational Mastery • Global Entity Registry
          </p>
        </motion.div>

        <div className="flex gap-3 flex-wrap">
          <div className="bg-slate-100/60 p-1.5 rounded-2xl flex gap-1 border border-slate-200 backdrop-blur-sm mr-4">
            <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-4 h-4"/></button>
            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList className="w-4 h-4"/></button>
          </div>
          <button onClick={() => setShowAddCategory(true)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Settings2 className="w-4 h-4" /> New Category
          </button>
          <button onClick={() => setShowAddProduct(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
            <Plus className="w-4 h-4" /> Provision Entity
          </button>
        </div>
      </div>

      {/* Command Bar */}
      <GlassCard className="p-4 mb-10 border-t-white/40 border-l-white/40">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Query database for entities..." 
              className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-[20px] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 focus:bg-white transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={filterCat ?? ''} 
                onChange={e => setFilterCat(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full pl-11 pr-10 py-4 bg-slate-50/50 border border-slate-100 rounded-[20px] text-xs font-black uppercase tracking-widest focus:outline-none focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button onClick={() => fetchData()} className={`p-4 bg-white border border-slate-100 rounded-[20px] text-slate-500 hover:text-indigo-600 transition-all shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}>
              <History className="w-5 h-5" />
            </button>
          </div>
        </div>
      </GlassCard>

      <AnimatePresence mode="popLayout">
        {loading ? (
          <div key="loading" className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">Accessing Secure Vault...</p>
          </div>
        ) : currentProducts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-[40px] border border-dashed border-slate-200">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-xl font-black text-slate-400">Database Search Returned Null</p>
            <p className="text-sm text-slate-300 italic mt-1">Try adjusting your query parameters</p>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {currentProducts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8, rotateY: 3, rotateX: -3 }}
                className="group relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-200/40 transition-all duration-300 flex flex-col"
              >
                <div className="absolute top-6 right-6">
                   <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${p.stock === 0 ? 'bg-rose-100 text-rose-600 border border-rose-200' : p.stock <= 5 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'}`}>
                    {p.stock === 0 ? 'Depleted' : p.stock <= 5 ? 'Critical' : 'Operational'}
                  </span>
                </div>

                <div className="mb-6">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:bg-indigo-600 transition-colors duration-500">
                    <Package className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.category?.name || 'Uncategorized'}</h3>
                  <h2 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{p.name}</h2>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Net unit price</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{p.price.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset units</p>
                      <p className={`text-xl font-black ${p.stock <= 5 ? 'text-rose-600' : 'text-slate-800'}`}>{p.stock}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <IconButton icon={<Package className="w-4 h-4"/>} onClick={() => { setSelectedProduct(p); setNewStock(String(p.stock)); setShowUpdateStock(true); }} title="Adjust Stock" />
                      <IconButton icon={<Pencil className="w-4 h-4"/>} color="blue" onClick={() => { setSelectedProduct(p); setProdForm({ name: p.name, description: p.description, price: String(p.price), categoryId: String(p.category?.id || '') }); setShowEditProduct(true); }} title="Entity Properties" />
                      <IconButton icon={<ImageIcon className="w-4 h-4"/>} color="emerald" onClick={() => { setSelectedProduct(p); fetchProductImages(p.id); setShowManageImages(true); }} title="Media Assets" />
                    </div>
                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="border-t-white/40 border-l-white/40">
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Product Entity', 'Status', 'Pricing', 'Stock Value', 'Controls'].map(h => (
                        <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {currentProducts.map((p) => (
                      <motion.tr key={p.id} className="group hover:bg-indigo-50/20 transition-all duration-300">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-xs group-hover:bg-white transition-colors">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">{p.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.category?.name || 'Registry Unknown'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${p.stock === 0 ? 'bg-rose-500 animate-ping' : p.stock <= 10 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                             <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${p.stock === 0 ? 'text-rose-600' : p.stock <= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                               {p.stock === 0 ? 'Depleted' : p.stock <= 10 ? 'Restock Required' : 'Optimized'}
                             </span>
                           </div>
                        </td>
                        <td className="px-6 py-5 font-black text-slate-700 text-sm">₹{p.price.toLocaleString()}</td>
                        <td className="px-6 py-5">
                          <div className={`text-sm font-black italic ${p.stock <= 5 ? 'text-rose-600' : 'text-slate-900'}`}>{p.stock} units</div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-2">
                              <IconButton icon={<Package className="w-3.5 h-3.5"/>} onClick={() => { setSelectedProduct(p); setNewStock(String(p.stock)); setShowUpdateStock(true); }} />
                              <IconButton icon={<Pencil className="w-3.5 h-3.5"/>} color="blue" onClick={() => { setSelectedProduct(p); setProdForm({ name: p.name, description: p.description, price: String(p.price), categoryId: String(p.category?.id || '') }); setShowEditProduct(true); }} />
                              <IconButton icon={<Trash2 className="w-3.5 h-3.5"/>} color="rose" onClick={() => handleDeleteProduct(p.id)} />
                           </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-between px-10 py-6 bg-white/50 backdrop-blur-sm rounded-[30px] border border-white/20 shadow-xl">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Registry <span className="text-slate-900 ml-2">{currentPage} / {totalPages}</span></div>
           <div className="flex gap-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-40">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-40">Next Step</button>
           </div>
        </div>
      )}

      {/* Category Management Drawer/Section */}
      <div className="mt-24 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
           <div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">Category Registry</h2>
             <p className="text-xs text-slate-400 font-medium italic">Classification tree for all enterprise assets</p>
           </div>
           <button onClick={() => setShowAddCategory(true)} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
             <Settings2 className="w-5 h-5"/>
           </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {categories.map(c => (
             <motion.div key={c.id} whileHover={{ y: -5 }} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between group">
               <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs shadow-inner">
                      #{c.id}
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setSelectedCategory(c); setCatForm({ name: c.name, description: c.description || '' }); setShowEditCategory(true); }} className="text-slate-300 hover:text-blue-500 transition-colors"><Pencil className="w-4 h-4"/></button>
                       <button onClick={() => handleDeleteCategory(c.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                  <p className="text-sm text-slate-400 italic mt-1 font-medium">{c.description || 'No registry documentation'}</p>
               </div>
               <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Links</div>
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">{products.filter(p => p.category?.id === c.id).length} Products</div>
               </div>
             </motion.div>
           ))}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <Modal title="Add New Product" onClose={() => setShowAddProduct(false)} onSubmit={handleAddProduct} submitting={submitting}>
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
        <Modal title="Add New Category" onClose={() => setShowAddCategory(false)} onSubmit={handleAddCategory} submitting={submitting}>
          <div><label className={labelCls}>Category Name</label><input className={inputCls} value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Electronics" /></div>
          <div><label className={labelCls}>Description</label><input className={inputCls} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" /></div>
        </Modal>
      )}

      {/* Update Stock Modal */}
      {showUpdateStock && selectedProduct && (
        <Modal title={`Update Stock — ${selectedProduct.name}`} onClose={() => { setShowUpdateStock(false); setSelectedProduct(null); }} onSubmit={handleUpdateStock} submitting={submitting}>
          <p className="text-sm text-slate-500">Current stock: <span className="font-bold text-slate-900">{selectedProduct.stock} units</span></p>
          <div><label className={labelCls}>New Stock Quantity</label><input type="number" min="0" className={inputCls} value={newStock} onChange={e => setNewStock(e.target.value)} required placeholder="e.g. 100" /></div>
        </Modal>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && selectedProduct && (
        <Modal title="Edit Product" onClose={() => { setShowEditProduct(false); setSelectedProduct(null); }} onSubmit={handleEditProduct} submitting={submitting}>
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

      {/* Manage Images Modal */}
      {showManageImages && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Images — {selectedProduct.name}</h2>
              <button onClick={() => { setShowManageImages(false); setSelectedProduct(null); setImageUrl(''); setImageFile(null); setUploadMethod('url'); setProductImages([]); }} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Current Images */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Current Images ({productImages.length})</p>
                {productImages.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl text-slate-400 text-sm">No images yet</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {productImages.map(img => (
                      <div key={img.id} className="relative group border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <img
                          src={img.imageUrl}
                          className="w-full h-28 object-contain p-2"
                          alt="product"
                          onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {img.imageUrl.startsWith('https://cdn.fake-storage') && (
                          <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Broken URL</div>
                        )}
                        <button onClick={() => handleDeleteImage(selectedProduct.id, img.id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload New Image */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Add New Image</p>
                <form onSubmit={handleAddImage} className="space-y-3">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button type="button" onClick={() => setUploadMethod('url')} className={`flex-1 py-1.5 text-sm font-semibold rounded-lg ${uploadMethod === 'url' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Remote URL</button>
                    <button type="button" onClick={() => setUploadMethod('file')} className={`flex-1 py-1.5 text-sm font-semibold rounded-lg ${uploadMethod === 'file' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Local File</button>
                  </div>
                  {uploadMethod === 'url' ? (
                    <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
                  ) : (
                    <div>
                      <input type="file" accept="image/*" className="w-full text-sm border border-slate-200 rounded-xl p-0 file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                      {imageFile && (
                        <div className="mt-3 flex flex-col items-center border border-slate-200 rounded-xl p-3 bg-slate-50">
                          <img src={URL.createObjectURL(imageFile)} className="h-28 max-w-full object-contain rounded-lg" alt="Preview" />
                          <p className="text-xs text-slate-500 mt-2 font-semibold truncate w-full text-center">{imageFile.name}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <button type="submit" disabled={submitting} className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm">
                    {submitting ? 'Uploading...' : 'Upload Image'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategory && selectedCategory && (
        <Modal title={`Edit Category — ${selectedCategory.name}`} onClose={() => { setShowEditCategory(false); setSelectedCategory(null); }} onSubmit={handleEditCategory} submitting={submitting}>
          <div><label className={labelCls}>Category Name</label><input className={inputCls} value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Electronics" /></div>
          <div><label className={labelCls}>Description</label><input className={inputCls} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" /></div>
        </Modal>
      )}
    </div>
  );
};

