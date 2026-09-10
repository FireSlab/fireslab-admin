'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

interface CompanyStatItem {
  id: string;
  target_value: number;
  suffix: string;
  label: string;
  order_index: number;
}

export default function CompanyStatsPage() {
  const [stats, setStats] = useState<CompanyStatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<CompanyStatItem | null>(null);
  const [formData, setFormData] = useState({
    target_value: 0,
    suffix: '+',
    label: '',
    order_index: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingStat, setDeletingStat] = useState<CompanyStatItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/proxy/company-stats');
      if (!res.ok) throw new Error('Failed to load company stats');
      const data = await res.json();
      setStats(data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching stats';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredStats = useMemo(() => {
    return stats.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.label.toLowerCase().includes(q) ||
        String(s.target_value).includes(q) ||
        s.suffix.toLowerCase().includes(q)
      );
    });
  }, [stats, searchQuery]);

  const openCreateModal = () => {
    setEditingStat(null);
    setFormData({
      target_value: 100,
      suffix: '+',
      label: '',
      order_index: stats.length + 1,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (st: CompanyStatItem) => {
    setEditingStat(st);
    setFormData({
      target_value: st.target_value,
      suffix: st.suffix,
      label: st.label,
      order_index: st.order_index,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.label.trim()) errs.label = 'Stat label is required';
    if (formData.target_value === undefined || isNaN(formData.target_value)) {
      errs.target_value = 'Valid number is required';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const url = editingStat
        ? `/api/proxy/company-stats/${editingStat.id}`
        : '/api/proxy/company-stats';
      const method = editingStat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save stat');

      showToast(editingStat ? 'Stat updated successfully' : 'Stat created successfully');
      setIsModalOpen(false);
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving stat';
      setFormErrors((prev) => ({ ...prev, global: msg }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStat) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/proxy/company-stats/${deletingStat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete stat');

      showToast('Stat removed successfully');
      setDeletingStat(null);
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setErrorMessage(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            Company Statistics & Milestones
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage the numerical achievements and counter badges displayed in the homepage stats bar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            title="Refresh stats"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)}>
            <X className="w-4 h-4 text-neutral-400 hover:text-white" />
          </button>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <div className="text-xs text-neutral-400 flex items-center gap-2">
          <span>Total Milestones:</span>
          <span className="font-semibold text-white bg-neutral-800 px-2 py-0.5 rounded-md">
            {stats.length}
          </span>
        </div>
      </div>

      {/* Stats Table */}
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            <span className="text-sm">Loading company stats...</span>
          </div>
        ) : filteredStats.length === 0 ? (
          <div className="p-16 text-center text-neutral-400">
            <BarChart3 className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-base font-medium text-neutral-300">No stats configured</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800/80 bg-neutral-950/40 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
                  <th className="py-3.5 px-4 w-16 text-center">Order</th>
                  <th className="py-3.5 px-4">Metric / Target</th>
                  <th className="py-3.5 px-4">Suffix</th>
                  <th className="py-3.5 px-4">Milestone Description</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50 text-sm">
                {filteredStats.map((st) => (
                  <tr key={st.id} className="group hover:bg-neutral-800/30 transition-colors">
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block text-xs font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800">
                        #{st.order_index}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-xl font-extrabold text-white group-hover:text-amber-400 transition-colors font-mono">
                        {st.target_value}
                        <span className="text-amber-500 text-base ml-0.5">{st.suffix}</span>
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <code className="text-xs text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-mono">
                        {st.suffix || '(none)'}
                      </code>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-semibold text-neutral-200">{st.label}</span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(st)}
                          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit Stat"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStat(st)}
                          className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Stat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                {editingStat ? 'Edit Stat' : 'Create New Stat'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formErrors.global && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formErrors.global}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Milestone Label <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData((p) => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. Years Experience, Projects Delivered"
                  className={`w-full bg-neutral-950 border ${
                    formErrors.label ? 'border-red-500' : 'border-neutral-800'
                  } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors`}
                />
                {formErrors.label && <p className="text-red-400 text-xs mt-1">{formErrors.label}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Target Number <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, target_value: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Suffix Tag
                  </label>
                  <input
                    type="text"
                    value={formData.suffix}
                    onChange={(e) => setFormData((p) => ({ ...p, suffix: e.target.value }))}
                    placeholder="e.g. +, %, Bar"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Display Order Index
                </label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, order_index: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingStat ? 'Save Changes' : 'Create Stat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingStat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Milestone</h3>
            </div>

            <p className="text-sm text-neutral-300">
              Are you sure you want to delete metric{' '}
              <strong className="text-white">&quot;{deletingStat.label}&quot;</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setDeletingStat(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
