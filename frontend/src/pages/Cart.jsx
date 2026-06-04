import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ShoppingCart, Trash2, Clock, CreditCard } from 'lucide-react';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const res = await api.get('/bookings/cart');
      setCart(res.data.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    // Refresh cart every 30 seconds to show countdown
    const interval = setInterval(fetchCart, 30000);
    return () => clearInterval(interval);
  }, []);

  const removeItem = async (pricingId) => {
    try {
      await api.delete(`/bookings/cart/${pricingId}`);
      fetchCart();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to remove');
    }
  };

  const checkout = async () => {
    setCheckingOut(true);
    try {
      // Generate idempotency key (client-side UUID)
      const idempotencyKey = crypto.randomUUID();
      const res = await api.post('/bookings/checkout', { idempotencyKey });
      
      if (res.data.data.isDuplicate) {
        alert('Order already processed! Redirecting...');
      } else {
        alert('Order reserved! Complete payment to confirm.');
      }
      navigate('/orders');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading cart...</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 bg-white rounded-lg shadow">
        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 mt-2">Browse events and add tickets to get started.</p>
        <button onClick={() => navigate('/events')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Browse Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          {cart.expiresAt && (
            <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
              <Clock className="h-4 w-4 mr-1" />
              Expires {new Date(cart.expiresAt).toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {cart.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-semibold">Event</h3>
                <p className="text-sm text-gray-600">{item.quantity} x ₹{item.unitPrice}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold">₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                <button onClick={() => removeItem(item.pricingId)} className="text-red-600 hover:text-red-800">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>₹{cart.total.toFixed(2)}</span>
          </div>
          <button 
            onClick={checkout}
            disabled={checkingOut}
            className="w-full mt-4 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-semibold"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}