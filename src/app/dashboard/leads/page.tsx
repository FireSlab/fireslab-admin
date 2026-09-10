'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Inbox,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Mail,
  Building,
  Calendar,
  Tag,
  MessageSquare,
  FileText,
  Save,
  Check,
  ChevronRight,
  ExternalLink,
  Clock,
  AlertTriangle,
  User,
} from 'lucide-react';

interface LeadItem {
  id: string;
  name: string;
  email: string;
  company: string | null;
  solution_interest: string;
  message: string | null;
  status: 'new' | 'contacted' | 'quoted' | 'closed';
  admin_notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  new: {
    label: 'New Inquiry',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-400 animate-pulse',
  },
  contacted: {
    label: 'Contacted',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    dotClass: 'bg-sky-400',
  },
  quoted: {
    label: 'Quoted',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    dotClass: 'bg-purple-400',
  },
  closed: {
    label: 'Closed',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected Lead for Detail Modal / Slide-over
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('new');
  const [savingLead, setSavingLead] = useState(false);

  // Delete modal state
  const [deletingLead, setDeletingLead] = useState<LeadItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/proxy/leads');
      if (!res.ok) throw new Error('Failed to load inquiries');
      const data = await res.json();
      setLeads(data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching leads';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus =
        selectedStatus === 'all' || lead.status === selectedStatus;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        (lead.company && lead.company.toLowerCase().includes(q)) ||
        lead.solution_interest.toLowerCase().includes(q) ||
        (lead.message && lead.message.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [leads, selectedStatus, searchQuery]);

  // Status counts for tab badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: leads.length,
      new: 0,
      contacted: 0,
      quoted: 0,
      closed: 0,
    };
    for (const l of leads) {
      if (counts[l.status] !== undefined) {
        counts[l.status]++;
      }
    }
    return counts;
  }, [leads]);

  // Open Lead Drawer
  const openLeadDetails = (lead: LeadItem) => {
    setSelectedLead(lead);
    setEditNotes(lead.admin_notes || '');
    setEditStatus(lead.status);
  };

  // Save Status and Admin Notes via PUT
  const handleSaveLead = async () => {
    if (!selectedLead) return;
    setSavingLead(true);
    try {
      const res = await fetch(`/api/proxy/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          admin_notes: editNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update lead');

      // Update in local state
      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? data.data : l))
      );
      setSelectedLead(data.data);
      showToast(`Lead for ${data.data.name} updated successfully`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating lead';
      setErrorMessage(msg);
    } finally {
      setSavingLead(false);
    }
  };

  // Delete lead (for spam cleanup)
  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/proxy/leads/${deletingLead.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete lead');

      showToast('Lead record removed');
      if (selectedLead?.id === deletingLead.id) {
        setSelectedLead(null);
      }
      setDeletingLead(null);
      fetchLeads();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete lead';
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
            <Inbox className="w-6 h-6 text-amber-500" />
            Customer Leads & Inquiries
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Review prospective client quote submissions and update pipeline statuses.
          </p>
        </div>

        <button
          onClick={fetchLeads}
          disabled={loading}
          className="self-start sm:self-auto p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
          title="Refresh inquiries"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {(['all', 'new', 'contacted', 'quoted', 'closed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                selectedStatus === st
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-800/80'
              }`}
            >
              <span>{st}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  selectedStatus === st
                    ? 'bg-neutral-950/20 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {statusCounts[st]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            <span className="text-sm">Loading customer inquiries...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-16 text-center text-neutral-400">
            <Inbox className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-base font-medium text-neutral-300">No inquiries found</p>
            <p className="text-xs text-neutral-500 mt-1">
              {searchQuery || selectedStatus !== 'all'
                ? 'Try clearing filters or search query.'
                : 'Customer submissions through the frontend will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800/80 bg-neutral-950/40 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Prospective Client</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Solution Interest</th>
                  <th className="py-3.5 px-4">Message Snippet</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50 text-sm">
                {filteredLeads.map((lead) => {
                  const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                  const dateStr = new Date(lead.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => openLeadDetails(lead)}
                      className="group cursor-pointer hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-4 px-4 text-xs text-neutral-400 font-mono whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Name & Email */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-white group-hover:text-amber-400 transition-colors">
                          {lead.name}
                        </div>
                        <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-neutral-500" />
                          <span>{lead.email}</span>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-4 px-4 text-neutral-300">
                        {lead.company ? (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                            <Building className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{lead.company}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-500 italic">Not provided</span>
                        )}
                      </td>

                      {/* Solution Interest */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-950 border border-neutral-800 text-neutral-300">
                          <Tag className="w-3 h-3 text-amber-500" />
                          <span className="truncate max-w-[140px]">
                            {lead.solution_interest}
                          </span>
                        </span>
                      </td>

                      {/* Message Preview */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-xs text-neutral-400 truncate">
                          {lead.message || <span className="italic text-neutral-600">No message</span>}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-4 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openLeadDetails(lead)}
                            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Inspect Lead"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingLead(lead)}
                            className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete Lead (Spam)"
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

      {/* LEAD DETAIL & CRM MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-lg">
                  {selectedLead.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedLead.name}</h2>
                  <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                    <span>{selectedLead.company || 'Direct Inquiry'}</span>
                    <span>•</span>
                    <span>
                      {new Date(selectedLead.created_at).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedLead.email}?subject=FireSlab Inquiry: ${encodeURIComponent(
                    selectedLead.solution_interest
                  )}`}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Send Email"
                >
                  <Mail className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">Reply Email</span>
                </a>

                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Inquiry Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="text-sm font-medium text-white hover:text-amber-400 transition-colors flex items-center gap-1.5 truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{selectedLead.email}</span>
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                    Company / Organization
                  </span>
                  <div className="text-sm font-medium text-white flex items-center gap-1.5 truncate">
                    <Building className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{selectedLead.company || 'Not Specified'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                    Solution Interest
                  </span>
                  <div className="text-sm font-medium text-amber-400 flex items-center gap-1.5 truncate">
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedLead.solution_interest}</span>
                  </div>
                </div>
              </div>

              {/* Message from Client */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  Client Project Requirements & Message
                </label>
                <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 text-sm text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedLead.message ? (
                    selectedLead.message
                  ) : (
                    <span className="text-neutral-500 italic">No message provided with submission.</span>
                  )}
                </div>
              </div>

              {/* Status Update Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Sales Pipeline Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['new', 'contacted', 'quoted', 'closed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`p-3 rounded-xl border text-xs font-semibold capitalize flex items-center justify-between transition-all ${
                        editStatus === st
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      <span>{STATUS_CONFIG[st].label}</span>
                      {editStatus === st && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Internal Admin Notes & Sizing Log
                </label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record sizing notes, quotation numbers, phone call outcomes, or technical recommendations..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-5 border-t border-neutral-800 bg-neutral-950/60">
              <button
                type="button"
                onClick={() => setDeletingLead(selectedLead)}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Lead (Spam)</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveLead}
                  disabled={savingLead}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  {savingLead ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Lead Updates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE LEAD CONFIRMATION */}
      {deletingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Lead</h3>
            </div>

            <p className="text-sm text-neutral-300">
              Are you sure you want to delete inquiry from{' '}
              <strong className="text-white">&quot;{deletingLead.name}&quot;</strong>?
              This is typically used for removing spam or automated test inquiries.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setDeletingLead(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
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
