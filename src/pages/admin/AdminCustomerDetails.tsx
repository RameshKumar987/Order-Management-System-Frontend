import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { MapPin, ShoppingBag, ArrowLeft, Loader2, User, Mail, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Leaflet fix
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type OrderItem = { productId: number; productName: string; quantity: number; price: number };
type OrderDto = { 
  id: number; 
  status: string; 
  items: OrderItem[]; 
  deliveryAddress: string; 
  deliveryCity: string; 
  deliveryLat: number | null; 
  deliveryLng: number | null 
};
type CustomerInfo = {
  id: number;
  name: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
};

const RecenterMap = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

export const AdminCustomerDetails: React.FC = () => {
  const { userId } = useParams();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, ordersRes] = await Promise.all([
          api.get(`/auth/admin/users/${userId}`),
          api.get('/orders/admin/all') // We filter locally for now since we don't have a /orders/user/:id for admin yet
        ]);
        
        setCustomer(userRes.data);
        const userOrders = ordersRes.data.filter((o: any) => o.userId === Number(userId));
        setOrders(userOrders);
      } catch (err) {
        toast.error('Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
  if (!customer) return <div className="p-10 text-center">Customer not found</div>;

  const orderTotal = (o: OrderDto) => o.items?.reduce((s, i) => s + (i.price || 0) * i.quantity, 0) ?? 0;
  
  // Collect all points for map bounds
  const mapPoints: [number, number][] = [];
  if (customer.latitude && customer.longitude) mapPoints.push([customer.latitude, customer.longitude]);
  orders.forEach(o => {
    if (o.deliveryLat && o.deliveryLng) mapPoints.push([o.deliveryLat, o.deliveryLng]);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin" className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Details</h1>
          <p className="text-sm text-slate-500">Overview of activities and delivery locations for User #{userId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 mx-auto">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 text-center mb-1">{customer.name}</h2>
            <p className="text-slate-500 text-sm text-center mb-6">{customer.email}</p>
            
            <div className="space-y-4 border-t border-slate-50 pt-6">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</p>
                  <p className="text-sm text-slate-700">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Saved Address</p>
                  <p className="text-sm text-slate-700">{customer.addressLine || 'No address saved'}</p>
                  <p className="text-sm text-slate-700">{customer.city} {customer.state} {customer.pincode}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShoppingBag className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Order Count</p>
                  <p className="text-sm text-slate-700 font-bold">{orders.length} Orders placed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Navigation className="w-5 h-5"/> Location Monitor</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Tracking deliveries across multiple locations helps in optimizing logistic routes and verifying successful drop-offs.
            </p>
          </div>
        </div>

        {/* Middle/Right: Map & Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-[400px] relative">
             <MapContainer center={[20, 78]} zoom={4} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <RecenterMap points={mapPoints} />
                
                {/* Profile Location Pin (Blue) */}
                {customer.latitude && customer.longitude && (
                  <Marker position={[customer.latitude, customer.longitude]}>
                    <Popup>
                      <div className="text-xs">
                        <p className="font-bold text-indigo-600 mb-1">Customer Home</p>
                        <p>{customer.addressLine}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Order Delivery Pins (Red/Custom) */}
                {orders.map(o => (
                  o.deliveryLat && o.deliveryLng && (
                    <Marker 
                      key={o.id} 
                      position={[o.deliveryLat, o.deliveryLng]}
                      icon={new L.Icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                      })}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-bold text-red-600 mb-1">Order #{o.id}</p>
                          <p className="text-slate-500 mb-1">{o.status}</p>
                          <p>{o.deliveryAddress}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
            </MapContainer>
            <div className="absolute top-4 right-4 z-[1000] space-y-2">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Current Profile Address</span>
              </div>
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Order Delivery Points</span>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
               <h3 className="font-bold text-slate-900">Order History for this Customer</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['Order ID', 'Items', 'Delivery Loc', 'Amount', 'Status'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">#{o.id}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {o.items?.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span className="truncate max-w-[150px]">{o.deliveryAddress || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{orderTotal(o).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                          o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">No orders found for this customer.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
