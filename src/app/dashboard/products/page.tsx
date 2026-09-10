'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ProductItem {
  id: string;
  slug: string;
  card_title: string;
  card_badge: string | null;
  card_description: string;
  card_image_url: string;
  card_specs: { label: string; value: string }[];
  is_published: boolean;
  order_index: number;
  created_at: string;
  categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsListPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch products & categories
  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/proxy/products?include_drafts=true'),
        fetch('/api/proxy/categories'),
      ]);

      if (!prodRes.ok) {
        throw new Error('Failed to load products.');
      }

      const prodData = await prodRes.json();
      setProducts(prodData.data || []);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading products.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick inline published/draft toggle calling PUT /api/proxy/products/:id directly
  const handleTogglePublish = async (product: ProductItem) => {
    const nextStatus = !product.is_published;
    setTogglingId(product.id);

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_published: nextStatus } : p))
    );

    try {
      const res = await fetch(`/api/proxy/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: nextStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update publishing status');
      }

      showToast(
        `Product "${product.card_title}" is now ${nextStatus ? 'Published' : 'Draft'}.`
      );
    } catch (err: unknown) {
      // Revert optimistic update on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_published: product.is_published } : p))
      );
      const msg = err instanceof Error ? err.message : 'Update failed';
      setErrorMessage(msg);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete product
  const handleDeleteProduct = async (product: ProductItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${product.card_title}"? This cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeletingId(product.id);
    try {
      const res = await fetch(`/api/proxy/products/${product.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete product.');
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`Product "${product.card_title}" deleted successfully.`);
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

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.card_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.card_description && p.card_description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' ||
        (p.categories && p.categories.id === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-5 h-5 text-emerald-400" />
            Products Catalogue
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage hot water buffer vessels, plate &amp; shell heat exchangers, and storage solutions.
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
            href="/dashboard/products/new"
            className="px-4 py-2 bg-gradient-to-r from-[#2d6a35] to-[#24572b] hover:from-[#357c3e] hover:to-[#2d6a35] text-white text-xs font-semibold rounded-lg shadow-md shadow-[#2d6a35]/20 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center gap-2.5 text-emerald-300 text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
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
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, slug or description..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-900/90 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35] transition"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-neutral-900/90 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#2d6a35] transition"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categories?.id === cat.id).length;
              return (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl bg-[#0f1412] border border-neutral-800/80 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#2d6a35]" />
            <span className="text-xs">Loading products catalogue...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Package className="w-10 h-10 text-neutral-600 mx-auto" />
            <div className="text-sm font-medium text-neutral-300">No products found</div>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or category filter.'
                : 'Get started by creating your first industrial heating product.'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 bg-[#2d6a35] hover:bg-[#357c3e] text-white text-xs font-medium rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Quick Specs</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-xs text-neutral-300">
                {filteredProducts.map((product) => {
                  const isToggling = togglingId === product.id;
                  const isDeleting = deletingId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-neutral-800/30 transition group"
                    >
                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800/80 overflow-hidden shrink-0 flex items-center justify-center">
                            {product.card_image_url ? (
                              <img
                                src={product.card_image_url}
                                alt={product.card_title}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-neutral-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-xs flex items-center gap-2">
                              <span>{product.card_title}</span>
                              {product.card_badge && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#e07b2a]/20 text-[#e07b2a] border border-[#e07b2a]/30 shrink-0">
                                  {product.card_badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono mt-0.5 truncate max-w-xs">
                              /{product.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        {product.categories?.name ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-800/80 text-neutral-300 border border-neutral-700/60">
                            {product.categories.name}
                          </span>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">Uncategorized</span>
                        )}
                      </td>

                      {/* Quick Specs summary */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {product.card_specs && product.card_specs.length > 0 ? (
                            product.card_specs.slice(0, 2).map((spec, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-400 border border-neutral-800"
                              >
                                <span className="text-neutral-500">{spec.label}:</span>{' '}
                                {spec.value}
                              </span>
                            ))
                          ) : (
                            <span className="text-neutral-600 text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Status & Inline Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleTogglePublish(product)}
                          title={`Click to ${product.is_published ? 'unpublish' : 'publish'}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer disabled:opacity-50 ${
                            product.is_published
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/70 hover:bg-emerald-900/60'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : product.is_published ? (
                            <Eye className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-neutral-500" />
                          )}
                          <span>{product.is_published ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/products/${product.id}`}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDeleteProduct(product)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-950/40 transition disabled:opacity-40"
                            title="Delete Product"
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
