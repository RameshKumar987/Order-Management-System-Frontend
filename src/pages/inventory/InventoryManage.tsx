import React, { useEffect, useState, useCallback } from 'react';
import { inventoryApi } from '../../api/axios';
import { Plus, Pencil, X, Search, Loader2, Package, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

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
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pr, cr] = await Promise.all([inventoryApi.get('/inventory/products/with-stock'), inventoryApi.get('/inventory/categories')]);
      setProducts(pr.data); setCategories(cr.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
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
                : currentProducts.length === 0 ? (<tr><td colSpan={6} className="text-center py-10 text-slate-400"><Package className="w-8 h-8 mx-auto mb-2 opacity-50" />No products found</td></tr>)
                : currentProducts.map(p => (
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
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedProduct(p); setNewStock(String(p.stock)); setShowUpdateStock(true); }}
                          className="flex justify-center items-center w-8 h-8 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors" title="Update Stock">
                          <Package className="w-4 h-4" />
                        </button>
                        <button onClick={() => { 
                            setSelectedProduct(p); 
                            setProdForm({ name: p.name, description: p.description, price: String(p.price), categoryId: String(p.category?.id || '') }); 
                            setShowEditProduct(true); 
                          }}
                          className="flex justify-center items-center w-8 h-8 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors" title="Edit Product">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setSelectedProduct(p); fetchProductImages(p.id); setShowManageImages(true); }}
                          className="flex justify-center items-center w-8 h-8 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors" title="Manage Images">
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)}
                          className="flex justify-center items-center w-8 h-8 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors" title="Delete Product">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
            <span className="text-sm font-medium text-slate-500">Showing page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Categories Table */}
      <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Manage Categories</h2>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{['ID', 'Name', 'Description', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-sm">#{c.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 text-sm">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{c.description || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                       <button onClick={() => { setSelectedCategory(c); setCatForm({ name: c.name, description: c.description || '' }); setShowEditCategory(true); }}
                         className="flex justify-center items-center w-8 h-8 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors" title="Edit Category">
                         <Pencil className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDeleteCategory(c.id)}
                         className="flex justify-center items-center w-8 h-8 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors" title="Delete Category">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-slate-500">No categories found</td></tr>}
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

      {/* Edit Product Modal */}
      {showEditProduct && selectedProduct && (
        <Modal title="Edit Product" onClose={() => { setShowEditProduct(false); setSelectedProduct(null); }} onSubmit={handleEditProduct}>
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
        <Modal title={`Edit Category — ${selectedCategory.name}`} onClose={() => { setShowEditCategory(false); setSelectedCategory(null); }} onSubmit={handleEditCategory}>
          <div><label className={labelCls}>Category Name</label><input className={inputCls} value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Electronics" /></div>
          <div><label className={labelCls}>Description</label><input className={inputCls} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" /></div>
        </Modal>
      )}
    </div>
  );
};
