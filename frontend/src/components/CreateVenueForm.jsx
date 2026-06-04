import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api/axios';

const schema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  capacity: z.string().min(1),
});

export default function CreateVenueForm({ onSuccess }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/venues', {
        ...data,
        capacity: parseInt(data.capacity),
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('root', { message: err.response?.data?.error?.message || 'Failed to create venue' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700">Venue Name</label>
        <input {...register('name')} className="mt-1 block w-full rounded-md border px-3 py-2" />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <input {...register('address')} className="mt-1 block w-full rounded-md border px-3 py-2" />
        {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">City</label>
        <input {...register('city')} className="mt-1 block w-full rounded-md border px-3 py-2" />
        {errors.city && <p className="text-sm text-red-600">{errors.city.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Capacity</label>
        <input type="number" {...register('capacity')} className="mt-1 block w-full rounded-md border px-3 py-2" />
        {errors.capacity && <p className="text-sm text-red-600">{errors.capacity.message}</p>}
      </div>
      {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
        {isSubmitting ? 'Creating...' : 'Create Venue'}
      </button>
    </form>
  );
}