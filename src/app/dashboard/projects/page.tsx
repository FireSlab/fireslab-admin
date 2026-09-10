'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Star,
  MapPin,
  Building,
} from 'lucide-react';

interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  location: string;
  category: string;
  product_used: string;
  product_id: string | null;
  image_url: string;
  client_name: string | null;
  completion_year: number | null;
  is_featured: boolean;
  is_published: boolean;
  order_index: number;
  products?: {
    id: string;
    card_title: string;
    slug: string;
  } | null;
}

const CATEGORY_NAMES: Record<string, string> = {
  hotel: 'Hotel & Hospitality',
  hospital: 'Hospital & Healthcare',
  industrial: 'Industrial Plants',
  pool: 'Commercial Pools',
  residential: 'Residential & Villas',
};

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/proxy/projects?include_drafts=true');
      if (!res.ok) {
        throw new Error('Failed to load projects.');
      }
      const data = await res.json();
      setProjects(data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading projects.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Inline published/draft toggle
  const handleTogglePublish = async (project: ProjectItem) => {
    const nextStatus = !project.is_published;
    setTogglingId(project.id);

    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, is_published: nextStatus } : p))
    );

    try {
      const res = await fetch(`/api/proxy/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: nextStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update status');
      }

      showToast(`Case study "${project.title}" is now ${nextStatus ? 'Published' : 'Draft'}.`);
    } catch (err: unknown) {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, is_published: project.is_published } : p))
      );
      const msg = err instanceof Error ? err.message : 'Update failed';
      setErrorMessage(msg);
    } finally {
      setTogglingId(null);
    }
  };

  // Inline featured toggle
  const handleToggleFeatured = async (project: ProjectItem) => {
    const nextFeatured = !project.is_featured;

    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, is_featured: nextFeatured } : p))
    );

    try {
      const res = await fetch(`/api/proxy/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: nextFeatured }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update featured status');
      }

      showToast(
        `"${project.title}" is now ${nextFeatured ? 'Featured on Homepage' : 'Standard'}.`
      );
    } catch (err: unknown) {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, is_featured: project.is_featured } : p))
      );
      const msg = err instanceof Error ? err.message : 'Update failed';
      setErrorMessage(msg);
    }
  };

  // Delete project
  const handleDeleteProject = async (project: ProjectItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete case study "${project.title}"? This cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeletingId(project.id);
    try {
      const res = await fetch(`/api/proxy/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete project.');
      }

      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      showToast(`Case study "${project.title}" deleted successfully.`);
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

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.product_used.toLowerCase().includes(q) ||
        (p.client_name && p.client_name.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [projects, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-[#e07b2a]" />
            Projects &amp; Case Studies
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Showcase enterprise installations, thermal engineering milestones, and client deployments.
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
            href="/dashboard/projects/new"
            className="px-4 py-2 bg-gradient-to-r from-[#2d6a35] to-[#24572b] hover:from-[#357c3e] hover:to-[#2d6a35] text-white text-xs font-semibold rounded-lg shadow-md shadow-[#2d6a35]/20 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Case Study</span>
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

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-xl bg-[#0f1412] border border-neutral-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, location, client, or equipment..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-900/90 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35] transition"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <span>Sector:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-neutral-900/90 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#2d6a35] transition"
          >
            <option value="all">All Sectors ({projects.length})</option>
            <option value="hotel">Hotel &amp; Hospitality</option>
            <option value="hospital">Hospital &amp; Healthcare</option>
            <option value="industrial">Industrial Plants</option>
            <option value="pool">Commercial Pools</option>
            <option value="residential">Residential &amp; Villas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#0f1412] border border-neutral-800/80 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#e07b2a]" />
            <span className="text-xs">Loading case studies...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-neutral-600 mx-auto" />
            <div className="text-sm font-medium text-neutral-300">No case studies found</div>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search query or sector filter.'
                : 'Get started by creating your first showcase project.'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Link
                href="/dashboard/projects/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 bg-[#2d6a35] hover:bg-[#357c3e] text-white text-xs font-medium rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Case Study
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Sector</th>
                  <th className="py-3.5 px-4">Equipment Deployed</th>
                  <th className="py-3.5 px-4 text-center">Featured</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-xs text-neutral-300">
                {filteredProjects.map((project) => {
                  const isToggling = togglingId === project.id;
                  const isDeleting = deletingId === project.id;

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-neutral-800/30 transition group"
                    >
                      {/* Project Image & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800/80 overflow-hidden shrink-0 flex items-center justify-center">
                            {project.image_url ? (
                              <img
                                src={project.image_url}
                                alt={project.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Briefcase className="w-5 h-5 text-neutral-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-xs flex items-center gap-1.5">
                              <span>{project.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                              <span className="flex items-center gap-1 text-neutral-400">
                                <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                                {project.location}
                              </span>
                              {project.client_name && (
                                <span className="text-neutral-500 truncate max-w-[140px]">
                                  • {project.client_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-800/80 text-neutral-300 border border-neutral-700/60 capitalize">
                          {CATEGORY_NAMES[project.category] || project.category}
                        </span>
                      </td>

                      {/* Equipment */}
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <div className="text-neutral-200 truncate">{project.product_used}</div>
                          {project.products && (
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                              <span>Linked: {project.products.card_title}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Featured Star Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(project)}
                          title={`Click to ${project.is_featured ? 'unfeature' : 'feature on homepage'}`}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            project.is_featured
                              ? 'text-[#e07b2a] bg-[#e07b2a]/15 border border-[#e07b2a]/30 hover:bg-[#e07b2a]/25'
                              : 'text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800'
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              project.is_featured ? 'fill-[#e07b2a]' : ''
                            }`}
                          />
                        </button>
                      </td>

                      {/* Published Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleTogglePublish(project)}
                          title={`Click to ${project.is_published ? 'unpublish' : 'publish'}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer disabled:opacity-50 ${
                            project.is_published
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/70 hover:bg-emerald-900/60'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : project.is_published ? (
                            <Eye className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-neutral-500" />
                          )}
                          <span>{project.is_published ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                            title="Edit Case Study"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDeleteProject(project)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-950/40 transition disabled:opacity-40"
                            title="Delete Case Study"
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
