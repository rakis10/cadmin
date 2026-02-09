import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { Users, FolderOpen, CheckCircle, FileText, Archive } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }) {
  const colorMap = {
    indigo: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
  };
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats').then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your workspace</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} color="indigo" />
        <StatCard label="Total Resources" value={stats?.totalResources || 0} icon={FolderOpen} color="sky" />
        <StatCard label="Active Resources" value={stats?.activeResources || 0} icon={CheckCircle} color="green" />
        <StatCard label="Draft Resources" value={stats?.draftResources || 0} icon={FileText} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Users</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {stats?.recentUsers?.map(user => (
              <div key={user.id} className="px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-semibold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <span className={`badge ${
                  user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                  user.role === 'ADMIN' ? 'bg-brand-100 text-brand-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resources by Category */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Resources by Category</h2>
          </div>
          <div className="p-6 space-y-4">
            {stats?.resourcesByCategory?.length > 0 ? stats.resourcesByCategory.map(cat => {
              const maxCount = Math.max(...stats.resourcesByCategory.map(c => c.count));
              const pct = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{cat.name}</span>
                    <span className="text-gray-500">{cat.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-gray-500 text-center py-4">No resources yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
