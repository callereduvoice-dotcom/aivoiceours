"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Phone, Upload, Play, Pause, BarChart3, Settings, 
  Users, FileText, Activity, Plus, X, CheckCircle, 
  AlertCircle, Loader2, Send, Database
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// NEO-BRUTALIST DESIGN SYSTEM
// ─────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#FF6B35',    // Bold Orange
  secondary: '#2EC4B6', // Teal
  accent: '#FFBE0B',    // Yellow
  dark: '#1A1A1A',      // Near Black
  light: '#FAFAFA',     // Off White
  error: '#EF476F',     // Pink Red
  success: '#06D6A0',   // Green
  purple: '#9B5DE5',   // Purple
};

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  phone: string;
  name: string;
  status: 'pending' | 'called' | 'connected' | 'failed';
  language: string;
}

interface Campaign {
  id: string;
  name: string;
  totalLeads: number;
  completed: number;
  successRate: number;
  status: 'active' | 'paused' | 'completed';
}

interface Stats {
  totalCalls: number;
  successRate: number;
  avgDuration: number;
  activeCampaigns: number;
}

// ─────────────────────────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function dispatchCall(phone: string, name: string, language: string = 'hi-IN') {
  const res = await fetch(`${API_BASE}/api/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, lead_name: name, language })
  });
  return res.json();
}

async function uploadLeads(file: File): Promise<Lead[]> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE}/api/leads/upload`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}

async function getLeads(): Promise<Lead[]> {
  const res = await fetch(`${API_BASE}/api/leads`);
  const data = await res.json();
  return data.leads || [];
}

async function getStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/api/stats`);
  return res.json();
}

async function createCampaign(name: string, leadIds: string[]): Promise<Campaign> {
  const res = await fetch(`${API_BASE}/api/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, contacts: leadIds.map(id => ({ phone: id })) })
  });
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  return (
    <div className="relative overflow-hidden bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-150">
      <div className="absolute top-0 right-0 w-16 h-16" style={{ backgroundColor: color }} />
      <div className="relative z-10">
        <Icon className="w-8 h-8 mb-2" style={{ color }} />
        <div className="text-4xl font-black tracking-tight">{value}</div>
        <div className="text-sm font-bold uppercase tracking-wider mt-1 text-gray-600">{label}</div>
      </div>
    </div>
  );
}

