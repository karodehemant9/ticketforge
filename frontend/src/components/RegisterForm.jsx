import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['attendee', 'organizer']).optional(),
});

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/register', data);
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err) {
      setError('root', { message: err.response?.data?.error?.message || 'Registration failed' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input {...register('firstName')} className="mt-1 block w-full rounded-md border px-3 py-2" />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input {...register('lastName')} className="mt-1 block w-full rounded-md border px-3 py-2" />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
        </div>
      </div>
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
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone (optional)</label>
        <input {...register('phone')} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Account Type</label>
        <select {...register('role')} className="mt-1 block w-full rounded-md border px-3 py-2">
          <option value="attendee">Attendee (Buy Tickets)</option>
          <option value="organizer">Organizer (Host Events)</option>
        </select>
      </div>
      {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}