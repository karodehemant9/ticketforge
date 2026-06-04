import EventList from '../components/EventList';

export default function Events() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Events</h1>
        <p className="text-gray-600">Discover concerts, sports, theater and more</p>
      </div>
      <EventList />
    </div>
  );
}