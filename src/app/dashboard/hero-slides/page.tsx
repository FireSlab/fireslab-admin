'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Presentation,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Sliders,
} from 'lucide-react';

interface HeroSlideItem {
  id: string;
  tagline: string;
  title: string;
  description: string;
  primary_btn_text: string;
  primary_btn_url: string;
  secondary_btn_text: string;
  secondary_btn_url: string;
  image_url: string | null;
  order_index: number;
  is_active: boolean;
}

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideItem | null>(null);
  const [formData, setFormData] = useState({
    tagline: '',
    title: '',
    description: '',
    primary_btn_text: 'Explore Products',
    primary_btn_url: '#products',
    secondary_btn_text: 'Consult Expert',
    secondary_btn_url: '#contact',
    image_url: '',
    order_index: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Delete State
  const [deletingSlide, setDeletingSlide] = useState<HeroSlideItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSlides = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/proxy/hero-slides?include_drafts=true');
      if (!res.ok) throw new Error('Failed to load hero slides');
      const data = await res.json();
      setSlides(data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching slides';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredSlides = useMemo(() => {
    return slides.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    });
  }, [slides, searchQuery]);

  const openCreateModal = () => {
    setEditingSlide(null);
    setFormData({
      tagline: '',
      title: '',
      description: '',
      primary_btn_text: 'Explore Products',
      primary_btn_url: '#products',
      secondary_btn_text: 'Consult Expert',
      secondary_btn_url: '#contact',
      image_url: '',
      order_index: slides.length + 1,
      is_active: true,
    });
    setFormErrors({});
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (slide: HeroSlideItem) => {
    setEditingSlide(slide);
    setFormData({
      tagline: slide.tagline,
      title: slide.title,
      description: slide.description,
      primary_btn_text: slide.primary_btn_text || 'Explore Products',
      primary_btn_url: slide.primary_btn_url || '#products',
      secondary_btn_text: slide.secondary_btn_text || 'Consult Expert',
      secondary_btn_url: slide.secondary_btn_url || '#contact',
      image_url: slide.image_url || '',
      order_index: slide.order_index,
      is_active: slide.is_active,
    });
    setFormErrors({});
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit.');
      return;
    }

    setUploadError(null);
    setUploadingImage(true);

    try {
      const bodyFormData = new FormData();
      bodyFormData.append('file', file);
      bodyFormData.append('bucket', 'general-assets');

      const res = await fetch('/api/proxy/upload?bucket=general-assets', {
        method: 'POST',
        body: bodyFormData,
      });

      const data = await res.json();
      if (!res.ok || !data.data?.publicUrl) {
        throw new Error(data.error || 'Failed to upload background image');
      }

      setFormData((prev) => ({
        ...prev,
        image_url: data.data.publicUrl,
      }));
      showToast('Image uploaded & compressed to WebP!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error uploading image';
      setUploadError(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  // Inline toggle for is_active
  const toggleActive = async (slide: HeroSlideItem) => {
    try {
      const nextActive = !slide.is_active;
      // Optimistic update
      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, is_active: nextActive } : s))
      );

      const res = await fetch(`/api/proxy/hero-slides/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      });

      if (!res.ok) throw new Error('Toggle failed');
      showToast(`Slide status updated to ${nextActive ? 'Active' : 'Hidden'}`);
    } catch {
      fetchSlides();
    }
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Headline title is required';
    if (!formData.description.trim()) errs.description = 'Description is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const url = editingSlide
        ? `/api/proxy/hero-slides/${editingSlide.id}`
        : '/api/proxy/hero-slides';
      const method = editingSlide ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save hero slide');

      showToast(editingSlide ? 'Slide updated successfully' : 'Slide created successfully');
      setIsModalOpen(false);
      fetchSlides();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving slide';
      setFormErrors((prev) => ({ ...prev, global: msg }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSlide) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/proxy/hero-slides/${deletingSlide.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete slide');

      showToast('Hero slide removed');
      setDeletingSlide(null);
      fetchSlides();
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
            <Presentation className="w-6 h-6 text-amber-500" />
            Homepage Hero Slides
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Configure dynamic headline statements, subheadings, and action buttons for the hero banner carousel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSlides}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            title="Refresh slides"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Hero Slide
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
            placeholder="Search slides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <div className="text-xs text-neutral-400 flex items-center gap-2">
          <span>Total Slides:</span>
          <span className="font-semibold text-white bg-neutral-800 px-2 py-0.5 rounded-md">
            {slides.length}
          </span>
        </div>
      </div>

      {/* Slides Table */}
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            <span className="text-sm">Loading hero slides...</span>
          </div>
        ) : filteredSlides.length === 0 ? (
          <div className="p-16 text-center text-neutral-400">
            <Presentation className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-base font-medium text-neutral-300">No slides configured</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800/80 bg-neutral-950/40 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
                  <th className="py-3.5 px-4 w-16 text-center">Order</th>
                  <th className="py-3.5 px-4 w-28">Image</th>
                  <th className="py-3.5 px-4">Headline & Tagline</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">CTAs</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50 text-sm">
                {filteredSlides.map((slide) => (
                  <tr key={slide.id} className="group hover:bg-neutral-800/30 transition-colors">
                    {/* Order */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block text-xs font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800">
                        #{slide.order_index}
                      </span>
                    </td>

                    {/* Image Preview */}
                    <td className="py-4 px-4">
                      <div className="w-24 h-14 rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden relative group/img shadow-sm">
                        {slide.image_url ? (
                          <img
                            src={slide.image_url}
                            alt={slide.title}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 font-mono">
                            Default BG
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Headline */}
                    <td className="py-4 px-4 max-w-xs">
                      {slide.tagline && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 block mb-0.5">
                          {slide.tagline}
                        </span>
                      )}
                      <div className="font-bold text-white group-hover:text-amber-400 transition-colors whitespace-pre-line">
                        {slide.title}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-4 max-w-sm">
                      <p className="text-xs text-neutral-400 line-clamp-2">{slide.description}</p>
                    </td>

                    {/* CTAs */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-neutral-300 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {slide.primary_btn_text}
                        </span>
                        <span className="text-neutral-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                          {slide.secondary_btn_text}
                        </span>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => toggleActive(slide)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          slide.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-neutral-800/60 text-neutral-400 border-neutral-700/50 hover:bg-neutral-800'
                        }`}
                        title="Click to toggle status"
                      >
                        {slide.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{slide.is_active ? 'Active' : 'Hidden'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(slide)}
                          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit Slide"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSlide(slide)}
                          className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Slide"
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
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Presentation className="w-5 h-5 text-amber-500" />
                {editingSlide ? 'Edit Hero Slide' : 'Create New Hero Slide'}
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

              {/* Tagline & Title */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Eyebrow Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData((p) => ({ ...p, tagline: e.target.value }))}
                  placeholder="e.g. Precision Engineering"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Headline Title <span className="text-amber-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Advanced Thermal Systems"
                  className={`w-full bg-neutral-950 border ${
                    formErrors.title ? 'border-red-500' : 'border-neutral-800'
                  } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors resize-none`}
                />
                {formErrors.title && <p className="text-red-400 text-xs mt-1">{formErrors.title}</p>}
              </div>

              {/* Background Image Upload & Preview */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Slide Background Image (Auto WebP Compressed)
                </label>

                {formData.image_url ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 group">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="cursor-pointer px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, image_url: '' }))}
                        className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-800 hover:border-amber-500/50 rounded-xl bg-neutral-950/50 hover:bg-neutral-950 cursor-pointer transition">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2 text-neutral-400">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        <span className="text-xs">Compressing to WebP & Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-neutral-400">
                        <Presentation className="w-6 h-6 text-neutral-600" />
                        <span className="text-xs font-medium text-neutral-300">
                          Click to upload high-res banner image
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          JPG, PNG, WebP up to 10MB (Auto-converted to WebP)
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                )}

                {uploadError && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{uploadError}</span>
                  </p>
                )}

                <div className="pt-0.5">
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData((p) => ({ ...p, image_url: e.target.value }))}
                    placeholder="Or paste direct image URL (e.g. https://...supabase.co/...)"
                    className="w-full bg-neutral-950 border border-neutral-800/80 rounded-lg px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Description <span className="text-amber-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Supporting narrative for this banner..."
                  className={`w-full bg-neutral-950 border ${
                    formErrors.description ? 'border-red-500' : 'border-neutral-800'
                  } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors resize-none`}
                />
                {formErrors.description && <p className="text-red-400 text-xs mt-1">{formErrors.description}</p>}
              </div>

              {/* CTAs Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.primary_btn_text}
                    onChange={(e) => setFormData((p) => ({ ...p, primary_btn_text: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Primary Button URL
                  </label>
                  <input
                    type="text"
                    value={formData.primary_btn_url}
                    onChange={(e) => setFormData((p) => ({ ...p, primary_btn_url: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Secondary Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.secondary_btn_text}
                    onChange={(e) => setFormData((p) => ({ ...p, secondary_btn_text: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Secondary Button URL
                  </label>
                  <input
                    type="text"
                    value={formData.secondary_btn_url}
                    onChange={(e) => setFormData((p) => ({ ...p, secondary_btn_url: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Order & Active */}
              <div className="grid grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Order Index
                  </label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData((p) => ({ ...p, order_index: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-neutral-200 font-medium">Active on Homepage</span>
                  </label>
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
                  {editingSlide ? 'Save Changes' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Hero Slide</h3>
            </div>

            <p className="text-sm text-neutral-300">
              Are you sure you want to delete slide{' '}
              <strong className="text-white">&quot;{deletingSlide.title}&quot;</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setDeletingSlide(null)}
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
