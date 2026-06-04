import { Link } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
        <RegisterForm />
        <p className="text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
}