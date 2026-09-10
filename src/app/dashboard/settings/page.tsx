'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Phone,
  Mail,
  MapPin,
  Globe,
  Share2,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface SiteSettingsData {
  id?: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  about_summary: string;
  vision_text: string;
  updated_at?: string;
}

export default function SiteSettingsPage() {
  const [formData, setFormData] = useState<SiteSettingsData>({
    company_name: 'FireSlab Industries',
    phone: '+91 7310018656',
    email: 'info@fireslab.com',
    address: 'Sector 15, GIDA, Uttar Pradesh, India',
    facebook_url: 'https://www.facebook.com/fireslabindia',
    instagram_url: 'https://www.instagram.com/fireslab',
    linkedin_url: 'https://www.linkedin.com/company/fireslab',
    about_summary:
      'Leading manufacturer of pressurized hot water storage tanks, modular panel tanks, and advanced thermal engineering solutions across India and international markets.',
    vision_text:
      'To be the benchmark for thermal engineering excellence, delivering unyielding efficiency and safety for heavy industrial and commercial applications.',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/proxy/settings');
      if (!res.ok) throw new Error('Failed to load site settings');
      const data = await res.json();
      if (data.data) {
        setFormData({
          id: data.data.id,
          company_name: data.data.company_name || '',
          phone: data.data.phone || '',
          email: data.data.email || '',
          address: data.data.address || '',
          facebook_url: data.data.facebook_url || '',
          instagram_url: data.data.instagram_url || '',
          linkedin_url: data.data.linkedin_url || '',
          about_summary: data.data.about_summary || '',
          vision_text: data.data.vision_text || '',
          updated_at: data.data.updated_at,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching site settings';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.company_name.trim()) errs.company_name = 'Company name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.address.trim()) errs.address = 'Physical address is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/proxy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update site settings');

      if (data.data) {
        setFormData((prev) => ({
          ...prev,
          ...data.data,
        }));
      }
      showToast('Site settings updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating site settings';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
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
            <SettingsIcon className="w-6 h-6 text-amber-500" />
            Site & Global Settings
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Configure global contact info, corporate address, social networks, and brand vision.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            title="Reload settings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
        </div>
      )}

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-neutral-400 gap-3 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl">
          <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
          <span className="text-sm">Loading global settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Company & Contact Info */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-800/80">
              <Building className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-white">Company & Contact Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Company Name <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, company_name: e.target.value }))
                    }
                    className={`w-full bg-neutral-950 border ${
                      errors.company_name ? 'border-red-500' : 'border-neutral-800'
                    } rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors`}
                  />
                </div>
                {errors.company_name && (
                  <p className="text-red-400 text-xs mt-1">{errors.company_name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Support & Inquiries Email <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    className={`w-full bg-neutral-950 border ${
                      errors.email ? 'border-red-500' : 'border-neutral-800'
                    } rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Direct Contact / Hotline Phone <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, phone: e.target.value }))
                    }
                    className={`w-full bg-neutral-950 border ${
                      errors.phone ? 'border-red-500' : 'border-neutral-800'
                    } rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Factory & Registered Office Address <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, address: e.target.value }))
                    }
                    className={`w-full bg-neutral-950 border ${
                      errors.address ? 'border-red-500' : 'border-neutral-800'
                    } rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors`}
                  />
                </div>
                {errors.address && (
                  <p className="text-red-400 text-xs mt-1">{errors.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Social Media & External Channels */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-800/80">
              <Share2 className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-white">Social Media & Corporate Links</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* LinkedIn */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, linkedin_url: e.target.value }))
                  }
                  placeholder="https://linkedin.com/company/fireslab"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, instagram_url: e.target.value }))
                  }
                  placeholder="https://instagram.com/fireslab"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Facebook */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, facebook_url: e.target.value }))
                  }
                  placeholder="https://facebook.com/fireslabindia"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 3. Brand Vision & Narrative */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-800/80">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-white">Brand Narrative & Mission</h2>
            </div>

            <div className="space-y-4">
              {/* About Summary */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  About Summary (Footer & Corporate Profile)
                </label>
                <textarea
                  rows={3}
                  value={formData.about_summary}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, about_summary: e.target.value }))
                  }
                  placeholder="Overview of company engineering pedigree and solutions..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              {/* Vision Text */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Vision Statement
                </label>
                <textarea
                  rows={3}
                  value={formData.vision_text}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, vision_text: e.target.value }))
                  }
                  placeholder="Company vision for thermal engineering benchmark..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-md sticky bottom-6 shadow-2xl">
            <div className="text-xs text-neutral-400">
              {formData.updated_at && (
                <span>
                  Last modified:{' '}
                  {new Date(formData.updated_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
