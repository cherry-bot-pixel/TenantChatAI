import React, { useState } from 'react';
import { User, Tenant, DemoAccount } from '../types';
import { Shield, Building2, UserCircle, LogOut, Lock, Terminal, ShieldAlert, Sparkles, MessageSquare, FileText, CheckCircle2, ChevronDown, Radio } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  tenant: Tenant | null;
  activeTab: 'chat' | 'documents' | 'security' | 'admin';
  setActiveTab: (tab: 'chat' | 'documents' | 'security' | 'admin') => void;
  onLogout: () => void;
  demoAccounts: DemoAccount[];
  onQuickSwitch: (email: string, password: string) => void;
  onOpenGuide: () => void;
  onOpenVoice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  tenant,
  activeTab,
  setActiveTab,
  onLogout,
  demoAccounts,
  onQuickSwitch,
  onOpenGuide,
  onOpenVoice,
}) => {
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  TENANT<span className="text-cyan-400">AI</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>VAULT ACTIVE</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Multi-Tenant Corporate AI Gateway • Zero Leakage
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AI Workspace</span>
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'documents'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Company Documents</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'security'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-blue-300 hover:bg-slate-850'
                }`}
              >
                <ShieldCheckIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Isolation & Security</span>
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                    activeTab === 'admin'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/30'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>SecOps Admin</span>
                </button>
              )}
            </nav>
          )}

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Real-Time Live Voice Button */}
            {user && (
              <button
                onClick={onOpenVoice}
                className="text-xs bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 px-2.5 sm:px-3 py-1.5 rounded-xl border border-cyan-800/80 flex items-center space-x-1.5 transition-colors shadow-sm"
                title="Start real-time voice conversation using gemini-3.8-live"
              >
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline font-semibold">Live Voice</span>
              </button>
            )}

            {/* Hackathon Guide Modal for Judges */}
            <button
              onClick={onOpenGuide}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-medium">Guide</span>
            </button>

            {/* Active Tenant Badge with 1-Click Company Switcher */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
                  className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-750 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-left transition-all group"
                  title="Click to switch between companies to verify tenant isolation"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${user.role === 'admin' ? 'bg-purple-400' : 'bg-emerald-400'} animate-pulse`} />
                  <div className="max-w-[120px] sm:max-w-[150px] truncate">
                    <span className="font-semibold text-slate-100 block truncate">
                      {tenant ? tenant.name : (user.role === 'admin' ? 'SecOps Auditor' : user.tenantId)}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">{user.email}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform" />
                </button>

                {/* Switch Workspace Dropdown */}
                {showSwitchDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-2 z-50 text-xs">
                    <div className="px-3 py-2 font-semibold text-slate-300 text-[11px] uppercase tracking-wider border-b border-slate-800 flex justify-between items-center">
                      <span>Switch Company Vault</span>
                      <span className="text-cyan-400 text-[10px] font-mono">1-Click Test</span>
                    </div>
                    <div className="p-1.5 text-[11px] text-slate-400 leading-tight">
                      Instantly change your active company to verify that documents and chats do not leak across boundaries:
                    </div>
                    <div className="py-1 space-y-1">
                      {demoAccounts.map((acc) => {
                        const isCurrent = user.email === acc.email;
                        return (
                          <button
                            key={acc.email}
                            onClick={() => {
                              onQuickSwitch(acc.email, acc.password);
                              setShowSwitchDropdown(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors ${
                              isCurrent ? 'bg-slate-800/80 border border-cyan-500/40 text-cyan-300' : 'text-slate-200'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-semibold block truncate">{acc.tenantName}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{acc.email}</span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono shrink-0 ${
                              acc.role === 'admin' ? 'bg-purple-900/60 text-purple-300' : 'bg-slate-950 text-slate-400'
                            }`}>
                              {acc.role}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center px-1">
                      <span className="text-[10px] text-slate-500">Bound to session token</span>
                      <button
                        onClick={onLogout}
                        className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 font-semibold"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar (Ensures mobile/tablet users never get stuck!) */}
        {user && (
          <div className="flex md:hidden border-t border-slate-800/80 py-1.5 overflow-x-auto space-x-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'chat'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AI Workspace
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'documents'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'security'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Isolation & Security
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-purple-400'
                }`}
              >
                Admin Console
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
