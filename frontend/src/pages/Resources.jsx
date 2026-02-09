import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { Plus, Search, MoreVertical, Edit3, Trash2, FolderOpen, CheckCircle, FileText, Archive } from 'lucide-react';

const statusConfig = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  DRAFT: { label: 'Draft', color: 'bg-amber-100 text-amber-700', icon: FileText },
  ARCHIVED: { label: 'Archived', color: 'bg-gray-100 text-gray-600', icon: Archive },
};

const defaultCategories = ['General', 'Marketing', 'Engineering', 'Design', 'Operations', 'Finance', 'HR'];

export default function Resources() {
  const { isAdmin } = useAuth();
  const [resources, setResources] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRes, setEditRes] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'DRAFT', category: 'General' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const data = await api.get(`/resources?${params}`);
      setResources(data.resources);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const openCreate = () => {
    setEditRes(null);
    setForm({ title: '', description: '', status: 'DRAFT', category: 'General' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditRes(r);
    setForm({ title: r.title, description: r.description || '', status: r.status, category: r.category });
    setError('');
    setMenuOpen(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editRes) {
        await api.patch(`/resources/${editRes.id}`, form);
      } else {
        await api.post('/resources', form);
      }
      setModalOpen(false);
      fetchResources();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteResource = async (r) => {
    setMenuOpen(null);
    if (!confirm(`Delete "${r.title}"? This action cannot be undone.`)) return;
    await api.delete(`/resources/${r.id}`);
    fetchResources();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-500 mt-1">{total} resource{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> New Resource
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input className="input pl-10" placeholder="Search resources..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-1.5">
          {['', 'ACTIVE', 'DRAFT', 'ARCHIVED'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : resources.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <FolderOpen className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No resources found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first resource to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {resources.map(r => {
            const sc = statusConfig[r.status];
            const StatusIcon = sc.icon;
            return (
              <div key={r.id} className="card p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <span className={`badge gap-1 ${sc.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {sc.label}
                  </span>
                  <div className="relative">
                    <button onClick={() => setMenuOpen(menuOpen === r.id ? null : r.id)}
                      className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    {menuOpen === r.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-10">
                        <button onClick={() => openEdit(r)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => deleteResource(r)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{r.title}</h3>
                {r.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{r.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <span className="badge bg-gray-100 text-gray-600">{r.category}</span>
                  {isAdmin && r.createdBy && (
                    <span className="text-xs text-gray-400">{r.createdBy.name}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm">Previous</button>
          <span className="text-sm text-gray-500 px-3">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm">Next</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRes ? 'Edit Resource' : 'New Resource'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[100px] resize-y" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {defaultCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editRes ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
