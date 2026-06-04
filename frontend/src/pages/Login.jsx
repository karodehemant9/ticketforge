import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Sign in to TicketForge</h2>
        <LoginForm />
        <p className="text-center text-sm text-gray-600">
          Don''t have an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-500">Register</Link>
        </p>
      </div>
    </div>
  );
}