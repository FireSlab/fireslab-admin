'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  Loader2,
  Briefcase,
  MapPin,
  Calendar,
  Building,
  Star,
  Package,
} from 'lucide-react';
import TipTapEditor from './TipTapEditor';

export interface ProjectFormData {
  id?: string;
  title: string;
  slug: string;
  location: string;
  category: string;
  product_used: string;
  product_id?: string | null;
  image_url: string;
  description: string;
  client_name?: string;
  completion_year?: number;
  is_featured: boolean;
  is_published: boolean;
  order_index: number;
}

interface ProductOption {
  id: string;
  card_title: string;
  slug: string;
}

interface ProjectFormProps {
  initialData?: ProjectFormData;
  isEdit?: boolean;
}

const CATEGORIES = [
  { value: 'hotel', label: 'Hotel & Hospitality' },
  { value: 'hospital', label: 'Hospital & Healthcare' },
  { value: 'industrial', label: 'Industrial & Manufacturing' },
  { value: 'pool', label: 'Commercial Pools & Sports' },
  { value: 'residential', label: 'Residential & Luxury Villas' },
];

export default function ProjectForm({ initialData, isEdit = false }: ProjectFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<ProjectFormData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    location: initialData?.location || '',
    category: initialData?.category || 'hotel',
    product_used: initialData?.product_used || '',
    product_id: initialData?.product_id || '',
    image_url: initialData?.image_url || '',
    description: initialData?.description || '',
    client_name: initialData?.client_name || '',
    completion_year: initialData?.completion_year || new Date().getFullYear(),
    is_featured: initialData?.is_featured ?? false,
    is_published: initialData?.is_published ?? true,
    order_index: initialData?.order_index || 0,
  });

  const [originalImageUrl] = useState<string>(initialData?.image_url || '');
  const [productsList, setProductsList] = useState<ProductOption[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: string; slug: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  // Fetch available products and existing projects for slug uniqueness
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [prodRes, projRes] = await Promise.all([
          fetch('/api/proxy/products?include_drafts=true'),
          fetch('/api/proxy/projects?include_drafts=true'),
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProductsList(
            (prodData.data || []).map((p: any) => ({
              id: p.id,
              card_title: p.card_title,
              slug: p.slug,
            }))
          );
        }

        if (projRes.ok) {
          const projData = await projRes.json();
          setAllProjects(
            (projData.data || []).map((p: any) => ({
              id: p.id,
              slug: p.slug,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load project form metadata:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadMetadata();
  }, [isEdit]);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (autoSlug) {
        updated.slug = slugify(val);
      }
      return updated;
    });

    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: '' }));
    }
  };

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

    // Slug check in edit mode: exclude current project's record
    const collision = allProjects.find(
      (p) => p.slug === slugToTest && (isEdit ? p.id !== initialData?.id : true)
    );

    if (collision) {
      setErrors((prev) => ({
        ...prev,
        slug: 'This slug is already taken by another project.',
      }));
      return false;
    }

    setErrors((prev) => ({ ...prev, slug: '' }));
    return true;
  };

  // Image upload
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
      form.append('bucket', 'project-images');

      const res = await fetch('/api/proxy/upload?bucket=project-images', {
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

  // Client validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.title.trim()) {
      errs.title = 'Project title is required.';
    }
    if (!formData.slug.trim()) {
      errs.slug = 'Slug is required.';
    } else if (!validateSlug(formData.slug)) {
      errs.slug = 'This slug is already taken by another project.';
    }
    if (!formData.location.trim()) {
      errs.location = 'Project location is required.';
    }
    if (!formData.category.trim()) {
      errs.category = 'Please select a project category.';
    }
    if (!formData.product_used.trim()) {
      errs.product_used = 'Please specify the primary product used.';
    }
    if (!formData.image_url.trim()) {
      errs.image_url = 'Project showcase image is required.';
    }
    if (!formData.description.trim() || formData.description === '<p></p>') {
      errs.description = 'Case study description cannot be empty.';
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
        product_id: formData.product_id ? formData.product_id : null,
        completion_year: formData.completion_year ? Number(formData.completion_year) : null,
      };

      const url = isEdit
        ? `/api/proxy/projects/${initialData?.id}`
        : '/api/proxy/projects';

      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save project.');
      }

      // Storage cleanup for replaced image:
      // If editing and image replaced, delete old image in background
      // Non-blocking: failures are logged without preventing save
      if (
        isEdit &&
        originalImageUrl &&
        originalImageUrl !== formData.image_url &&
        originalImageUrl.includes('/storage/v1/object/public/project-images/')
      ) {
        try {
          const oldFilename = originalImageUrl.split('/storage/v1/object/public/project-images/')[1];
          if (oldFilename) {
            console.log('Purging replaced project image from storage:', oldFilename);
            fetch(`/api/proxy/upload/project-images/${oldFilename}`, {
              method: 'DELETE',
            }).catch((cleanupErr) => {
              console.warn('Storage cleanup failed (non-blocking):', cleanupErr);
            });
          }
        } catch (cleanupErr) {
          console.warn('Storage cleanup parse failed (non-blocking):', cleanupErr);
        }
      }

      router.push('/dashboard/projects');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save project';
      setGlobalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#2d6a35]" />
        <span className="text-sm">Loading project configuration...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl pb-16">
      {/* Action Header */}
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
              {isEdit ? `Edit Case Study: ${formData.title}` : 'New Case Study / Project'}
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isEdit
                ? 'Update client installation details, specifications, and imagery.'
                : 'Showcase an industrial installation, luxury hotel, or healthcare engineering deployment.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/projects')}
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
                <span>Saving Project...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Create Project'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Error */}
      {globalError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      {/* 1. Project Identity & Location */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-800/60">
          <Briefcase className="w-4 h-4 text-[#e07b2a]" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Project Overview &amp; Location
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Project Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="e.g. Grand Hyatt Hot Water System"
              className={`w-full px-3.5 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none transition ${
                errors.title
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-neutral-800 focus:border-[#2d6a35]'
              }`}
            />
            {errors.title && <p className="text-xs text-red-400 mt-1.5">{errors.title}</p>}
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
              placeholder="grand-hyatt-hot-water-system"
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
              Sector / Category <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, category: e.target.value }));
                if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
              }}
              className={`w-full px-3.5 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white focus:outline-none transition ${
                errors.category
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-neutral-800 focus:border-[#2d6a35]'
              }`}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-400 mt-1.5">{errors.category}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Location <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, location: e.target.value }));
                  if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                }}
                placeholder="e.g. Mumbai, Maharashtra"
                className={`w-full pl-10 pr-4 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none transition ${
                  errors.location
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-neutral-800 focus:border-[#2d6a35]'
                }`}
              />
            </div>
            {errors.location && <p className="text-xs text-red-400 mt-1.5">{errors.location}</p>}
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Client / Organization (Optional)
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.client_name || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
                placeholder="e.g. Hyatt Hotels Corporation"
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35] transition"
              />
            </div>
          </div>

          {/* Completion Year */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Year of Completion
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                value={formData.completion_year || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    completion_year: parseInt(e.target.value) || undefined,
                  }))
                }
                placeholder="2024"
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#2d6a35] transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Equipment Link & Showcase Image */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-800/60">
          <Package className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Equipment Deployed &amp; Project Media
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Used Text */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Product Used / Solution Description <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.product_used}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, product_used: e.target.value }));
                if (errors.product_used) setErrors((prev) => ({ ...prev, product_used: '' }));
              }}
              placeholder="e.g. 5,000L Pressurized Hot Water Buffer Vessel"
              className={`w-full px-3.5 py-2.5 bg-neutral-900/80 border rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none transition ${
                errors.product_used
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-neutral-800 focus:border-[#2d6a35]'
              }`}
            />
            {errors.product_used && (
              <p className="text-xs text-red-400 mt-1.5">{errors.product_used}</p>
            )}
          </div>

          {/* Linked Catalogue Product (Optional Dropdown) */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
              Link to Catalogue Product (Optional)
            </label>
            <select
              value={formData.product_id || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, product_id: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#2d6a35] transition"
            >
              <option value="">No linked catalogue product (Custom solution)</option>
              {productsList.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.card_title} (/{prod.slug})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-neutral-500 mt-1.5">
              Allows cross-linking between case study and the product datasheet.
            </p>
          </div>
        </div>

        {/* Image Upload Box */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
            Project Showcase Image <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-2 border-2 border-dashed border-neutral-800 hover:border-[#2d6a35] rounded-xl p-6 bg-neutral-900/40 text-center transition flex flex-col items-center justify-center">
              <input
                type="file"
                id="project_image_input"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
              <label
                htmlFor="project_image_input"
                className="cursor-pointer flex flex-col items-center gap-2 text-neutral-400 hover:text-white transition"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-[#2d6a35]" />
                    <span className="text-xs text-neutral-300">
                      Uploading to Supabase Storage (project-images)...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-white">
                      Click to upload project photo
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
                      alt="Project showcase"
                      className="w-full h-full object-cover"
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

      {/* 3. Case Study Description (TipTap WYSIWYG) */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
            Case Study Description (TipTap Rich Text WYSIWYG) <span className="text-red-400">*</span>
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
          <p className="text-[11px] text-neutral-500 mt-1.5">
            Document challenge, engineering solution, and measured thermal performance results. Output HTML is sanitized automatically via DOMPurify.
          </p>
        </div>
      </div>

      {/* 4. Flags: Featured, Published, Order Index */}
      <div className="p-6 rounded-xl bg-[#0f1412] border border-neutral-800/80 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Featured Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Star className="w-4 h-4 text-[#e07b2a]" />
                Featured Showcase
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Displays project in the homepage spotlight reel.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_featured: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e07b2a]"></div>
            </label>
          </div>

          {/* Published Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <div>
              <div className="text-xs font-semibold text-white">Publishing Status</div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Drafts are hidden from public website.
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
              <span className="ml-2.5 text-xs font-semibold">
                {formData.is_published ? (
                  <span className="text-emerald-400">Published</span>
                ) : (
                  <span className="text-neutral-500">Draft</span>
                )}
              </span>
            </label>
          </div>
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
