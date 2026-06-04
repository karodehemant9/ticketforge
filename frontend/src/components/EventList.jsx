import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Calendar, MapPin, Search } from 'lucide-react';

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events?search=${encodeURIComponent(search)}&page=1&limit=20`);
      setEvents(res.data.data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 block w-full rounded-md border px-3 py-2"
        />
      </div>
      
      {loading ? (
        <p className="text-center py-8 text-gray-500">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div 
              key={event.id} 
              onClick={() => navigate(`/events/${event.id}`)}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition cursor-pointer"
            >
              {event.poster_url && (
                <img src={event.poster_url} alt={event.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-600 mt-1 capitalize">{event.category}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(event.event_date).toLocaleString()}
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {event.venue_name}, {event.venue_city}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}