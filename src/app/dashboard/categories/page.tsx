'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Package,
  Layers,
  Zap,
  Wind,
  Droplets,
  Settings as SettingsIcon,
  Shield,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  order_index: number;
}

interface ProductRef {
  id: string;
  category_id: string | null;
  card_title: string;
}

const COMMON_ICONS: Record<string, React.ReactNode> = {
  droplets: <Droplets className="w-4 h-4" />,
  'layout-grid': <Layers className="w-4 h-4" />,
  wind: <Wind className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
  layers: <Layers className="w-4 h-4" />,
  settings: <SettingsIcon className="w-4 h-4" />,
  shield: <Shield className="w-4 h-4" />,
  package: <Package className="w-4 h-4" />,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon_name: 'droplets',
    order_index: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Categories and Products (to compute linked product counts)
  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/proxy/categories'),
        fetch('/api/proxy/products?include_drafts=true'),
      ]);

      if (!catRes.ok) throw new Error('Failed to load categories');
      const catData = await catRes.json();
      setCategories(catData.data || []);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching data';
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

  // Compute products count per category
  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      if (p.category_id) {
        map[p.category_id] = (map[p.category_id] || 0) + 1;
      }
    }
    return map;
  }, [products]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [categories, searchQuery]);

  // Auto-generate slug from name if new
  const handleNameChange = (val: string) => {
    setFormData((prev) => {
      const next = { ...prev, name: val };
      if (!editingCategory) {
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
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon_name: 'droplets',
      order_index: categories.length + 1,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon_name: cat.icon_name || 'droplets',
      order_index: cat.order_index,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    }

    const cleanSlug = formData.slug.trim().toLowerCase();
    if (!cleanSlug) {
      errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    } else {
      // Check slug uniqueness excluding self
      const exists = categories.some(
        (c) => c.slug.toLowerCase() === cleanSlug && c.id !== editingCategory?.id
      );
      if (exists) {
        errors.slug = 'This slug is already in use by another category';
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
      const url = editingCategory
        ? `/api/proxy/categories/${editingCategory.id}`
        : '/api/proxy/categories';
      const method = editingCategory ? 'PUT' : 'POST';

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
        throw new Error(data.error || 'Failed to save category');
      }

      showToast(
        editingCategory
          ? `Category "${formData.name}" updated successfully`
          : `Category "${formData.name}" created successfully`
      );
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving category';
      setFormErrors((prev) => ({ ...prev, global: msg }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/proxy/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');

      showToast(`Category "${deletingCategory.name}" removed successfully`);
      setDeletingCategory(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category';
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
            <FolderTree className="w-6 h-6 text-amber-500" />
            Product Categories
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage equipment classification hierarchy and storefront filter taxonomies.
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
            Add Category
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
            placeholder="Search categories by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <div className="text-xs text-neutral-400 flex items-center gap-2">
          <span>Total Categories:</span>
          <span className="font-semibold text-white bg-neutral-800 px-2 py-0.5 rounded-md">
            {categories.length}
          </span>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            <span className="text-sm">Loading categories...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-16 text-center text-neutral-400">
            <FolderTree className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-base font-medium text-neutral-300">No categories found</p>
            <p className="text-xs text-neutral-500 mt-1">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first category above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800/80 bg-neutral-950/40 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
                  <th className="py-3.5 px-4 w-16 text-center">Order</th>
                  <th className="py-3.5 px-4">Category Name</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Icon</th>
                  <th className="py-3.5 px-4 text-center">Assigned Products</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50 text-sm">
                {filteredCategories.map((cat) => {
                  const assignedCount = productCountMap[cat.id] || 0;
                  return (
                    <tr
                      key={cat.id}
                      className="group hover:bg-neutral-800/30 transition-colors"
                    >
                      {/* Order Index */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block text-xs font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800">
                          #{cat.order_index}
                        </span>
                      </td>

                      {/* Name & Description */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-white group-hover:text-amber-400 transition-colors">
                          {cat.name}
                        </div>
                        {cat.description && (
                          <div className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                            {cat.description}
                          </div>
                        )}
                      </td>

                      {/* Slug */}
                      <td className="py-4 px-4">
                        <code className="text-xs text-neutral-400 bg-neutral-950/80 border border-neutral-800 px-2 py-0.5 rounded font-mono">
                          {cat.slug}
                        </code>
                      </td>

                      {/* Icon */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-xs text-neutral-300">
                          <span className="p-1.5 rounded-lg bg-neutral-800/80 border border-neutral-700/50 text-amber-400">
                            {cat.icon_name && COMMON_ICONS[cat.icon_name] ? (
                              COMMON_ICONS[cat.icon_name]
                            ) : (
                              <HelpCircle className="w-4 h-4" />
                            )}
                          </span>
                          <span className="font-mono text-neutral-400">{cat.icon_name || 'none'}</span>
                        </div>
                      </td>

                      {/* Assigned Products Count */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            assignedCount > 0
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-neutral-800/60 text-neutral-400 border border-neutral-700/40'
                          }`}
                        >
                          <Package className="w-3 h-3" />
                          {assignedCount} {assignedCount === 1 ? 'product' : 'products'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Edit Category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingCategory(cat)}
                            className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-amber-500" />
                {editingCategory ? 'Edit Category' : 'Create New Category'}
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
                  Category Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Hot Water Storage Tanks"
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
                  placeholder="e.g. hot-water-tanks"
                  className={`w-full bg-neutral-950 font-mono text-sm border ${
                    formErrors.slug ? 'border-red-500' : 'border-neutral-800'
                  } rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors`}
                />
                {formErrors.slug && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.slug}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Brief summary of this equipment line..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              {/* Icon & Order Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Icon Keyword
                  </label>
                  <select
                    value={formData.icon_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, icon_name: e.target.value }))
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="droplets">droplets (Tanks & Fluid)</option>
                    <option value="layout-grid">layout-grid (Modular Panel)</option>
                    <option value="wind">wind (Exchangers / Flow)</option>
                    <option value="zap">zap (Heating Elements)</option>
                    <option value="layers">layers (Insulation)</option>
                    <option value="settings">settings (Accessories)</option>
                    <option value="shield">shield (Protective Armor)</option>
                    <option value="package">package (Pre-built)</option>
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
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Category</h3>
            </div>

            {/* Check if products are linked */}
            {productCountMap[deletingCategory.id] > 0 ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                  <span className="font-bold text-amber-400 block mb-1">
                    Warning: Cannot Delete Assigned Category
                  </span>
                  There are currently{' '}
                  <strong className="text-white underline">
                    {productCountMap[deletingCategory.id]} product(s)
                  </strong>{' '}
                  assigned to &quot;{deletingCategory.name}&quot;. To prevent orphaned
                  catalogue items, please reassign or delete these products before removing
                  this category.
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setDeletingCategory(null)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300">
                  Are you sure you want to permanently delete the category{' '}
                  <strong className="text-white">&quot;{deletingCategory.name}&quot;</strong>?
                  This action cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    onClick={() => setDeletingCategory(null)}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
