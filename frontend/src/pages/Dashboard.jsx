import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { Calendar, Ticket, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verifyUser = async () => {
      try {
        const res = await api.get('/auth/me');
        if (!cancelled) {
          setUser(res.data.data);
          setPageLoading(false);
        }
      } catch (err) {
        // Token invalid or expired - clear and redirect
        if (!cancelled) {
          logout();
          navigate('/login');
        }
      }
    };

    verifyUser();
    return () => { cancelled = true; };
  }, [setUser, logout, navigate]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.firstName}!</h1>
        <p className="mt-2 text-gray-600 capitalize">Role: {user?.role}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <Calendar className="h-8 w-8 text-indigo-600 mb-2" />
          <h3 className="text-lg font-medium">Events</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">0</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <Ticket className="h-8 w-8 text-green-600 mb-2" />
          <h3 className="text-lg font-medium">Tickets Sold</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">0</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
          <h3 className="text-lg font-medium">Revenue</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">₹0</p>
        </div>
      </div>
    </div>
  );
}