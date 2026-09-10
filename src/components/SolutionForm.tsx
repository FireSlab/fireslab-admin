'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  Flame,
  Layers,
  Package,
} from 'lucide-react';
import TipTapEditor from './TipTapEditor';

export interface SolutionFormData {
  id?: string;
  category_tag: string;
  title_line1: string;
  title_line2: string;
  description: string;
  image_url: string;
  features: string[];
  linked_product_id?: string | null;
  is_published: boolean;
  order_index: number;
}

interface ProductOption {
  id: string;
  card_title: string;
  slug: string;
}

interface SolutionFormProps {
  initialData?: SolutionFormData;
  isEdit?: boolean;
}

export default function SolutionForm({ initialData, isEdit = false }: SolutionFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<SolutionFormData>({
    category_tag: initialData?.category_tag || '',
    title_line1: initialData?.title_line1 || '',
    title_line2: initialData?.title_line2 || '',
    description: initialData?.description || '',
    image_url: initialData?.image_url || '',
    features: initialData?.features || [
      'High thermal retention insulation jacket',
      'Engineered for maximum recovery efficiency',
    ],
    linked_product_id: initialData?.linked_product_id || '',
    is_published: initialData?.is_published ?? true,
    order_index: initialData?.order_index || 0,
  });

  const [originalImageUrl] = useState<string>(initialData?.image_url || '');
  const [productsList, setProductsList] = useState<ProductOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available products for optional linking
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/proxy/products?include_drafts=true');
        if (res.ok) {
          const data = await res.json();
          setProductsList(
            (data.data || []).map((p: any) => ({
              id: p.id,
              card_title: p.card_title,
              slug: p.slug,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load products for solution linking:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadProducts();
  }, []);

  // Image Upload
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
      form.append('bucket', 'solution-images');

      const res = await fetch('/api/proxy/upload?bucket=solution-images', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (!res.ok || !data.data?.publicUrl) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      setFormData((prev) => ({
        ...prev,
        image_url: data.data.publicUrl,
      }));

      if (errors.image_url) {
        setErrors((prev) => ({ ...prev, image_url: '' }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setUploadError(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  // Features List helpers
  const handleAddFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const handleUpdateFeature = (index: number, val: string) => {
    setFormData((prev) => {
      const list = [...prev.features];
      list[index] = val;
      return { ...prev, features: list };
    });
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Client Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.category_tag.trim()) {
      errs.category_tag = 'Category tag is required.';
    }
    if (!formData.title_line1.trim()) {
      errs.title_line1 = 'Title line 1 is required.';
    }
    if (!formData.title_line2.trim()) {
      errs.title_line2 = 'Title line 2 is required.';
    }
    if (!formData.description.trim() || formData.description === '<p></p>') {
      errs.description = 'Solution description cannot be empty.';
    }
    if (!formData.image_url.trim()) {
      errs.image_url = 'Solution illustration image is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) {
      setGlobalError('Please review and correct the errors highlighted below.');
      return;
    }

    setSubmitting(true);

    try {
      const cleanPayload = {
        ...formData,
        features: formData.features.filter((f) => f.trim()),
        linked_product_id: formData.linked_product_id ? formData.linked_product_id : null,
      };

      const url = isEdit
        ? `/api/proxy/solutions/${initialData?.id}`
        : '/api/proxy/solutions';

      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save solution.');
      }

      // Storage cleanup for replaced image:
      // If editing and image replaced, delete old image in background
      // Non-blocking: failure logged without preventing save
      if (
        isEdit &&
        originalImageUrl &&
        originalImageUrl !== formData.image_url &&
        originalImageUrl.includes('/storage/v1/object/public/solution-images/')
      ) {
        try {
          const oldFilename = originalImageUrl.split('/storage/v1/object/public/solution-images/')[1];
          if (oldFilename) {
            console.log('Purging replaced solution image from storage:', oldFilename);
            fetch(`/api/proxy/upload/solution-images/${oldFilename}`, {
              method: 'DELETE',
            }).catch((cleanupErr) => {
              console.warn('Storage cleanup failed (non-blocking):', cleanupErr);
            });
          }
        } catch (cleanupErr) {
          console.warn('Storage cleanup parse failed (non-blocking):', cleanupErr);
        }
      }

      router.push('/dashboard/solutions');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save solution';
      setGlobalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#2d6a35]" />
        <span className="text-sm">Loading solution configuration...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isEdit
                ? `Edit: ${formData.title_line1} ${formData.title_line2}`
                : 'New Engineering Solution'}
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isEdit
                ? 'Update solution architecture, bullet features, and linked product.'
                : 'Configure high-impact thermal engineering solutions for the frontend solutions section.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/solutions')}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900/60 border border-neutral-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-gradient-to-r from-[#2d6a35] to-[#24572b] hover:from-[#357c3e] hover:to-[#2d6a35] text-white text-xs font-semibold rounded-lg shadow-md shadow-[#2d6a35]/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Solution...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Create Solution'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      {/* 1. Solution Branding & Titles */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-800/60">
          <Flame className="w-4 h-4 text-[#e07b2a]" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Solution Identity &amp; Two-Line Title
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category Tag */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Category Tag <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.category_tag}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, category_tag: e.target.value }));
                if (errors.category_tag) setErrors((prev) => ({ ...prev, category_tag: '' }));
              }}
              placeholder="e.g. Hot Water Storage, Modular Storage"
              className={`w-full px-3.5 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none transition ${
                errors.category_tag
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-neutral-800 focus:border-[#2d6a35]'
              }`}
            />
            {errors.category_tag && (
              <p className="text-xs text-red-400 mt-1.5">{errors.category_tag}</p>
            )}
          </div>

          {/* Title Line 1 */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Title Line 1 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title_line1}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title_line1: e.target.value }));
                if (errors.title_line1) setErrors((prev) => ({ ...prev, title_line1: '' }));
              }}
              placeholder="e.g. PRESSURIZED"
              className={`w-full px-3.5 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white uppercase placeholder-neutral-500 focus:outline-none transition ${
                errors.title_line1
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-neutral-800 focus:border-[#2d6a35]'
              }`}
            />
            {errors.title_line1 && (
              <p className="text-xs text-red-400 mt-1.5">{errors.title_line1}</p>
            )}
          </div>

          {/* Title Line 2 */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Title Line 2 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title_line2}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title_line2: e.target.value }));
                if (errors.title_line2) setErrors((prev) => ({ ...prev, title_line2: '' }));
              }}
              placeholder="e.g. TANK SYSTEMS"
              className={`w-full px-3.5 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white uppercase placeholder-neutral-500 focus:outline-none transition ${
                errors.title_line2
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-neutral-800 focus:border-[#2d6a35]'
              }`}
            />
            {errors.title_line2 && (
              <p className="text-xs text-red-400 mt-1.5">{errors.title_line2}</p>
            )}
          </div>
        </div>

        {/* Linked Catalogue Product */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
            Link to Catalogue Equipment (Optional)
          </label>
          <div className="relative">
            <select
              value={formData.linked_product_id || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, linked_product_id: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#2d6a35] transition"
            >
              <option value="">No linked catalogue product (Custom Engineering)</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.card_title} (/{p.slug})
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1.5">
            Links the frontend solution card directly to the primary equipment specification page.
          </p>
        </div>
      </div>

      {/* 2. Media & Image Upload */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-800/60">
          <Package className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Solution Media &amp; Illustration
          </h2>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
            Solution Illustration Image <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-2 border-2 border-dashed border-neutral-800 hover:border-[#2d6a35] rounded-xl p-6 bg-neutral-900/40 text-center transition flex flex-col items-center justify-center">
              <input
                type="file"
                id="solution_image_input"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
              <label
                htmlFor="solution_image_input"
                className="cursor-pointer flex flex-col items-center gap-2 text-neutral-400 hover:text-white transition"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-[#2d6a35]" />
                    <span className="text-xs text-neutral-300">
                      Uploading to Supabase Storage (solution-images)...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-white">
                      Click to upload solution artwork
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Supports JPG, PNG, WebP (Max 5MB)
                    </span>
                  </>
                )}
              </label>
            </div>

            {/* Preview */}
            <div className="border border-neutral-800 rounded-xl p-3 bg-neutral-900/60 min-h-[140px] flex flex-col items-center justify-center text-center">
              {formData.image_url ? (
                <div className="space-y-2 w-full">
                  <div className="w-full h-24 rounded-lg bg-black/40 overflow-hidden flex items-center justify-center border border-neutral-800">
                    <img
                      src={formData.image_url}
                      alt="Solution artwork"
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 px-1">
                    <span className="flex items-center gap-1 truncate max-w-[140px]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Uploaded
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-neutral-600 flex flex-col items-center gap-1.5">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">No image chosen</span>
                </div>
              )}
            </div>
          </div>
          {uploadError && <p className="text-xs text-red-400 mt-2">{uploadError}</p>}
          {errors.image_url && <p className="text-xs text-red-400 mt-2">{errors.image_url}</p>}
        </div>
      </div>

      {/* 3. Description (TipTap WYSIWYG) */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
            Solution Description (TipTap Rich Text WYSIWYG) <span className="text-red-400">*</span>
          </label>
          <TipTapEditor
            value={formData.description}
            onChange={(cleanHtml) => {
              setFormData((prev) => ({ ...prev, description: cleanHtml }));
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: '' }));
              }
            }}
          />
          {errors.description && (
            <p className="text-xs text-red-400 mt-1.5">{errors.description}</p>
          )}
        </div>
      </div>

      {/* 4. Features Bullet Points Builder */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/60">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Solution Features (Key Highlights)
            </h2>
          </div>
          <button
            type="button"
            onClick={handleAddFeature}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Feature
          </button>
        </div>

        <div className="space-y-2">
          {formData.features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                value={feat}
                onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                placeholder="e.g. Duplex stainless steel inner vessel for superior corrosion resistance"
                className="flex-1 px-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
              />
              <button
                type="button"
                onClick={() => handleRemoveFeature(idx)}
                className="p-2 text-neutral-500 hover:text-red-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Publishing Status & Order */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Publishing Status</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Drafts are hidden from public website and only visible inside this CMS.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, is_published: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d6a35]"></div>
            <span className="ml-3 text-xs font-semibold text-neutral-300">
              {formData.is_published ? (
                <span className="text-emerald-400">Published</span>
              ) : (
                <span className="text-neutral-500">Draft</span>
              )}
            </span>
          </label>
        </div>

        <div className="pt-4 border-t border-neutral-800/60 flex items-center justify-between">
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider">
              Sort Display Order
            </label>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Ascending sort order (0 appears first).
            </p>
          </div>
          <input
            type="number"
            value={formData.order_index}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))
            }
            className="w-24 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white text-right focus:outline-none focus:border-[#2d6a35]"
          />
        </div>
      </div>
    </form>
  );
}
