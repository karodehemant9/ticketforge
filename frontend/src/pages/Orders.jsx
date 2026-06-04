import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Package, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings/orders').then(res => {
      setOrders(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'reserved': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) return <div className="text-center py-12">Loading orders...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{order.event_title}</h3>
                <p className="text-sm text-gray-500">{new Date(order.event_date).toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-1">₹{order.final_amount}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                <span className="text-sm font-medium capitalize">{order.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}