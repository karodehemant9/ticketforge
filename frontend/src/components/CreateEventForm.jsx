import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import api from '../api/axios';

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['concert', 'sports', 'theater', 'conference', 'comedy', 'other']),
  eventDate: z.string().min(1),
  durationMinutes: z.string().min(1),
  venueId: z.string().min(1),
});

export default function CreateEventForm({ onSuccess }) {
  const [venues, setVenues] = useState([]);
  const [poster, setPoster] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    api.get('/venues/my').then(res => setVenues(res.data.data)).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('category', data.category);
      formData.append('eventDate', data.eventDate);
      formData.append('durationMinutes', data.durationMinutes);
      formData.append('venueId', data.venueId);
      if (poster) formData.append('poster', poster);

      await api.post('/events', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('root', { message: err.response?.data?.error?.message || 'Failed to create event' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700">Event Title</label>
        <input {...register('title')} className="mt-1 block w-full rounded-md border px-3 py-2" />
        {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea {...register('description')} rows={3} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select {...register('category')} className="mt-1 block w-full rounded-md border px-3 py-2">
          <option value="concert">Concert</option>
          <option value="sports">Sports</option>
          <option value="theater">Theater</option>
          <option value="conference">Conference</option>
          <option value="comedy">Comedy</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Event Date</label>
          <input type="datetime-local" {...register('eventDate')} className="mt-1 block w-full rounded-md border px-3 py-2" />
          {errors.eventDate && <p className="text-sm text-red-600">{errors.eventDate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
          <input type="number" {...register('durationMinutes')} className="mt-1 block w-full rounded-md border px-3 py-2" />
          {errors.durationMinutes && <p className="text-sm text-red-600">{errors.durationMinutes.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Venue</label>
        <select {...register('venueId')} className="mt-1 block w-full rounded-md border px-3 py-2">
          <option value="">Select venue</option>
          {venues.map(v => (
            <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
          ))}
        </select>
        {errors.venueId && <p className="text-sm text-red-600">{errors.venueId.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Poster Image</label>
        <input type="file" accept="image/*" onChange={e => setPoster(e.target.files[0])} className="mt-1 block w-full" />
      </div>
      {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
        {isSubmitting ? 'Creating...' : 'Create Event'}
      </button>
    </form>
  );
}