import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateVenueForm from '../components/CreateVenueForm';
import CreateEventForm from '../components/CreateEventForm';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { Building2, Calendar, Plus, MapPin, Eye, CheckCircle } from 'lucide-react';

export default function OrganizerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [myEvents, setMyEvents] = useState([]);
  const [myVenues, setMyVenues] = useState([]);

  useEffect(() => {
    if (user?.role !== 'organizer') navigate('/dashboard');
  }, [user, navigate]);

  const fetchEvents = () => {
    api.get('/events/my').then(res => setMyEvents(res.data.data)).catch(() => {});
  };

  const fetchVenues = () => {
    api.get('/venues/my').then(res => setMyVenues(res.data.data)).catch(() => {});
  };

  useEffect(() => {
    if (activeTab === 'events') fetchEvents();
    if (activeTab === 'venues') fetchVenues();
  }, [activeTab]);

  const publishEvent = async (eventId) => {
    try {
      await api.patch(`/events/${eventId}/publish`);
      fetchEvents();
      alert('Event published successfully!');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to publish');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Organizer Dashboard</h1>
        <p className="text-gray-600">Manage your venues and events</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setActiveTab('events')} className={`flex items-center px-4 py-2 rounded-md ${activeTab === 'events' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}>
          <Calendar className="h-4 w-4 mr-2" /> My Events
        </button>
        <button onClick={() => setActiveTab('venues')} className={`flex items-center px-4 py-2 rounded-md ${activeTab === 'venues' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}>
          <Building2 className="h-4 w-4 mr-2" /> My Venues
        </button>
        <button onClick={() => setActiveTab('create-event')} className={`flex items-center px-4 py-2 rounded-md ${activeTab === 'create-event' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}>
          <Plus className="h-4 w-4 mr-2" /> Create Event
        </button>
        <button onClick={() => setActiveTab('create-venue')} className={`flex items-center px-4 py-2 rounded-md ${activeTab === 'create-venue' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}>
          <Plus className="h-4 w-4 mr-2" /> Create Venue
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'events' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">My Events</h2>
            {myEvents.length === 0 ? (
              <p className="text-gray-500">No events yet. Create one!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myEvents.map(event => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{event.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{event.venue_name}</p>
                        <p className="text-sm text-gray-500">{new Date(event.event_date).toLocaleString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${event.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {event.status}
                      </span>
                    </div>
                    {event.poster_url && (
                      <img src={event.poster_url} alt={event.title} className="w-full h-32 object-cover rounded mt-3" />
                    )}
                    <div className="flex gap-2 mt-3">
                      {event.status === 'draft' && (
                        <button 
                          onClick={() => publishEvent(event.id)}
                          className="flex items-center text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Publish
                        </button>
                      )}
                      <button className="flex items-center text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                        <Eye className="h-3 w-3 mr-1" /> Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'venues' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">My Venues</h2>
            {myVenues.length === 0 ? (
              <p className="text-gray-500">No venues yet. Create one!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myVenues.map(venue => (
                  <div key={venue.id} className="border rounded-lg p-4">
                    <h3 className="font-bold">{venue.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" /> {venue.city}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Capacity: {venue.capacity}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create-event' && <CreateEventForm onSuccess={() => { setActiveTab('events'); fetchEvents(); }} />}
        {activeTab === 'create-venue' && <CreateVenueForm onSuccess={() => { setActiveTab('venues'); fetchVenues(); }} />}
      </div>
    </div>
  );
}