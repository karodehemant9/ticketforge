import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Calendar, MapPin, Clock, ShoppingCart, Minus, Plus, Ticket, AlertCircle } from 'lucide-react';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchEvent();
    fetchCart();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const [eventRes, availRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/bookings/events/${id}/availability`),
      ]);
      setEvent(eventRes.data.data);
      setAvailability(availRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await api.get('/bookings/cart');
      setCartCount(res.data.data.items?.length || 0);
    } catch (err) {
      // Not logged in or empty cart
    }
  };

  const addToCart = async () => {
    if (!selectedPricing) return;
    setAddingToCart(true);
    try {
      await api.post('/bookings/cart', {
        eventId: id,
        pricingId: selectedPricing.pricing_id,  // FIXED: was .id
        quantity,
      });
      fetchCart();
      alert('Added to cart! You have 15 minutes to checkout.');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading event...</div>;
  if (!event) return <div className="text-center py-12">Event not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {event.poster_url && (
          <img src={event.poster_url} alt={event.title} className="w-full h-64 object-cover" />
        )}
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-gray-600 mt-2 capitalize">{event.category}</p>
            </div>
            <button 
              onClick={() => navigate('/cart')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" /> Cart ({cartCount})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
              {new Date(event.event_date).toLocaleString()}
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
              {event.venue_name}, {event.venue_city}
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-5 w-5 mr-2 text-indigo-600" />
              {event.duration_minutes} minutes
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Select Tickets</h2>
            {availability.length === 0 ? (
              <p className="text-gray-500">No tickets available.</p>
            ) : (
              <div className="space-y-3">
                {availability.map(tier => {
                  const remaining = tier.available_tickets - tier.sold_tickets;
                  const isSelected = selectedPricing?.pricing_id === tier.pricing_id;  // FIXED: was .id
                  return (
                    <div 
                      key={tier.pricing_id}
                      onClick={() => { setSelectedPricing(tier); setQuantity(1); }}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold">{tier.section_name} <span className="text-sm font-normal text-gray-500 capitalize">({tier.section_type})</span></h3>
                          <p className="text-indigo-600 font-semibold mt-1">₹{tier.base_price}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm ${remaining < 10 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            {remaining} left
                          </p>
                          {remaining < 10 && <p className="text-xs text-red-500">Selling fast!</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedPricing && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Quantity</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 rounded-full bg-white border hover:bg-gray-100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(selectedPricing.max_booking_quantity || 10, quantity + 1))}
                    className="p-1 rounded-full bg-white border hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-indigo-600">₹{(selectedPricing.base_price * quantity).toFixed(2)}</p>
                </div>
                <button 
                  onClick={addToCart}
                  disabled={addingToCart}
                  className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-semibold"
                >
                  <Ticket className="h-5 w-5 mr-2" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
              <div className="flex items-center mt-3 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                <AlertCircle className="h-4 w-4 mr-2" />
                Tickets reserved for 15 minutes. Checkout soon!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}