'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Flame,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';

interface SolutionItem {
  id: string;
  category_tag: string;
  title_line1: string;
  title_line2: string;
  description: string;
  image_url: string;
  features: string[];
  linked_product_id: string | null;
  is_published: boolean;
  order_index: number;
  products?: {
    id: string;
    card_title: string;
    slug: string;
  } | null;
}

export default function SolutionsListPage() {
  const [solutions, setSolutions] = useState<SolutionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/proxy/solutions?include_drafts=true');
      if (!res.ok) {
        throw new Error('Failed to load solutions catalogue.');
      }
      const data = await res.json();
      setSolutions(data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading solutions.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick inline published/draft toggle
  const handleTogglePublish = async (solution: SolutionItem) => {
    const nextStatus = !solution.is_published;
    setTogglingId(solution.id);

    setSolutions((prev) =>
      prev.map((s) => (s.id === solution.id ? { ...s, is_published: nextStatus } : s))
    );

    try {
      const res = await fetch(`/api/proxy/solutions/${solution.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: nextStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update publishing status');
      }

      showToast(
        `Solution "${solution.title_line1} ${solution.title_line2}" is now ${
          nextStatus ? 'Published' : 'Draft'
        }.`
      );
    } catch (err: unknown) {
      setSolutions((prev) =>
        prev.map((s) => (s.id === solution.id ? { ...s, is_published: solution.is_published } : s))
      );
      const msg = err instanceof Error ? err.message : 'Update failed';
      setErrorMessage(msg);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete solution
  const handleDeleteSolution = async (solution: SolutionItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${solution.title_line1} ${solution.title_line2}"? This cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeletingId(solution.id);
    try {
      const res = await fetch(`/api/proxy/solutions/${solution.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete solution.');
      }

      setSolutions((prev) => prev.filter((s) => s.id !== solution.id));
      showToast(`Solution "${solution.title_line1} ${solution.title_line2}" deleted successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      setErrorMessage(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredSolutions = useMemo(() => {
    return solutions.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.title_line1.toLowerCase().includes(q) ||
        s.title_line2.toLowerCase().includes(q) ||
        s.category_tag.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    });
  }, [solutions, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-[#e07b2a]" />
            Thermal Engineering Solutions
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage front-facing system solutions, heat transfer architectures, and storage packages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            title="Refresh list"
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/dashboard/solutions/new"
            className="px-4 py-2 bg-gradient-to-r from-[#2d6a35] to-[#24572b] hover:from-[#357c3e] hover:to-[#2d6a35] text-white text-xs font-semibold rounded-lg shadow-md shadow-[#2d6a35]/20 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Solution</span>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center gap-2.5 text-emerald-300 text-xs shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-800/60 flex items-center gap-2.5 text-red-300 text-xs shadow-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-[#0f1412] border border-neutral-800/80 flex items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search solutions by title, category, or features..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-900/90 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35] transition"
          />
        </div>
        <div className="text-xs text-neutral-500">
          Total Solutions: <span className="text-white font-medium">{solutions.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#0f1412] border border-neutral-800/80 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#e07b2a]" />
            <span className="text-xs">Loading solutions...</span>
          </div>
        ) : filteredSolutions.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Flame className="w-10 h-10 text-neutral-600 mx-auto" />
            <div className="text-sm font-medium text-neutral-300">No solutions found</div>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Get started by creating your first engineering solution.'}
            </p>
            {!searchQuery && (
              <Link
                href="/dashboard/solutions/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 bg-[#2d6a35] hover:bg-[#357c3e] text-white text-xs font-medium rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Solution
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Solution</th>
                  <th className="py-3.5 px-4">Tag</th>
                  <th className="py-3.5 px-4">Linked Equipment</th>
                  <th className="py-3.5 px-4">Features</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-xs text-neutral-300">
                {filteredSolutions.map((solution) => {
                  const isToggling = togglingId === solution.id;
                  const isDeleting = deletingId === solution.id;

                  return (
                    <tr
                      key={solution.id}
                      className="hover:bg-neutral-800/30 transition group"
                    >
                      {/* Image & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800/80 overflow-hidden shrink-0 flex items-center justify-center">
                            {solution.image_url ? (
                              <img
                                src={solution.image_url}
                                alt={solution.title_line1}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Flame className="w-5 h-5 text-neutral-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white tracking-wide truncate max-w-xs">
                              {solution.title_line1} {solution.title_line2}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-xs">
                              Sort order: #{solution.order_index}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category Tag */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#e07b2a]/15 text-[#e07b2a] border border-[#e07b2a]/30">
                          {solution.category_tag}
                        </span>
                      </td>

                      {/* Linked Equipment */}
                      <td className="py-3 px-4">
                        {solution.products ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <Package className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {solution.products.card_title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">Custom Solution</span>
                        )}
                      </td>

                      {/* Features */}
                      <td className="py-3 px-4">
                        <span className="text-neutral-400 text-xs">
                          {Array.isArray(solution.features) ? solution.features.length : 0} feature
                          points
                        </span>
                      </td>

                      {/* Status & Inline Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleTogglePublish(solution)}
                          title={`Click to ${solution.is_published ? 'unpublish' : 'publish'}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer disabled:opacity-50 ${
                            solution.is_published
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/70 hover:bg-emerald-900/60'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : solution.is_published ? (
                            <Eye className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-neutral-500" />
                          )}
                          <span>{solution.is_published ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/solutions/${solution.id}`}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                            title="Edit Solution"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDeleteSolution(solution)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-950/40 transition disabled:opacity-40"
                            title="Delete Solution"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
