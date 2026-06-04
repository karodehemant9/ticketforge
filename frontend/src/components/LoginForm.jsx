import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default function LoginForm() {
  const navigate = useNavigate();
  const { setUser, setAuth } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/login', data);
      const { user, tokens } = response.data.data;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      setUser(user);
      setAuth(true);
      navigate('/dashboard');
    } catch (err) {
      setError('root', { message: err.response?.data?.error?.message || 'Login failed' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input {...register('email')} type="email" className="mt-1 block w-full rounded-md border px-3 py-2" />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input {...register('password')} type="password" className="mt-1 block w-full rounded-md border px-3 py-2" />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>
      {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}