import React, { useState } from 'react';
import { DemoAccount, User, Tenant } from '../types';
import { Shield, Lock, Building, Mail, Key, ArrowRight, UserCheck, Sparkles, CheckCircle2, ShieldCheck, Cpu, Database, Eye } from 'lucide-react';

interface LoginModalProps {
  demoAccounts: DemoAccount[];
  onLogin: (email: string, password: string) => Promise<boolean>;
  onGoogleSignIn: () => Promise<boolean>;
  onRegisterTenant: (data: {
    tenantName: string;
    companyDomain: string;
    adminEmail: string;
    adminName: string;
    password: string;
  }) => Promise<boolean>;
  onDirectSession?: (token: string, user: User, tenant: Tenant | null) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  demoAccounts,
  onLogin,
  onGoogleSignIn,
  onRegisterTenant,
  onDirectSession,
}) => {
  const [tab, setTab] = useState<'quick' | 'login' | 'register'>('quick');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Register Form State
  const [tenantName, setTenantName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleSelectDemo = async (acc: DemoAccount) => {
    setError(null);
    setLoadingAccount(acc.email);
    setLoading(true);
    const success = await onLogin(acc.email, acc.password);
    setLoading(false);
    setLoadingAccount(null);
    if (!success) {
      setError(`Could not connect as ${acc.tenantName}. Please try again.`);
    }
  };

  const handleDirectOwnerLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: 'u-google-hadassa',
          email: 'hadassabellam78@gmail.com',
          displayName: 'Hadassa (Project Owner)',
          targetTenantId: 'acme-corp',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('tenant_ai_token', data.token);
        if (onDirectSession) {
          onDirectSession(data.token, data.user, data.tenant);
        } else {
          await onLogin('alice@acme.com', 'acme123');
        }
      } else {
        setError('Failed to establish session.');
      }
    } catch {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const success = await onLogin(email, password);
    setLoading(false);
    if (!success) {
      setError('Invalid email or password. You can also pick any 1-Click profile below.');
    }
  };

  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!tenantName || !adminEmail || !regPassword) {
      setError('Company name, admin email, and password are required.');
      return;
    }
    setLoading(true);
    const success = await onRegisterTenant({
      tenantName,
      companyDomain,
      adminEmail,
      adminName,
      password: regPassword,
    });
    setLoading(false);
    if (!success) {
      setError('Registration failed. A tenant or user with these details may already exist.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand & Security Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10 mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/20 mb-3 border border-cyan-400/30">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          TENANT <span className="text-cyan-400">AI</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-300 font-medium">
          Secure Multi-Tenant AI Platform with Cryptographic Partitioning
        </p>
        <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Zero Cross-Company Leakage Guarantee</span>
          <span className="text-slate-600">•</span>
          <span className="text-cyan-400">Data-Layer Enforcement</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 shadow-2xl rounded-2xl sm:rounded-3xl">

          {/* Navigation Pill Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              onClick={() => { setTab('quick'); setError(null); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                tab === 'quick'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-Click Test Entrance</span>
            </button>
            <button
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In (Custom)
            </button>
            <button
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Company
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
              <span className="font-bold">Notice:</span>
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: 1-CLICK INSTANT TEST ENTRANCE (Solves friction & makes user feel comfortable) */}
          {tab === 'quick' && (
            <div className="space-y-4">
              <div className="text-center mb-1">
                <h3 className="text-sm font-semibold text-slate-200">
                  Select a Company to Enter Its Isolated AI Vault
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-configured with distinct company documents, policies, and role permissions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Acme Corp */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectDemo({
                    email: 'alice@acme.com',
                    password: 'acme123',
                    role: 'manager',
                    tenantName: 'Acme Corporation',
                    tenantId: 'acme-corp'
                  })}
                  className="p-3.5 rounded-2xl border border-blue-900/60 bg-blue-950/20 hover:bg-blue-900/30 hover:border-blue-500/50 text-left transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-blue-300 flex items-center space-x-1.5">
                      <span>🏢 Acme Corp</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200 font-mono">
                      LOGISTICS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    Autonomous Glider Project Falcon & Corporate Travel Policies.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-blue-900/40 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">alice@acme.com</span>
                    <span className="text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                      {loadingAccount === 'alice@acme.com' ? 'Entering...' : 'Enter Vault →'}
                    </span>
                  </div>
                </button>

                {/* Globex Robotics */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectDemo({
                    email: 'charlie@globex.com',
                    password: 'globex123',
                    role: 'member',
                    tenantName: 'Globex Robotics',
                    tenantId: 'globex-robotics'
                  })}
                  className="p-3.5 rounded-2xl border border-emerald-900/60 bg-emerald-950/20 hover:bg-emerald-900/30 hover:border-emerald-500/50 text-left transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-emerald-300 flex items-center space-x-1.5">
                      <span>🤖 Globex Robotics</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 font-mono">
                      ROBOTICS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    G-700 Welder Bot Safety Interlock & Hydraulic Manuals.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-emerald-900/40 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">charlie@globex.com</span>
                    <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                      {loadingAccount === 'charlie@globex.com' ? 'Entering...' : 'Enter Vault →'}
                    </span>
                  </div>
                </button>

                {/* Stark Energy Labs */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectDemo({
                    email: 'tony@stark.com',
                    password: 'stark123',
                    role: 'manager',
                    tenantName: 'Stark Energy Labs',
                    tenantId: 'stark-labs'
                  })}
                  className="p-3.5 rounded-2xl border border-amber-900/60 bg-amber-950/20 hover:bg-amber-900/30 hover:border-amber-500/50 text-left transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-amber-300 flex items-center space-x-1.5">
                      <span>⚡ Stark Labs</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200 font-mono">
                      CLEAN ENERGY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    Arc Plasma Reactor specifications & containment specs.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-amber-900/40 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">tony@stark.com</span>
                    <span className="text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                      {loadingAccount === 'tony@stark.com' ? 'Entering...' : 'Enter Vault →'}
                    </span>
                  </div>
                </button>

                {/* SecOps Auditor */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectDemo({
                    email: 'admin@tenantai.security',
                    password: 'admin123',
                    role: 'admin',
                    tenantName: 'System Auditor',
                    tenantId: 'system'
                  })}
                  className="p-3.5 rounded-2xl border border-purple-900/60 bg-purple-950/20 hover:bg-purple-900/30 hover:border-purple-500/50 text-left transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-purple-300 flex items-center space-x-1.5">
                      <span>🛡️ SecOps Admin</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 font-mono">
                      ADMIN AUDIT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    Multi-tenant telemetry, immutable audit logs & tenant management.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-purple-900/40 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">admin@tenantai...</span>
                    <span className="text-purple-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                      {loadingAccount === 'admin@tenantai.security' ? 'Entering...' : 'Enter Console →'}
                    </span>
                  </div>
                </button>
              </div>

              {/* Direct Access for Project Owner */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDirectOwnerLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-cyan-700/60 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Direct 1-Click Access as Owner (hadassabellam78@gmail.com)</span>
                </button>
              </div>

              {/* Reassuring Security Highlights */}
              <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>How Tenant AI Protects Your Organization:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Server-side isolation</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Grounded RAG citations</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Encrypted session tokens</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Real-time SecOps audit log</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Corporate Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. alice@acme.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="px-2 bg-slate-900 text-slate-500 uppercase">Or use Google Firebase</span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  const success = await onGoogleSignIn();
                  setLoading(false);
                  if (!success) {
                    setError('Google sign-in popup was blocked in this iframe. Click "1-Click Test Entrance" tab above for immediate access.');
                  }
                }}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center space-x-2.5 transition-all shadow-md disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google Account</span>
              </button>
            </form>
          )}

          {/* TAB 3: REGISTER NEW TENANT */}
          {tab === 'register' && (
            <form onSubmit={handleSubmitRegister} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    required
                    placeholder="e.g. Apex BioTech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company Domain</label>
                  <input
                    type="text"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    placeholder="apexbio.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Full Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Dr. Sarah Connor"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email *</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder="admin@apexbio.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Password *</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  placeholder="Set strong password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                🔒 A dedicated, cryptographic database partition will be provisioned instantly with zero cross-tenant contamination.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? 'Creating Tenant Vault...' : 'Provision Tenant Workspace'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
