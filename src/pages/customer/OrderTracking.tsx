import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { CheckCircle2, Clock, Truck, Package, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// OrderDto: { id, userId, status, items: [{productId, quantity, price}] }
type OrderItem = { productId: number; quantity: number; price: number };
type OrderDto = { id: number; userId: number; status: string; items: OrderItem[] };

const STAGES = ['PENDING', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const stageIcon: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-5 h-5" />,
  PROCESSING: <Package className="w-5 h-5" />,
  SHIPPED: <Truck className="w-5 h-5" />,
  OUT_FOR_DELIVERY: <Truck className="w-5 h-5" />,
  DELIVERED: <CheckCircle2 className="w-5 h-5" />,
};

export const OrderTracking: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // GET /orders/{id} → OrderDto
    api.get(`/orders/${id}`)
      .then(r => setOrder(r.data))
      .catch(() => toast.error('Failed to load order details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;
  if (!order) return <div className="text-center py-24 text-slate-500">Order not found.</div>;

  const currentStageIdx = STAGES.indexOf(order.status);
  const total = order.items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link to="/customer/orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Order #{order.id}</h1>
        <p className="text-slate-500 mt-1">Status: <span className="font-semibold">{order.status}</span></p>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Tracking Progress</h2>
        <div className="relative">
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100" />
          <div className="space-y-6">
            {STAGES.map((stage, idx) => {
              const done = idx <= currentStageIdx;
              const active = idx === currentStageIdx;
              return (
                <div key={stage} className="flex items-center gap-4 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${done ? (active ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-indigo-100 text-indigo-600') : 'bg-slate-100 text-slate-400'}`}>
                    {stageIcon[stage]}
                  </div>
                  <div>
                    <p className={`font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>{stage.replace(/_/g, ' ')}</p>
                    {active && <p className="text-xs text-indigo-500">Current status</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Order Items</h2>
        <div className="space-y-3">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
              <div>
                <p className="font-medium text-slate-900">Product #{item.productId}</p>
                <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
              </div>
              <span className="font-bold text-slate-900">
                {item.price ? `₹${(item.price * item.quantity).toLocaleString()}` : 'Pending pricing'}
              </span>
            </div>
          ))}
        </div>
        {total > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <p className="text-base font-semibold text-slate-700">Estimated Total</p>
            <p className="text-xl font-bold text-slate-900">₹{total.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};
