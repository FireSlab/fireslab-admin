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
  Layers,
  HelpCircle,
  FileText,
  Sliders,
} from 'lucide-react';
import TipTapEditor from './TipTapEditor';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface KeyValueSpec {
  label: string;
  param?: string;
  value: string;
}

export interface FeatureItem {
  title: string;
  desc: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface ProductFormData {
  id?: string;
  category_id: string;
  card_title: string;
  slug: string;
  card_badge: string;
  card_description: string;
  card_image_url: string;
  gallery_images: string[];
  card_specs: KeyValueSpec[];
  modal_title: string;
  modal_tagline: string;
  modal_description: string;
  features: FeatureItem[];
  materials: string[];
  capacities: string[];
  technical_specs: KeyValueSpec[];
  applications: string[];
  faqs: FAQItem[];
  cta_text: string;
  is_published: boolean;
  order_index: number;
}

interface ProductFormProps {
  initialData?: any;
  isEdit?: boolean;
}

// Helper normalizers to prevent [object Object] rendering
function normalizeStringArray(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      return item.name || item.title || item.label || item.value || item.desc || '';
    }
    return String(item || '');
  }).filter(Boolean);
}

function normalizeFeatures(arr: any): FeatureItem[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (typeof item === 'string') {
      return { title: item, desc: '' };
    }
    if (item && typeof item === 'object') {
      return {
        title: item.title || item.name || item.label || item.heading || '',
        desc: item.desc || item.description || item.detail || '',
      };
    }
    return { title: '', desc: '' };
  }).filter((f) => f.title.trim() || f.desc.trim());
}

function normalizeSpecs(arr: any): KeyValueSpec[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (typeof item === 'string') {
      return { label: item, param: item, value: '' };
    }
    if (item && typeof item === 'object') {
      const lbl = item.param || item.parameter || item.label || item.key || item.name || '';
      const val = item.value || item.spec || item.val || '';
      return { label: lbl, param: lbl, value: String(val || '') };
    }
    return { label: '', param: '', value: '' };
  });
}

function normalizeFaqs(arr: any): FAQItem[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (item && typeof item === 'object') {
      return {
        q: item.q || item.question || '',
        a: item.a || item.answer || '',
      };
    }
    return { q: '', a: '' };
  }).filter((f) => f.q.trim() || f.a.trim());
}

