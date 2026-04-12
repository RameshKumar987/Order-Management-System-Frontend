import React, { useEffect, useState } from 'react';
import { api, inventoryApi } from '../../api/axios';
import { Package, Search } from 'lucide-react';
import { toast } from 'sonner';

type Product = { id: number; name: string; price: number; stock: number; category: { id: number; name: string }; imageUrls: string[] };
type Category = { id: number; name: string };

export const CustomerProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pr, cr] = await Promise.all([inventoryApi.get('/inventory/products/with-stock'), inventoryApi.get('/inventory/categories')]);
        // Sort: Recent Top (Highest ID first)
        const sorted = (pr.data || []).sort((a: any, b: any) => b.id - a.id);
        setProducts(sorted); setCategories(cr.data);
      } catch { toast.error('Discovery failure: Could not sync catalog'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleOrder = async (product: Product) => {
    try {
      // 1. Fetch user's current address from profile
      const userRes = await api.get('/auth/users/me');
      const user = userRes.data;

      // 2. Prepare order with address snapshot
      const orderPayload = {
        items: [{ 
          productId: product.id, 
          productName: product.name,
          quantity: 1 
        }],
        deliveryAddress: user.addressLine || 'Store Pickup',
        deliveryCity: user.city || '',
        deliveryLat: user.latitude,
        deliveryLng: user.longitude
      };

      await api.post('/orders', orderPayload);
      toast.success('Order placed with saved address!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    }
  };

  const filtered = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === null || p.category?.id === selectedCat;
    return matchName && matchCat;
  }).sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, selectedCat]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">All Products</h1>
        <p className="text-slate-500">Browse our catalog and place orders instantly.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedCat(null)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${selectedCat === null ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>All</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${selectedCat === c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentProducts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
              <div className="h-48 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative group overflow-hidden">
                {p.imageUrls && p.imageUrls.length > 0 ? (
                  <div className="w-full h-full relative flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                    {p.imageUrls.map((url, i) => (
                      <div key={i} className="min-w-full h-full snap-center flex-shrink-0 relative">
                        <img src={url} className="h-full w-full object-contain p-2" alt={`${p.name} - ${i + 1}`} />
                      </div>
                    ))}
                    {p.imageUrls.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {p.imageUrls.map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 opacity-80" />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Package className="w-14 h-14 text-slate-300" />
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-indigo-500 font-medium mb-1">{p.category?.name}</p>
                <h3 className="font-semibold text-slate-900 text-sm flex-1">{p.name}</h3>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-900">₹{p.price.toLocaleString()}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-600' : p.stock <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {p.stock === 0 ? 'Out of stock' : p.stock <= 5 ? `Only ${p.stock} left` : 'In stock'}
                  </span>
                </div>
                <button onClick={() => handleOrder(p)} disabled={p.stock === 0}
                  className="mt-3 w-full text-sm font-medium bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {p.stock === 0 ? 'Out of Stock' : 'Place Order'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-between px-8 py-6 bg-white/50 backdrop-blur-sm rounded-[24px] border border-slate-100 shadow-sm">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Page <span className="text-slate-900 ml-2">{currentPage} / {totalPages}</span></div>
           <div className="flex gap-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-40"
              >
                Next
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
