"use client";

import React, { useState, useEffect } from 'react';
import {
    Globe,
    Plus,
    Search,
    Activity,
    CheckCircle2,
    Settings,
    User,
    LogOut,
    ExternalLink,
    X,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Types ---

interface Website {
    id: string;
    url: string;
    alias?: string;
    status: 'Up' | 'Down' | 'Unknown';
    responseTime: number;
    lastChecked: string;
}

export default function Dashboard() {
    const router = useRouter();
    const [websites, setWebsites] = useState<Website[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/signin');
            return;
        }

        fetchWebsites(token);
    }, [router]);

    const fetchWebsites = async (token: string) => {
        try {
            const response = await fetch('http://localhost:3001/websites', {
                headers: { 'Authorization': token }
            });

            if (response.ok) {
                const data = await response.json();
                setWebsites(data.websites);
            } else if (response.status === 403) {
                localStorage.removeItem('token');
                router.push('/signin');
            }
        } catch (err) {
            console.error('Failed to fetch websites:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddWebsite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUrl) return;

        setIsAdding(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:3001/website', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token || ''
                },
                body: JSON.stringify({ url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}` }),
            });

            if (response.ok) {
                setNewUrl('');
                setIsAddModalOpen(false);
                if (token) fetchWebsites(token);
            }
        } catch (err) {
            console.error('Failed to add website:', err);
        } finally {
            setIsAdding(false);
        }
    };

    const filteredWebsites = websites.filter(w =>
        w.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.alias && w.alias.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="animate-spin text-white/20" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 selection:text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full opacity-50" />
            </div>

            {/* Navigation Bar */}
            <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl px-6 md:px-12 py-4">
                <div className="max-w-[1400px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-8">
                        <a href="/" className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                <span className="font-bold text-black text-lg">B</span>
                            </div>
                            <span className="font-bold text-xl tracking-tight hidden md:block">BetterUptime</span>
                        </a>
                        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/50">
                            <a href="#" className="text-white">Dashboard</a>
                            <a href="#" className="hover:text-white transition-colors">Incident History</a>
                            <a href="#" className="hover:text-white transition-colors">Status Pages</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Quick search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 w-48 transition-all"
                            />
                        </div>
                        <button className="p-2 text-white/50 hover:text-white transition-colors">
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                router.push('/signin');
                            }}
                            className="p-2 text-white/50 hover:text-white transition-colors"
                        >
                            <LogOut size={20} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/10">
                            <User size={16} />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1400px] mx-auto p-6 md:p-12 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-white/40 text-sm font-medium">
                            <span>Overview</span>
                            <ChevronRight size={14} />
                            <span className="text-white/60">Monitors</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">Better<br className="md:hidden" />Uptime</h1>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-white text-black px-8 py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 w-fit shadow-xl shadow-white/10"
                    >
                        <Plus size={18} />
                        Add Website
                    </button>
                </div>

                {/* Monitors Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {filteredWebsites.map((site) => (
                        <div key={site.id} className="group relative">
                            {/* Card Body */}
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 md:p-10 transition-all duration-500 hover:border-white/20 hover:bg-[#0c0c0c] flex flex-col gap-10">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className={`text-3xl md:text-4xl font-bold tracking-tight text-white transition-colors ${site.status === 'Up' ? 'group-hover:text-emerald-400' : 'group-hover:text-rose-500'}`}>{site.alias || new URL(site.url).hostname}</h3>
                                        <a href={site.url} target="_blank" className={`text-sm font-medium opacity-60 hover:opacity-100 flex items-center gap-1 transition-all ${site.status === 'Up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {site.url}
                                            <ExternalLink size={12} className="opacity-50" />
                                        </a>
                                    </div>
                                    <div className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border ${site.status === 'Up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                        {site.status}
                                    </div>
                                </div>

                                {/* Details Box (The requested design) */}
                                <div className="bg-black/40 border border-white/5 rounded-2xl p-8 grid grid-cols-2 gap-8 ring-1 ring-white/5">
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-white/30 uppercase tracking-widest">Response Time</p>
                                        <p className="text-4xl font-bold text-white tracking-tighter">
                                            {site.responseTime > 0 ? `${site.responseTime}ms` : '—'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-white/30 uppercase tracking-widest">Last Check</p>
                                        <div className="text-xl font-bold text-white leading-tight">
                                            <p>{new Date(site.lastChecked).toLocaleDateString()}</p>
                                            <p className="text-white/40">{new Date(site.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Indicators */}
                                <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">
                                    <div className="flex items-center gap-4">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={`w-1 h-3 rounded-full ${site.status === 'Up' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            ))}
                                        </div>
                                        <span>Real-time Health</span>
                                    </div>
                                    <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                                        <button className="hover:text-white">Settings</button>
                                        <button className="hover:text-white">Logs</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Placeholder */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="border-2 border-dashed border-white/5 rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 group hover:border-white/20 hover:bg-white/[0.02] transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold uppercase tracking-widest text-[10px] text-white/20 group-hover:text-white/60 transition-colors">Start monitoring a new coordinate</span>
                    </button>
                </div>
            </main>

            {/* Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl z-10 animate-fade-in-up">
                        <div className="p-10 space-y-8">
                            <div className="flex justify-between items-center">
                                <h3 className="text-3xl font-bold tracking-tight">New Monitor</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleAddWebsite} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">Universal Resource Locator</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="https://app.betteruptime.com"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-lg"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isAdding}
                                    className="w-full bg-white text-black font-bold py-5 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-white/10 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isAdding ? <Loader2 className="animate-spin" size={24} /> : 'Launch Monitor'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