function Button({ children, onClick, variant = 'primary', disabled = false, className = '' }: any) {
  const baseStyles = "px-6 py-3 font-black uppercase tracking-wider border-4 border-black transition-all duration-150 disabled:opacity-50";
  const variants: any = {
    primary: `bg-[${COLORS.primary}] text-white hover:bg-orange-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`,
    secondary: `bg-[${COLORS.secondary}] text-white hover:bg-teal-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`,
    outline: "bg-white hover:bg-gray-100",
    danger: `bg-[${COLORS.error}] text-white`,
  };
  
  const variantStyle = variants[variant] || variants.primary;
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variantStyle} ${className}`}
    >
      {children}
    </button>
  );
}

function Input({ label, type = 'text', placeholder, value, onChange, required = false }: any) {
  return (
    <div className="space-y-2">
      <label className="block font-bold uppercase tracking-wider text-sm">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 bg-white border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400"
      />
    </div>
  );
}

function Select({ label, options, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="block font-bold uppercase tracking-wider text-sm">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-white border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'campaigns' | 'test'>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCalls: 0, successRate: 0, avgDuration: 0, activeCampaigns: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Test Call State
  const [testPhone, setTestPhone] = useState('');
  const [testName, setTestName] = useState('');
  const [testLanguage, setTestLanguage] = useState('hi-IN');
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Campaign State
  const [campaignName, setCampaignName] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [leadsData, statsData] = await Promise.all([
        getLeads().catch(() => []),
        getStats().catch(() => ({ totalCalls: 0, successRate: 0, avgDuration: 0, activeCampaigns: 0 }))
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }

  async function handleTestCall() {
    if (!testPhone) {
      setMessage({ type: 'error', text: 'Phone number required' });
      return;
    }
    
    setTestStatus('loading');
    setMessage({ type: '', text: '' });
    
    try {
      const result = await dispatchCall(testPhone, testName || 'User', testLanguage);
      if (result.status === 'dispatched') {
        setTestStatus('success');
        setMessage({ type: 'success', text: `Call dispatched to ${testPhone}` });
      } else {
        setTestStatus('error');
        setMessage({ type: 'error', text: result.error || 'Call failed' });
      }
    } catch (err: any) {
      setTestStatus('error');
      setMessage({ type: 'error', text: err.message || 'Network error' });
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const newLeads = await uploadLeads(file);
      setLeads([...leads, ...newLeads]);
      setMessage({ type: 'success', text: `${newLeads.length} leads uploaded!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setLoading(false);
    }
  }

  async function handleStartCampaign() {
    if (!campaignName || selectedLeads.length === 0) {
      setMessage({ type: 'error', text: 'Campaign name and leads required' });
      return;
    }
    
    setLoading(true);
    try {
      await createCampaign(campaignName, selectedLeads);
      setMessage({ type: 'success', text: 'Campaign started!' });
      setCampaignName('');
      setSelectedLeads([]);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Campaign failed' });
    } finally {
      setLoading(false);
    }
  }

  function toggleLeadSelection(phone: string) {
    setSelectedLeads(prev => 
      prev.includes(phone) 
        ? prev.filter(p => p !== phone)
        : [...prev, phone]
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.light }}>
      {/* HEADER */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">
              <span style={{ color: COLORS.primary }}>AI</span>Voice
              <span className="bg-black text-white px-2 ml-2 text-sm">INDIA</span>
            </h1>
          </div>
          
          <nav className="flex gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'leads', label: 'Leads', icon: Users },
              { id: 'campaigns', label: 'Campaigns', icon: Send },
              { id: 'test', label: 'Test Call', icon: Phone },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 font-bold border-4 border-black transition-all ${
                  activeTab === tab.id 
                    ? 'bg-black text-white' 
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* MESSAGE TOAST */}
      {message.text && (
        <div className="fixed top-24 right-4 z-50 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-right">
          <div className={`flex items-center gap-2 font-bold ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black mb-2">DASHBOARD</h2>
              <p className="font-bold text-gray-600">Your AI Voice Agent Overview</p>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={Phone} label="Total Calls" value={stats.totalCalls} color={COLORS.primary} />
              <StatCard icon={CheckCircle} label="Success Rate" value={`${stats.successRate}%`} color={COLORS.success} />
              <StatCard icon={Activity} label="Avg Duration" value={`${stats.avgDuration}s`} color={COLORS.secondary} />
              <StatCard icon={Send} label="Active Campaigns" value={stats.activeCampaigns} color={COLORS.purple} />
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                  <Plus className="w-6 h-6" style={{ color: COLORS.primary }} />
                  QUICK TEST CALL
                </h3>
                <div className="space-y-4">
                  <Input 
                    label="Phone Number" 
                    placeholder="+919686868973"
                    value={testPhone}
                    onChange={(e: any) => setTestPhone(e.target.value)}
                  />
                  <Input 
                    label="Lead Name" 
                    placeholder="John Doe"
                    value={testName}
                    onChange={(e: any) => setTestName(e.target.value)}
                  />
                  <Select
                    label="Language"
                    options={[
                      { value: 'hi-IN', label: 'Hindi' },
                      { value: 'ta-IN', label: 'Tamil' },
                      { value: 'te-IN', label: 'Telugu' },
                      { value: 'kn-IN', label: 'Kannada' },
                      { value: 'bn-IN', label: 'Bengali' },
                      { value: 'en-IN', label: 'English' },
                    ]}
                    value={testLanguage}
                    onChange={(e: any) => setTestLanguage(e.target.value)}
                  />
                  <Button onClick={handleTestCall} disabled={testStatus === 'loading'}>
                    {testStatus === 'loading' ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> CALLING...
                      </span>
                    ) : (
                      'INITIATE CALL'
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                  <Upload className="w-6 h-6" style={{ color: COLORS.secondary }} />
                  UPLOAD LEADS
                </h3>
                <div className="space-y-4">
                  <div className="border-4 border-dashed border-black p-8 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                       onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="font-bold">Drop CSV file here</p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                    <p className="text-xs text-gray-400 mt-2">Format: phone, name, language</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="text-sm font-bold">
                    {leads.length} leads loaded
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEADS TAB */}
        {activeTab === 'leads' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black mb-2">LEADS</h2>
                <p className="font-bold text-gray-600">{leads.length} contacts loaded</p>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                  <Upload className="w-5 h-5" /> UPLOAD CSV
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* LEADS TABLE */}
            <div className="bg-white border-4 border-black">
              <div className="grid grid-cols-12 border-b-4 border-black bg-black text-white font-bold p-4">
                <div className="col-span-1">SELECT</div>
                <div className="col-span-3">PHONE</div>
                <div className="col-span-3">NAME</div>
                <div className="col-span-2">LANGUAGE</div>
                <div className="col-span-3">STATUS</div>
              </div>
              
              {leads.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-bold text-gray-500">No leads loaded</p>
                  <p className="text-sm text-gray-400">Upload a CSV to get started</p>
                </div>
              ) : (
                leads.map((lead, idx) => (
                  <div key={idx} className={`grid grid-cols-12 border-b-2 border-gray-200 p-4 items-center ${
                    selectedLeads.includes(lead.phone) ? 'bg-yellow-50' : ''
                  }`}>
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.phone)}
                        onChange={() => toggleLeadSelection(lead.phone)}
                        className="w-5 h-5 border-4 border-black"
                      />
                    </div>
                    <div className="col-span-3 font-mono font-bold">{lead.phone}</div>
                    <div className="col-span-3 font-bold">{lead.name}</div>
                    <div className="col-span-2">
                      <span className="bg-black text-white px-2 py-1 text-xs font-bold">
                        {lead.language}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${
                        lead.status === 'connected' ? 'bg-green-400' :
                        lead.status === 'called' ? 'bg-blue-400' :
                        lead.status === 'failed' ? 'bg-red-400' : 'bg-gray-200'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CAMPAIGNS TAB */}
        {activeTab === 'campaigns' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black mb-2">CAMPAIGNS</h2>
              <p className="font-bold text-gray-600">Manage your outbound campaigns</p>
            </div>

            {/* CREATE CAMPAIGN */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black mb-4">CREATE NEW CAMPAIGN</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Campaign Name"
                  placeholder="e.g., Summer Admission Drive"
                  value={campaignName}
                  onChange={(e: any) => setCampaignName(e.target.value)}
                />
                <div className="flex items-end">
                  <Button 
                    onClick={handleStartCampaign} 
                    disabled={loading || selectedLeads.length === 0}
                    className="w-full"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      START CAMPAIGN ({selectedLeads.length} leads)
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* SELECTED LEADS */}
            {selectedLeads.length > 0 && (
              <div className="bg-yellow-50 border-4 border-black p-6">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" style={{ color: COLORS.accent }} />
                  {selectedLeads.length} LEADS SELECTED
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedLeads.slice(0, 10).map(phone => (
                    <span key={phone} className="bg-black text-white px-3 py-1 font-bold text-sm">
                      {phone}
                    </span>
                  ))}
                  {selectedLeads.length > 10 && (
                    <span className="bg-gray-300 px-3 py-1 font-bold text-sm">
                      +{selectedLeads.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TEST CALL TAB */}
        {activeTab === 'test' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black mb-2">TEST CALL</h2>
              <p className="font-bold text-gray-600">Make a single test call to verify setup</p>
            </div>

            <div className="max-w-xl">
              <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="space-y-6">
                  <Input
                    label="Phone Number (with country code)"
                    placeholder="+919686868973"
                    value={testPhone}
                    onChange={(e: any) => setTestPhone(e.target.value)}
                  />
                  
                  <Input
                    label="Lead Name"
                    placeholder="Test User"
                    value={testName}
                    onChange={(e: any) => setTestName(e.target.value)}
                  />
                  
                  <Select
                    label="Language"
                    options={[
                      { value: 'hi-IN', label: 'Hindi (हिंदी)' },
                      { value: 'ta-IN', label: 'Tamil (தமிழ்)' },
                      { value: 'te-IN', label: 'Telugu (తెలుగు)' },
                      { value: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)' },
                      { value: 'bn-IN', label: 'Bengali (বাংলা)' },
                      { value: 'mr-IN', label: 'Marathi (मराठी)' },
                      { value: 'en-IN', label: 'English' },
                    ]}
                    value={testLanguage}
                    onChange={(e: any) => setTestLanguage(e.target.value)}
                  />

                  <Button 
                    onClick={handleTestCall} 
                    disabled={testStatus === 'loading'}
                    className="w-full text-lg"
                  >
                    {testStatus === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" /> CONNECTING...
                      </span>
                    ) : (
                      '🚀 INITIATE TEST CALL'
                    )}
                  </Button>

                  {message.text && (
                    <div className={`p-4 border-4 border-black font-bold text-center ${
                      message.type === 'success' ? 'bg-green-400' : 'bg-red-400'
                    }`}>
                      {message.text}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 p-6 bg-black text-white border-4 border-black">
                <h4 className="font-black text-lg mb-2">TEST NUMBER:</h4>
                <p className="font-mono text-2xl">+919686868973</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t-4 border-black bg-black text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <p className="font-black text-xl">
              <span style={{ color: COLORS.primary }}>AI</span>Voice India
            </p>
            <p className="text-sm text-gray-400">Powered by Sarvam AI + LiveKit</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm">11 Indian Languages Supported</p>
            <p className="text-xs text-gray-500">Hindi • Tamil • Telugu • Kannada • Bengali • Marathi • Gujarati • Malayalam • Punjabi • Odia • English</p>
          </div>
        </div>
      </footer>
    </div>
  );
}