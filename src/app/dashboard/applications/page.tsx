'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Upload,
  Image as ImageIcon,
  Building,
  Building2,
  Factory,
  Hotel,
  Activity,
  Home,
  Flame,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

interface ApplicationItem {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  image_url: string | null;
  order_index: number;
}

const COMMON_APP_ICONS: Record<string, React.ReactNode> = {
  hotel: <Hotel className="w-4 h-4" />,
  hospital: <Activity className="w-4 h-4" />,
  building: <Building className="w-4 h-4" />,
  'building-2': <Building2 className="w-4 h-4" />,
  factory: <Factory className="w-4 h-4" />,
  residential: <Home className="w-4 h-4" />,
  flame: <Flame className="w-4 h-4" />,
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon_name: 'hotel',
    image_url: '',
    order_index: 0,
  });
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Delete Modal State
  const [deletingApp, setDeletingApp] = useState<ApplicationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/proxy/applications');
      if (!res.ok) throw new Error('Failed to load applications');
      const data = await res.json();
      setApplications(data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching applications';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.slug.toLowerCase().includes(q) ||
        (app.icon_name && app.icon_name.toLowerCase().includes(q))
      );
    });
  }, [applications, searchQuery]);

  // Handle name input and auto-slug
  const handleNameChange = (val: string) => {
    setFormData((prev) => {
      const next = { ...prev, name: val };
      if (!editingApp) {
        next.slug = val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      return next;
    });
    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
  };

  const openCreateModal = () => {
    setEditingApp(null);
    setOriginalImageUrl('');
    setFormData({
      name: '',
      slug: '',
      icon_name: 'hotel',
      image_url: '',
      order_index: applications.length + 1,
    });
    setFormErrors({});
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (app: ApplicationItem) => {
    setEditingApp(app);
    setOriginalImageUrl(app.image_url || '');
    setFormData({
      name: app.name,
      slug: app.slug,
      icon_name: app.icon_name || 'hotel',
      image_url: app.image_url || '',
      order_index: app.order_index,
    });
    setFormErrors({});
    setUploadError(null);
    setIsModalOpen(true);
  };

  // Image Upload handler for general-assets bucket
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    setUploadError(null);
    setUploadingImage(true);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', 'general-assets');

      const res = await fetch('/api/proxy/upload?bucket=general-assets', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      if (!res.ok || !data.data?.publicUrl) {
        throw new Error(data.error || 'Upload failed');
      }

      setFormData((prev) => ({ ...prev, image_url: data.data.publicUrl }));
      if (formErrors.image_url) setFormErrors((prev) => ({ ...prev, image_url: '' }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setUploadError(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Application name is required';
    }

    const cleanSlug = formData.slug.trim().toLowerCase();
    if (!cleanSlug) {
      errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    } else {
      const exists = applications.some(
        (a) => a.slug.toLowerCase() === cleanSlug && a.id !== editingApp?.id
      );
      if (exists) {
        errors.slug = 'This slug is already in use by another application';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const url = editingApp
        ? `/api/proxy/applications/${editingApp.id}`
        : '/api/proxy/applications';
      const method = editingApp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug: formData.slug.trim().toLowerCase(),
          order_index: Number(formData.order_index) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save application');
      }

      // Storage cleanup if replaced
      if (
        editingApp &&
        originalImageUrl &&
        originalImageUrl !== formData.image_url &&
        originalImageUrl.includes('/storage/v1/object/public/general-assets/')
      ) {
        try {
          const oldFilename = originalImageUrl.split(
            '/storage/v1/object/public/general-assets/'
          )[1];
          if (oldFilename) {
            fetch(`/api/proxy/upload/general-assets/${oldFilename}`, {
              method: 'DELETE',
            }).catch((err) => console.warn('Non-blocking asset cleanup failed:', err));
          }
        } catch (e) {
          // ignore
        }
      }

      showToast(
        editingApp
          ? `Application "${formData.name}" updated successfully`
          : `Application "${formData.name}" created successfully`
      );
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving application';
      setFormErrors((prev) => ({ ...prev, global: msg }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingApp) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/proxy/applications/${deletingApp.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete application');

      showToast(`Application "${deletingApp.name}" deleted successfully`);
      setDeletingApp(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete application';
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-amber-500" />
            Industry Applications & Sectors
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage commercial sectors and deployment use-cases for thermal and storage systems.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Application
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
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <div className="text-xs text-neutral-400 flex items-center gap-2">
          <span>Total Applications:</span>
          <span className="font-semibold text-white bg-neutral-800 px-2 py-0.5 rounded-md">
            {applications.length}
          </span>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            <span className="text-sm">Loading applications...</span>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-16 text-center text-neutral-400">
            <Boxes className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-base font-medium text-neutral-300">No applications found</p>
            <p className="text-xs text-neutral-500 mt-1">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first application above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800/80 bg-neutral-950/40 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
                  <th className="py-3.5 px-4 w-16 text-center">Order</th>
                  <th className="py-3.5 px-4">Application</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Icon</th>
                  <th className="py-3.5 px-4">Illustration Image</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50 text-sm">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="group hover:bg-neutral-800/30 transition-colors">
                    {/* Order Index */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block text-xs font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800">
                        #{app.order_index}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-white group-hover:text-amber-400 transition-colors">
                        {app.name}
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-4 px-4">
                      <code className="text-xs text-neutral-400 bg-neutral-950/80 border border-neutral-800 px-2 py-0.5 rounded font-mono">
                        {app.slug}
                      </code>
                    </td>

                    {/* Icon */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-xs text-neutral-300">
                        <span className="p-1.5 rounded-lg bg-neutral-800/80 border border-neutral-700/50 text-amber-400">
                          {app.icon_name && COMMON_APP_ICONS[app.icon_name] ? (
                            COMMON_APP_ICONS[app.icon_name]
                          ) : (
                            <HelpCircle className="w-4 h-4" />
                          )}
                        </span>
                        <span className="font-mono text-neutral-400">{app.icon_name || 'none'}</span>
                      </div>
                    </td>

                    {/* Image Preview */}
                    <td className="py-4 px-4">
                      {app.image_url ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={app.image_url}
                            alt={app.name}
                            className="w-10 h-10 object-cover rounded-lg border border-neutral-700/50 bg-neutral-950"
                          />
                          <span className="text-xs text-neutral-500 truncate max-w-[140px]">
                            {app.image_url.split('/').pop()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500 italic">No image configured</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(app)}
                          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit Application"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingApp(app)}
                          className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Application"
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
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-500" />
                {editingApp ? 'Edit Application' : 'Create New Application'}
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

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Application / Sector Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Hotels & Hospitality"
                  className={`w-full bg-neutral-950 border ${
                    formErrors.name ? 'border-red-500' : 'border-neutral-800'
                  } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors`}
                />
                {formErrors.name && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  URL Slug <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, slug: e.target.value }));
                    if (formErrors.slug) setFormErrors((prev) => ({ ...prev, slug: '' }));
                  }}
                  placeholder="e.g. hotels-hospitality"
                  className={`w-full bg-neutral-950 font-mono text-sm border ${
                    formErrors.slug ? 'border-red-500' : 'border-neutral-800'
                  } rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors`}
                />
                {formErrors.slug && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.slug}</p>
                )}
              </div>

              {/* Image Upload to general-assets */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Application Image (Bucket: general-assets)
                </label>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 text-xs font-medium text-neutral-300 hover:text-white transition-colors">
                      <Upload className="w-4 h-4 text-amber-500" />
                      <span>{uploadingImage ? 'Uploading...' : 'Choose Image'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    {formData.image_url && (
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, image_url: '' }))}
                        className="text-xs text-neutral-400 hover:text-red-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {uploadError && (
                    <p className="text-red-400 text-xs">{uploadError}</p>
                  )}

                  {formData.image_url && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Icon & Order Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Icon Name
                  </label>
                  <select
                    value={formData.icon_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, icon_name: e.target.value }))
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="hotel">hotel (Hotels & Resorts)</option>
                    <option value="hospital">hospital (Healthcare & Hospitals)</option>
                    <option value="factory">factory (Heavy Industrial)</option>
                    <option value="building">building (Commercial Buildings)</option>
                    <option value="building-2">building-2 (Offices & Campuses)</option>
                    <option value="residential">residential (Villas & Apartments)</option>
                    <option value="flame">flame (Thermal & Boilers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Order Index
                  </label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        order_index: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
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
                  disabled={saving || uploadingImage}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingApp ? 'Save Changes' : 'Create Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Application</h3>
            </div>

            <p className="text-sm text-neutral-300">
              Are you sure you want to delete the application sector{' '}
              <strong className="text-white">&quot;{deletingApp.name}&quot;</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setDeletingApp(null)}
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
