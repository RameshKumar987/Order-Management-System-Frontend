import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Save, Loader2, Home, Building2, Map as MapIcon, Hash } from 'lucide-react';
import { api } from '../../api/axios';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon issues in React
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

type UserAddress = {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
};

// Component to handle map centering
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
};

// Component to handle map clicks
const LocationMarker = ({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

export const CustomerProfile: React.FC = () => {
  const [address, setAddress] = useState<UserAddress>({
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default India center
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/users/me');
      const data = res.data;
      console.log('Fetched profile data:', data);
      const addr = {
        addressLine: data.addressLine || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        latitude: data.latitude,
        longitude: data.longitude,
      };
      setAddress(addr);
      if (data.latitude && data.longitude) {
        setMapCenter([data.latitude, data.longitude]);
        setMarkerPos([data.latitude, data.longitude]);
      }
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPos([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setAddress(prev => ({ ...prev, latitude, longitude }));
        setLocating(false);
        toast.success('Location detected!');
        
        // Reverse geocoding attempt (optional, using OSM Nominatim)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then(res => res.json())
          .then(data => {
            if (data.address) {
              setAddress(prev => ({
                ...prev,
                city: data.address.city || data.address.town || data.address.village || prev.city,
                state: data.address.state || prev.state,
                pincode: data.address.postcode || prev.pincode,
                addressLine: data.display_name || prev.addressLine
              }));
            }
          })
          .catch(() => {}); // Quiet fail for reverse geocoding
      },
      () => {
        toast.error('Unable to retrieve your location');
        setLocating(false);
      }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...address,
        latitude: markerPos ? markerPos[0] : null,
        longitude: markerPos ? markerPos[1] : null,
      };
      console.log('Saving address payload:', payload);
      const res = await api.put('/auth/users/me/address', payload);
      console.log('Save response:', res.data);
      toast.success('Address and location saved!');
    } catch (err: any) {
      console.error('Save address error:', err.response?.data || err.message);
      toast.error('Failed to save address: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-indigo-600" /> Delivery Address & Location
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage your delivery destination on the map.</p>
          </div>
          <button
            onClick={handleGetCurrentLocation}
            disabled={locating}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            Detect My Location
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Form Side */}
          <form onSubmit={handleSave} className="p-6 space-y-4 border-r border-slate-100">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                  <Home className="w-4 h-4" /> Address Line
                </label>
                <textarea
                  required
                  rows={3}
                  value={address.addressLine}
                  onChange={e => setAddress({ ...address, addressLine: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm resize-none"
                  placeholder="House No, Street, Landmark..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> City
                  </label>
                  <input
                    required
                    type="text"
                    value={address.city}
                    onChange={e => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                    <MapIcon className="w-4 h-4" /> State
                  </label>
                  <input
                    required
                    type="text"
                    value={address.state}
                    onChange={e => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="State"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Pincode
                </label>
                <input
                  required
                  type="text"
                  value={address.pincode}
                  onChange={e => setAddress({ ...address, pincode: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="6-digit Pincode"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  {markerPos ? (
                    <span>Coordinates: {markerPos[0].toFixed(5)}, {markerPos[1].toFixed(5)}</span>
                  ) : (
                    <span className="text-amber-500 flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> Pin location on map for accuracy
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-md disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save All
                </button>
              </div>
            </div>
          </form>

          {/* Map Side */}
          <div className="relative min-h-[400px] bg-slate-100">
            <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <ChangeView center={mapCenter} />
              <LocationMarker position={markerPos} setPosition={setMarkerPos} />
            </MapContainer>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200 text-[10px] font-bold text-slate-600 pointer-events-none">
              Click map to set precise delivery point
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
