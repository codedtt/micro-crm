'use client';

import React, { useState, useMemo } from 'react';
import { 
  CUSTOMERS, 
  CONTACTS, 
  INTERACTIONS, 
  Customer, 
  Contact, 
  Interaction,
  CustomerInsights 
} from '@/lib/crm-data';
import { analyzeCustomerIntelligenceSync } from '@/lib/ai-engine';
import { 
  Users, 
  Sparkles, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Search, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Send,
  ArrowUpRight,
  Plus,
  X,
  Loader2
} from 'lucide-react';

export default function MicroCRM() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust_009');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'prospect' | 'customer'>('all');
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Dynamic state for interactions
  const [allInteractions, setAllInteractions] = useState<Interaction[]>(INTERACTIONS);

  // State to store live Gemini API overrides by customer ID
  const [liveAiInsights, setLiveAiInsights] = useState<Record<string, CustomerInsights>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newType, setNewType] = useState<'email' | 'call' | 'meeting' | 'note'>('call');
  const [newContactId, setNewContactId] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Compute enriched customer dataset (prefers live Gemini insights if available)
  const enrichedCustomers = useMemo(() => {
    return CUSTOMERS.map(cust => {
      const custContacts = CONTACTS.filter(c => c.customer_id === cust.id);
      const custInteractions = allInteractions.filter(i => i.customer_id === cust.id);
      
      // Use live Gemini insight if generated, otherwise fall back to local heuristic calculation
      const aiInsights = liveAiInsights[cust.id] || analyzeCustomerIntelligenceSync(cust, custContacts, custInteractions);

      return {
        ...cust,
        contacts: custContacts,
        interactions: custInteractions,
        ai: aiInsights
      };
    }).sort((a, b) => b.ai.attentionScore - a.ai.attentionScore);
  }, [allInteractions, liveAiInsights]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ai.keyPainPoints.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.contacts.some(cnt => cnt.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrichedCustomers, searchQuery, statusFilter]);

  const activeCustomer = useMemo(() => {
    return enrichedCustomers.find(c => c.id === selectedCustomerId) || enrichedCustomers[0];
  }, [enrichedCustomers, selectedCustomerId]);

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(activeCustomer.ai.recommendedEmailDraft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleOpenModal = () => {
    if (activeCustomer.contacts.length > 0) {
      setNewContactId(activeCustomer.contacts[0].id);
    }
    setNewNotes('');
    setIsModalOpen(true);
  };

  // Submit handler: Adds interaction to timeline AND updates UI state with live Gemini response
  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotes.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const newEntry: Interaction = {
      id: `int_${Date.now()}`,
      customer_id: activeCustomer.id,
      contact_id: newContactId || activeCustomer.contacts[0]?.id || 'contact_001',
      type: newType,
      occurred_at: today,
      notes: newNotes.trim()
    };

    const updatedInteractions = [newEntry, ...allInteractions];
    setAllInteractions(updatedInteractions);
    setIsModalOpen(false);
    setIsAnalyzing(true);

    // Call live Next.js API Route Handler connected to Gemini 2.5
    try {
      const payload = {
        customer: activeCustomer,
        contacts: activeCustomer.contacts,
        interactions: updatedInteractions.filter(i => i.customer_id === activeCustomer.id)
      };

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const aiResult: CustomerInsights = await res.json();
        
        // Save the Gemini output into state to trigger an immediate live re-render
        setLiveAiInsights(prev => ({
          ...prev,
          [activeCustomer.id]: aiResult
        }));
      }
    } catch (err) {
      console.error('Gemini API analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-slate-900">PulseCRM</h1>
              <p className="text-xs text-slate-500 mt-0.5">AI Co-Pilot for Dental & Medical Practices</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium border border-indigo-100">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse mr-2"></span>
              {isAnalyzing ? 'Gemini 2.5 Analyzing...' : 'AI Attention Engine Active'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT PANEL: Action Queue & Relationships List */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Search & Filter Controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search practice, contact, or pain point..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    All ({enrichedCustomers.length})
                  </button>
                  <button 
                    onClick={() => setStatusFilter('prospect')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${statusFilter === 'prospect' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Prospects
                  </button>
                  <button 
                    onClick={() => setStatusFilter('customer')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${statusFilter === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Customers
                  </button>
                </div>
                <span className="text-slate-400">Sorted by AI Urgency</span>
              </div>
            </div>

            {/* AI Action Queue Cards */}
            <div className="space-y-2.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
              {filteredCustomers.map((cust) => {
                const isSelected = cust.id === activeCustomer.id;
                const isHighUrgency = cust.ai.attentionScore >= 80;
                
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected 
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/10 shadow-md' 
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-0.5 rounded-md font-semibold capitalize ${
                            cust.status === 'prospect' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {cust.status}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm">{cust.name}</h3>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{cust.ai.urgencyReason}</p>
                      </div>

                      {/* Attention Score Badge */}
                      <div className={`flex flex-col items-end justify-center px-2 py-1 rounded-lg border text-right min-w-[52px] ${
                        isHighUrgency 
                          ? 'bg-rose-50 border-rose-200 text-rose-700' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <span className="text-xs font-black leading-none">{cust.ai.attentionScore}</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider opacity-75">Score</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center text-slate-600 font-medium">
                        <UserIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {cust.contacts[0]?.name || 'No contact'}
                      </span>
                      <span className="flex items-center text-indigo-600 font-semibold group">
                        Review <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: AI Relationship Cockpit */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Header / Practice Info */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-slate-900">{activeCustomer.name}</h2>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                      activeCustomer.status === 'prospect' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {activeCustomer.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Relationship created {new Date(activeCustomer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleOpenModal}
                    className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-2 rounded-lg shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Interaction</span>
                  </button>

                  <div className="text-right border-l border-slate-200 pl-3">
                    <div className="text-xs text-slate-400 font-medium">Attention Score</div>
                    <div className="text-lg font-black text-rose-600">{activeCustomer.ai.attentionScore} / 100</div>
                  </div>
                </div>
              </div>

              {/* Contacts Pills */}
              <div className="flex flex-wrap gap-2">
                {activeCustomer.contacts.map(c => (
                  <div key={c.id} className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className="text-slate-400">({c.role})</span>
                    <a href={`mailto:${c.email}`} className="text-indigo-600 hover:underline ml-1">{c.email}</a>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Synthesized Intelligence Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between text-indigo-300 font-semibold text-xs uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>AI Relationship Summary</span>
                </div>
                {isAnalyzing && (
                  <span className="flex items-center text-indigo-300 text-xs normal-case lowercase">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" /> Generating Gemini Insights...
                  </span>
                )}
              </div>

              <p className="text-sm text-indigo-100 leading-relaxed">
                {activeCustomer.ai.summary}
              </p>

              {/* Extracted Pain Points */}
              <div className="space-y-2 pt-1">
                <span className="text-xs text-indigo-300 font-medium">Identified Key Friction / Opportunities:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeCustomer.ai.keyPainPoints.map((point, idx) => (
                    <span key={idx} className="bg-indigo-800/60 border border-indigo-700/50 text-indigo-200 text-xs px-2.5 py-1 rounded-md">
                      • {point}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Next Action Banner */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-lg flex items-center justify-between text-xs mt-3">
                <div className="flex items-center space-x-2.5">
                  <div className="bg-indigo-500 text-white p-1.5 rounded-md">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-indigo-200 font-medium">Recommended Action</div>
                    <div className="font-bold text-white text-xs">{activeCustomer.ai.suggestedAction}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* One-Click Action & Draft Generator */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>AI Generated Follow-Up Draft</span>
                </h3>
                <button
                  onClick={handleCopyDraft}
                  className="flex items-center space-x-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 transition-all"
                >
                  {copiedDraft ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{copiedDraft ? 'Copied to Clipboard!' : 'Copy Email Draft'}</span>
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {activeCustomer.ai.recommendedEmailDraft}
              </div>
            </div>

            {/* Timeline / Interaction History */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Interaction Timeline ({activeCustomer.interactions.length})</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activeCustomer.interactions.map((interaction) => {
                  const contact = CONTACTS.find(c => c.id === interaction.contact_id);

                  return (
                    <div key={interaction.id} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-slate-300 group-hover:border-indigo-600 flex items-center justify-center transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-indigo-600"></div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-lg space-y-1.5 hover:bg-slate-100/50 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 capitalize flex items-center space-x-1.5">
                            <TypeIcon type={interaction.type} />
                            <span>{interaction.type} with {contact?.name || 'Contact'}</span>
                          </span>
                          <span className="text-slate-400 font-mono">{interaction.occurred_at}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-normal">{interaction.notes}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* LOG INTERACTION MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Log Interaction</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddInteraction} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Practice</label>
                <input 
                  type="text" 
                  disabled 
                  value={activeCustomer.name} 
                  className="w-full bg-slate-100 border border-slate-200 text-slate-600 text-xs rounded-lg p-2.5 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact</label>
                <select 
                  value={newContactId} 
                  onChange={(e) => setNewContactId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {activeCustomer.contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Interaction Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['call', 'email', 'meeting', 'note'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`py-2 text-xs font-semibold rounded-lg capitalize border transition-all ${
                        newType === t 
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Interaction Notes</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="e.g. Spoke with Dr. Evans on the phone. Confirmed contract terms look good..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Save Interaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper icon components
function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'call': return <Phone className="w-3 h-3 text-indigo-500" />;
    case 'email': return <Mail className="w-3 h-3 text-sky-500" />;
    case 'meeting': return <Calendar className="w-3 h-3 text-emerald-500" />;
    default: return <FileText className="w-3 h-3 text-amber-500" />;
  }
}

function UserIcon({ className }: { className?: string }) {
  return <Users className={className} />;
}