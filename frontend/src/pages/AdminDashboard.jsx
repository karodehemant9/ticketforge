import { useState, useEffect } from 'react';
import api from '../api/axios';
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(res => { setData(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12">Loading analytics...</div>;
  if (!data) return <div className="text-center py-12">Failed to load analytics</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<Users className="h-6 w-6 text-blue-600" />} label="Total Users" value={data.summary.total_users} />
        <SummaryCard icon={<Calendar className="h-6 w-6 text-green-600" />} label="Active Events" value={data.summary.active_events} />
        <SummaryCard icon={<DollarSign className="h-6 w-6 text-indigo-600" />} label="Total Revenue" value={`₹${data.summary.total_revenue}`} />
        <SummaryCard icon={<Activity className="h-6 w-6 text-purple-600" />} label="Total Orders" value={data.summary.total_orders} />
      </div>

      {/* Top Events */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" /> Top 5 Events by Revenue
        </h2>
        <div className="space-y-3">
          {data.topEvents.map(event => (
            <div key={event.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-full text-sm font-bold">
                  {event.rank}
                </span>
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-gray-500 capitalize">{event.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-600">₹{event.total_revenue}</p>
                <p className="text-sm text-gray-500">{event.tickets_sold} tickets</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Growth */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" /> Weekly Revenue Growth
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Week</th>
                <th className="text-right py-2 px-4">Revenue</th>
                <th className="text-right py-2 px-4">Growth</th>
              </tr>
            </thead>
            <tbody>
              {data.weeklyGrowth.map((week, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 px-4">{new Date(week.week).toLocaleDateString()}</td>
                  <td className="py-2 px-4 text-right">₹{week.revenue}</td>
                  <td className="py-2 px-4 text-right">
                    <span className={`${week.growth_percent > 0 ? 'text-green-600' : week.growth_percent < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {week.growth_percent ? `${week.growth_percent}%` : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
      {icon}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}