export default function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState<ProductFormData>({
    category_id: initialData?.category_id || '',
    card_title: initialData?.card_title || '',
    slug: initialData?.slug || '',
    card_badge: initialData?.card_badge || '',
    card_description: initialData?.card_description || '',
    card_image_url: initialData?.card_image_url || '',
    gallery_images: normalizeStringArray(initialData?.gallery_images),
    card_specs: initialData?.card_specs ? normalizeSpecs(initialData.card_specs) : [
      { label: 'Capacity', param: 'Capacity', value: '500L – 10,000L' },
      { label: 'Material', param: 'Material', value: 'Duplex 2205 / SS316L' },
    ],
    modal_title: initialData?.modal_title || '',
    modal_tagline: initialData?.modal_tagline || '',
    modal_description: initialData?.modal_description || '',
    features: initialData?.features ? normalizeFeatures(initialData.features) : [
      { title: 'High Thermal Retention', desc: 'Polyurethane insulation jacket with low standby heat loss.' },
      { title: 'Dual Immersion Heating', desc: 'Backup immersion ports engineered for peak demand cycles.' },
    ],
    materials: initialData?.materials ? normalizeStringArray(initialData.materials) : ['Duplex Stainless Steel 2205', 'AISI 316L'],
    capacities: initialData?.capacities ? normalizeStringArray(initialData.capacities) : ['500L', '1,000L', '2,500L', '5,000L', '10,000L'],
    technical_specs: initialData?.technical_specs ? normalizeSpecs(initialData.technical_specs) : [
      { label: 'Operating Pressure', param: 'Operating Pressure', value: 'Up to 10 Bar (1.0 MPa)' },
      { label: 'Test Pressure', param: 'Test Pressure', value: '15 Bar (1.5 MPa)' },
    ],
    applications: initialData?.applications ? normalizeStringArray(initialData.applications) : [
      'Hotels, Resorts & Luxury Hospitality',
      'Hospitals & Healthcare Facilities',
      'Industrial Process Heating & Washdown',
    ],
    faqs: initialData?.faqs ? normalizeFaqs(initialData.faqs) : [
      {
        q: 'What is the standard warranty period?',
        a: 'FireSlab provides a comprehensive 5-year structural warranty on all industrial vessels.',
      },
    ],
    cta_text: initialData?.cta_text || 'Request Engineering Datasheet',
    is_published: initialData?.is_published ?? true,
    order_index: initialData?.order_index || 0,
  });

  const [originalImageUrl] = useState<string>(initialData?.card_image_url || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<{ id: string; slug: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  // Fetch categories and existing products for slug collision check
  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/proxy/categories'),
          fetch('/api/proxy/products?include_drafts=true'),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          const list = catData.data || [];
          setCategories(list);
          if (!formData.category_id && list.length > 0 && !isEdit) {
            setFormData((prev) => ({ ...prev, category_id: list[0].id }));
          }
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setAllProducts((prodData.data || []).map((p: any) => ({ id: p.id, slug: p.slug })));
        }
      } catch (err) {
        console.error('Failed to load initial form metadata:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [isEdit]);

  // Slug generator helper
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Title change with auto-slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, card_title: val };
      if (!isEdit && !prev.modal_title) {
        updated.modal_title = val;
      }
      if (autoSlug) {
        updated.slug = slugify(val);
      }
      return updated;
    });

    if (errors.card_title) {
      setErrors((prev) => ({ ...prev, card_title: '' }));
    }
  };

  // Slug change & validation
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSlug(false);
    const newSlug = slugify(e.target.value);
    setFormData((prev) => ({ ...prev, slug: newSlug }));
    validateSlug(newSlug);
  };

  const validateSlug = (slugToTest: string): boolean => {
    if (!slugToTest) {
      setErrors((prev) => ({ ...prev, slug: 'Slug cannot be empty.' }));
      return false;
    }

    // Slug check in edit mode: exclude current product record
    const collision = allProducts.find(
      (p) => p.slug === slugToTest && (isEdit ? p.id !== initialData?.id : true)
    );

    if (collision) {
      setErrors((prev) => ({
        ...prev,
        slug: 'This slug is already taken by another product.',
      }));
      return false;
    }

    setErrors((prev) => ({ ...prev, slug: '' }));
    return true;
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    setUploadError(null);
    setUploadingImage(true);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', 'product-images');

      const res = await fetch('/api/proxy/upload?bucket=product-images', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (!res.ok || !data.data?.publicUrl) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      setFormData((prev) => ({
        ...prev,
        card_image_url: data.data.publicUrl,
      }));

      if (errors.card_image_url) {
        setErrors((prev) => ({ ...prev, card_image_url: '' }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setUploadError(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  // Multi-Image Gallery Handlers
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    setUploadError(null);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setUploadError('Only JPEG, PNG, and WebP images are allowed.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Images must be smaller than 5MB.');
        continue;
      }

      try {
        const form = new FormData();
        form.append('file', file);
        form.append('bucket', 'product-images');

        const res = await fetch('/api/proxy/upload?bucket=product-images', {
          method: 'POST',
          body: form,
        });

        const data = await res.json();
        if (res.ok && data.data?.publicUrl) {
          uploadedUrls.push(data.data.publicUrl);
        }
      } catch (err) {
        console.error('Gallery image upload failed for', file.name, err);
      }
    }

    if (uploadedUrls.length > 0) {
      setFormData((prev) => ({
        ...prev,
        gallery_images: [...prev.gallery_images, ...uploadedUrls],
      }));
    }
    setUploadingGallery(false);
    e.target.value = '';
  };

  const handleAddGalleryUrl = () => {
    const url = galleryUrlInput.trim();
    if (!url) return;
    setFormData((prev) => ({
      ...prev,
      gallery_images: [...prev.gallery_images, url],
    }));
    setGalleryUrlInput('');
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  // Structured Array Helpers
  const handleAddStringItem = (field: 'materials' | 'capacities' | 'applications') => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const handleUpdateStringItem = (
    field: 'materials' | 'capacities' | 'applications',
    index: number,
    value: string
  ) => {
    setFormData((prev) => {
      const list = [...prev[field]];
      list[index] = value;
      return { ...prev, [field]: list };
    });
  };

  const handleRemoveStringItem = (
    field: 'materials' | 'capacities' | 'applications',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // Feature Helpers ({ title, desc })
  const handleAddFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, { title: '', desc: '' }],
    }));
  };

  const handleUpdateFeature = (index: number, key: 'title' | 'desc', val: string) => {
    setFormData((prev) => {
      const list = [...prev.features];
      list[index] = { ...list[index], [key]: val };
      return { ...prev, features: list };
    });
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Key-Value Helpers (card_specs, technical_specs)
  const handleAddKvSpec = (field: 'card_specs' | 'technical_specs') => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], { label: '', param: '', value: '' }],
    }));
  };

  const handleUpdateKvSpec = (
    field: 'card_specs' | 'technical_specs',
    index: number,
    key: 'label' | 'value',
    val: string
  ) => {
    setFormData((prev) => {
      const list = [...prev[field]];
      const updated = { ...list[index], [key]: val };
      if (key === 'label') {
        updated.param = val;
      }
      list[index] = updated;
      return { ...prev, [field]: list };
    });
  };

  const handleRemoveKvSpec = (field: 'card_specs' | 'technical_specs', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // FAQ Helpers
  const handleAddFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { q: '', a: '' }],
    }));
  };

  const handleUpdateFaq = (index: number, key: 'q' | 'a', val: string) => {
    setFormData((prev) => {
      const list = [...prev.faqs];
      list[index] = { ...list[index], [key]: val };
      return { ...prev, faqs: list };
    });
  };

  const handleRemoveFaq = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  // Client-side Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.card_title.trim()) {
      errs.card_title = 'Card title is required.';
    }
    if (!formData.slug.trim()) {
      errs.slug = 'Slug is required.';
    } else if (!validateSlug(formData.slug)) {
      errs.slug = 'This slug is already taken by another product.';
    }
    if (!formData.card_description.trim()) {
      errs.card_description = 'Card summary description is required.';
    }
    if (!formData.card_image_url.trim()) {
      errs.card_image_url = 'Product card image is required.';
    }
    if (!formData.modal_title.trim()) {
      errs.modal_title = 'Modal title is required.';
    }
    if (!formData.modal_description.trim() || formData.modal_description === '<p></p>') {
      errs.modal_description = 'Detailed product description cannot be empty.';
    }
    if (!formData.category_id) {
      errs.category_id = 'Please assign a category.';
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
      // Clean empty specs and normalize payload
      const cleanPayload = {
        ...formData,
        card_specs: formData.card_specs
          .map((s) => ({
            label: (s.label || s.param || '').trim(),
            param: (s.param || s.label || '').trim(),
            value: s.value.trim(),
          }))
          .filter((s) => s.label && s.value),
        features: formData.features
          .map((f) => ({ title: f.title.trim(), desc: f.desc.trim() }))
          .filter((f) => f.title || f.desc),
        gallery_images: formData.gallery_images.map((g) => g.trim()).filter(Boolean),
        materials: formData.materials.map((m) => m.trim()).filter(Boolean),
        capacities: formData.capacities.map((c) => c.trim()).filter(Boolean),
        applications: formData.applications.map((a) => a.trim()).filter(Boolean),
        technical_specs: formData.technical_specs
          .map((s) => ({
            param: (s.param || s.label || '').trim(),
            label: (s.label || s.param || '').trim(),
            value: s.value.trim(),
          }))
          .filter((s) => (s.param || s.label) && s.value),
        faqs: formData.faqs.filter((faq) => faq.q.trim() && faq.a.trim()),
      };

      const url = isEdit
        ? `/api/proxy/products/${initialData?.id}`
        : '/api/proxy/products';

      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save product.');
      }

      // Storage cleanup for replaced image:
      // If editing and image changed, attempt old image deletion in background
      // If it fails, log and continue (do not block user success)
      if (
        isEdit &&
        originalImageUrl &&
        originalImageUrl !== formData.card_image_url &&
        originalImageUrl.includes('/storage/v1/object/public/product-images/')
      ) {
        try {
          const oldFilename = originalImageUrl.split('/storage/v1/object/public/product-images/')[1];
          if (oldFilename) {
            console.log('Purging replaced image from storage:', oldFilename);
            fetch(`/api/proxy/upload/product-images/${oldFilename}`, {
              method: 'DELETE',
            }).catch((cleanupErr) => {
              console.warn('Storage cleanup failed (non-blocking):', cleanupErr);
            });
          }
        } catch (cleanupErr) {
          console.warn('Storage cleanup parse failed (non-blocking):', cleanupErr);
        }
      }

      router.push('/dashboard/products');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      setGlobalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#2d6a35]" />
        <span className="text-sm">Loading product configuration...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl pb-16">
      {/* Top action header */}
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
              {isEdit ? `Edit: ${formData.card_title || 'Product'}` : 'New Equipment Product'}
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isEdit
                ? 'Modify catalogue specifications, media, and modal content.'
                : 'Publish high-performance heating equipment to the live catalogue.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/products')}
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
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Create Product'}</span>
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

      {/* 1. Core Card Meta */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-800/60">
          <Sliders className="w-4 h-4 text-[#e07b2a]" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Product Identity &amp; Card Meta
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Card Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.card_title}
              onChange={handleTitleChange}
              placeholder="e.g. Pressurized Hot Water Buffer Vessel"
              className={`w-full px-3.5 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none transition ${
                errors.card_title
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-neutral-800 focus:border-[#2d6a35]'
              }`}
            />
            {errors.card_title && (
              <p className="text-xs text-red-400 mt-1.5">{errors.card_title}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
                Slug <span className="text-red-400">*</span>
              </label>
              {autoSlug && (
                <span className="text-[10px] text-emerald-400 font-mono">auto-generating</span>
              )}
            </div>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={handleSlugChange}
              placeholder="pressurized-hot-water-buffer-vessel"
              className={`w-full px-3.5 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white font-mono placeholder-neutral-500 focus:outline-none transition ${
                errors.slug
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-neutral-800 focus:border-[#2d6a35]'
              }`}
            />
            {errors.slug && <p className="text-xs text-red-400 mt-1.5">{errors.slug}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, category_id: e.target.value }));
                if (errors.category_id) setErrors((prev) => ({ ...prev, category_id: '' }));
              }}
              className={`w-full px-3.5 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white focus:outline-none transition ${
                errors.category_id
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-neutral-800 focus:border-[#2d6a35]'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-xs text-red-400 mt-1.5">{errors.category_id}</p>
            )}
          </div>

          {/* Badge */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Card Badge (Optional)
            </label>
            <input
              type="text"
              value={formData.card_badge}
              onChange={(e) => setFormData((prev) => ({ ...prev, card_badge: e.target.value }))}
              placeholder="e.g. Flagship Model, Heavy Duty, ASME Certified"
              className="w-full px-3.5 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35] transition"
            />
          </div>
        </div>

        {/* Card Summary Description */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
            Card Short Summary <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={2}
            required
            value={formData.card_description}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, card_description: e.target.value }));
              if (errors.card_description) setErrors((prev) => ({ ...prev, card_description: '' }));
            }}
            placeholder="Brief 1-2 sentence overview for the catalogue preview card."
            className={`w-full px-3.5 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none transition ${
              errors.card_description
                ? 'border-red-500 focus:border-red-500'
                : 'border-neutral-800 focus:border-[#2d6a35]'
            }`}
          />
          {errors.card_description && (
            <p className="text-xs text-red-400 mt-1.5">{errors.card_description}</p>
          )}
        </div>

        {/* Card Image Upload & Preview */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
            Card Image <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Upload Box */}
            <div className="md:col-span-2 border-2 border-dashed border-neutral-800 hover:border-[#2d6a35] rounded-xl p-6 bg-neutral-900/40 text-center transition flex flex-col items-center justify-center">
              <input
                type="file"
                id="card_image_input"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
              <label
                htmlFor="card_image_input"
                className="cursor-pointer flex flex-col items-center gap-2 text-neutral-400 hover:text-white transition"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-[#2d6a35]" />
                    <span className="text-xs text-neutral-300">
                      Uploading to Supabase Storage...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-white">
                      Click to choose product image
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Supports JPG, PNG, WebP (Max 5MB)
                    </span>
                  </>
                )}
              </label>
            </div>

            {/* Preview Box */}
            <div className="border border-neutral-800 rounded-xl p-3 bg-neutral-900/60 min-h-[140px] flex flex-col items-center justify-center text-center">
              {formData.card_image_url ? (
                <div className="space-y-2 w-full">
                  <div className="w-full h-24 rounded-lg bg-black/40 overflow-hidden flex items-center justify-center border border-neutral-800">
                    <img
                      src={formData.card_image_url}
                      alt="Product preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 px-1">
                    <span className="flex items-center gap-1 truncate max-w-[140px]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Uploaded
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, card_image_url: '' }))}
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
          {errors.card_image_url && (
            <p className="text-xs text-red-400 mt-2">{errors.card_image_url}</p>
          )}
        </div>

        {/* Product Multi-Image Gallery */}
        <div className="p-4 rounded-xl bg-black/40 border border-neutral-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                  Multi-Image Gallery (Angle Views)
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2d6a35]/20 text-emerald-400 font-mono">
                  {formData.gallery_images.length} {formData.gallery_images.length === 1 ? 'Angle' : 'Angles'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Upload multiple angle photos or cutaways. The frontend product modal displays an interactive thumbnail switcher.
              </p>
            </div>
          </div>

          {/* Upload and URL input row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className={`flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-medium text-white rounded-lg cursor-pointer transition ${uploadingGallery ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {uploadingGallery ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Upload className="w-4 h-4 text-emerald-400" />
              )}
              <span>{uploadingGallery ? 'Uploading Angles...' : 'Upload Angle Images'}</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleGalleryUpload}
                disabled={uploadingGallery}
                className="hidden"
              />
            </label>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                placeholder="Or paste image URL (e.g. /tank-1.png or https://...)"
                value={galleryUrlInput}
                onChange={(e) => setGalleryUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGalleryUrl();
                  }
                }}
                className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
              />
              <button
                type="button"
                onClick={handleAddGalleryUrl}
                disabled={!galleryUrlInput.trim()}
                className="px-3 py-2 bg-[#2d6a35] hover:bg-[#24572b] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shrink-0"
              >
                Add Angle
              </button>
            </div>
          </div>

          {/* Gallery Thumbnails Grid */}
          {formData.gallery_images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
              {formData.gallery_images.map((imgUrl, gIdx) => (
                <div
                  key={gIdx}
                  className="relative group rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 aspect-square flex items-center justify-center p-2"
                >
                  <img
                    src={imgUrl}
                    alt={`Angle ${gIdx + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/80 rounded text-[9px] font-mono text-neutral-300">
                    #{gIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(gIdx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-950/80 hover:bg-red-600 text-red-200 hover:text-white rounded transition shadow-md opacity-80 group-hover:opacity-100"
                    title="Remove angle"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 border border-dashed border-neutral-800/80 rounded-lg text-center text-neutral-500 text-xs">
              No extra angle images yet. Default card image will be displayed on frontend.
            </div>
          )}
        </div>

        {/* Card Quick Specs (Key-Value) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
              Card Quick Specs (Key-Value Pills)
            </label>
            <button
              type="button"
              onClick={() => handleAddKvSpec('card_specs')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Spec
            </button>
          </div>
          <div className="space-y-2">
            {formData.card_specs.map((spec, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Label (e.g. Capacity)"
                  value={spec.label}
                  onChange={(e) =>
                    handleUpdateKvSpec('card_specs', idx, 'label', e.target.value)
                  }
                  className="flex-1 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 500L – 5,000L)"
                  value={spec.value}
                  onChange={(e) =>
                    handleUpdateKvSpec('card_specs', idx, 'value', e.target.value)
                  }
                  className="flex-1 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveKvSpec('card_specs', idx)}
                  className="p-2 text-neutral-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Modal Detailed Content & TipTap */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-800/60">
          <FileText className="w-4 h-4 text-[#2d6a35]" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Modal Details &amp; Rich Content
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Modal Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.modal_title}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, modal_title: e.target.value }));
                if (errors.modal_title) setErrors((prev) => ({ ...prev, modal_title: '' }));
              }}
              placeholder="e.g. Industrial Hot Water Storage & Buffer System"
              className={`w-full px-3.5 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none transition ${
                errors.modal_title
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-neutral-800 focus:border-[#2d6a35]'
              }`}
            />
            {errors.modal_title && (
              <p className="text-xs text-red-400 mt-1.5">{errors.modal_title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Modal Tagline
            </label>
            <input
              type="text"
              value={formData.modal_tagline}
              onChange={(e) => setFormData((prev) => ({ ...prev, modal_tagline: e.target.value }))}
              placeholder="e.g. Engineered for high-temperature commercial thermal retention"
              className="w-full px-3.5 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35] transition"
            />
          </div>
        </div>

        {/* TipTap Rich Text Editor for Modal Description */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
            Detailed Description (TipTap Rich Text WYSIWYG) <span className="text-red-400">*</span>
          </label>
          <TipTapEditor
            value={formData.modal_description}
            onChange={(cleanHtml) => {
              setFormData((prev) => ({ ...prev, modal_description: cleanHtml }));
              if (errors.modal_description) {
                setErrors((prev) => ({ ...prev, modal_description: '' }));
              }
            }}
          />
          {errors.modal_description && (
            <p className="text-xs text-red-400 mt-1.5">{errors.modal_description}</p>
          )}
        </div>

        {/* CTA Text */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
            Modal Primary CTA Button Text
          </label>
          <input
            type="text"
            value={formData.cta_text}
            onChange={(e) => setFormData((prev) => ({ ...prev, cta_text: e.target.value }))}
            placeholder="e.g. Request Engineering Datasheet"
            className="w-full px-3.5 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35] transition"
          />
        </div>
      </div>

      {/* 3. Structured Builders: Features, Materials, Capacities, Tech Specs, Applications */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-800/60">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Product Specifications &amp; Details
          </h2>
        </div>

        {/* Features List ({ title, desc }) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-xs font-medium text-neutral-300 uppercase tracking-wider block">
                Key Features (Displayed in Customer Modal)
              </label>
              <span className="text-[11px] text-neutral-500">Add key technical feature highlights with title and description</span>
            </div>
            <button
              type="button"
              onClick={handleAddFeature}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Feature
            </button>
          </div>
          <div className="space-y-3">
            {formData.features.map((feat, idx) => (
              <div key={idx} className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={feat.title}
                    onChange={(e) => handleUpdateFeature(idx, 'title', e.target.value)}
                    placeholder="Feature Title (e.g. High Thermal Retention)"
                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="p-1.5 text-neutral-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={feat.desc}
                  onChange={(e) => handleUpdateFeature(idx, 'desc', e.target.value)}
                  placeholder="Feature Description (e.g. Polyurethane insulation jacket with low standby heat loss)"
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specs Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-xs font-medium text-neutral-300 uppercase tracking-wider block">
                Technical Specifications Table
              </label>
              <span className="text-[11px] text-neutral-500">Parameter and value rows rendered in the customer modal table</span>
            </div>
            <button
              type="button"
              onClick={() => handleAddKvSpec('technical_specs')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Spec Row
            </button>
          </div>
          <div className="space-y-2">
            {formData.technical_specs.map((spec, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Parameter (e.g. Design Pressure)"
                  value={spec.label || spec.param || ''}
                  onChange={(e) =>
                    handleUpdateKvSpec('technical_specs', idx, 'label', e.target.value)
                  }
                  className="w-1/2 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                />
                <input
                  type="text"
                  placeholder="Specification (e.g. 10 Bar / 1.0 MPa)"
                  value={spec.value || ''}
                  onChange={(e) =>
                    handleUpdateKvSpec('technical_specs', idx, 'value', e.target.value)
                  }
                  className="w-1/2 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveKvSpec('technical_specs', idx)}
                  className="p-2 text-neutral-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Applications / Suitable Sectors */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-xs font-medium text-neutral-300 uppercase tracking-wider block">
                Applications &amp; Suitable Sectors
              </label>
              <span className="text-[11px] text-neutral-500">Checklist items for target commercial and industrial use-cases</span>
            </div>
            <button
              type="button"
              onClick={() => handleAddStringItem('applications')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Application
            </button>
          </div>
          <div className="space-y-2">
            {formData.applications.map((app, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={app}
                  onChange={(e) => handleUpdateStringItem('applications', idx, e.target.value)}
                  placeholder="e.g. Hotels, Resorts & Commercial HVAC"
                  className="flex-1 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveStringItem('applications', idx)}
                  className="p-1.5 text-neutral-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Materials & Capacities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Materials */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
                Materials of Construction
              </label>
              <button
                type="button"
                onClick={() => handleAddStringItem('materials')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Material
              </button>
            </div>
            <div className="space-y-2">
              {formData.materials.map((mat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mat}
                    onChange={(e) => handleUpdateStringItem('materials', idx, e.target.value)}
                    placeholder="e.g. Duplex 2205 / SS316L"
                    className="flex-1 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStringItem('materials', idx)}
                    className="p-1.5 text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Capacities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
                Standard Capacities
              </label>
              <button
                type="button"
                onClick={() => handleAddStringItem('capacities')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Capacity
              </button>
            </div>
            <div className="space-y-2">
              {formData.capacities.map((cap, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cap}
                    onChange={(e) => handleUpdateStringItem('capacities', idx, e.target.value)}
                    placeholder="e.g. 5,000 Litres"
                    className="flex-1 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStringItem('capacities', idx)}
                    className="p-1.5 text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Specs Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
              Technical Specifications Table
            </label>
            <button
              type="button"
              onClick={() => handleAddKvSpec('technical_specs')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Spec Row
            </button>
          </div>
          <div className="space-y-2">
            {formData.technical_specs.map((spec, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Parameter (e.g. Design Pressure)"
                  value={spec.label}
                  onChange={(e) =>
                    handleUpdateKvSpec('technical_specs', idx, 'label', e.target.value)
                  }
                  className="flex-1 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                />
                <input
                  type="text"
                  placeholder="Specification (e.g. 10 Bar)"
                  value={spec.value}
                  onChange={(e) =>
                    handleUpdateKvSpec('technical_specs', idx, 'value', e.target.value)
                  }
                  className="flex-1 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveKvSpec('technical_specs', idx)}
                  className="p-2 text-neutral-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs Accordion Builder */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
              Frequently Asked Questions (FAQs)
            </label>
            <button
              type="button"
              onClick={handleAddFaq}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add FAQ
            </button>
          </div>
          <div className="space-y-3">
            {formData.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-3 bg-neutral-900/50 border border-neutral-800/80 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="Question (e.g. Can this vessel be installed outdoors?)"
                    value={faq.q}
                    onChange={(e) => handleUpdateFaq(idx, 'q', e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFaq(idx)}
                    className="p-1.5 text-neutral-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Answer"
                  value={faq.a}
                  onChange={(e) => handleUpdateFaq(idx, 'a', e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Publishing & Order Index */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Publishing Status</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Drafts are hidden from the public website and only visible inside this CMS.
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
