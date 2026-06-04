import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Ticket, Calendar, Building2, ShoppingCart, Package } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="flex items-center">
                <Ticket className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">TicketForge</span>
              </Link>
              <Link to="/events" className="flex items-center text-sm text-gray-600 hover:text-indigo-600">
                <Calendar className="h-4 w-4 mr-1" /> Browse
              </Link>
              {user?.role === 'organizer' && (
                <Link to="/organizer/dashboard" className="flex items-center text-sm text-gray-600 hover:text-indigo-600">
                  <Building2 className="h-4 w-4 mr-1" /> Organizer
                </Link>
              )}
              {user && (
                <>
                  <Link to="/cart" className="flex items-center text-sm text-gray-600 hover:text-indigo-600">
                    <ShoppingCart className="h-4 w-4 mr-1" /> Cart
                  </Link>
                  <Link to="/orders" className="flex items-center text-sm text-gray-600 hover:text-indigo-600">
                    <Package className="h-4 w-4 mr-1" /> Orders
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <span className="text-sm text-gray-600 capitalize">{user.role}: {user.firstName}</span>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}