import React, { useState, useEffect } from 'react';
import { User, Tenant, DemoAccount, DocumentItem, ChatMessage, MessageCitation, AttackTestResult, ModelOption, RolePersona, SearchGroundingSource } from './types';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { ChatView } from './components/ChatView';
import { DocumentsView } from './components/DocumentsView';
import { SecurityLabView } from './components/SecurityLabView';
import { AdminView } from './components/AdminView';
import { HackathonGuideModal } from './components/HackathonGuideModal';
import { VoiceModal } from './components/VoiceModal';
import { auth, googleProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('tenant_ai_token'));
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'security' | 'admin'>('chat');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // 1. Fetch AI status & demo accounts on startup
  useEffect(() => {
    const initialize = async () => {
      try {
        const [demoRes] = await Promise.all([
          fetch('/api/auth/demo-accounts'),
        ]);

        if (demoRes.ok) {
          const dData = await demoRes.json();
          setDemoAccounts(dData.accounts || []);
        }
      } catch (err) {
        console.warn('Initial telemetry check:', err);
      }

      // Check current session
      const savedToken = localStorage.getItem('tenant_ai_token');
      if (savedToken) {
        try {
          const meRes = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            setUser(meData.user);
            setTenant(meData.tenant);
          } else {
            localStorage.removeItem('tenant_ai_token');
            setToken(null);
          }
        } catch {
          localStorage.removeItem('tenant_ai_token');
          setToken(null);
        }
      }
      setLoadingInitial(false);
    };

    initialize();
  }, []);

  // 2. Fetch documents when user is authenticated
  const fetchDocuments = async () => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    if (!currentToken) return;

    try {
      const res = await fetch('/api/documents', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  // Auth Operations
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('tenant_ai_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setTenant(data.tenant);
        if (data.user.role === 'admin') {
          setActiveTab('admin');
        } else {
          setActiveTab('chat');
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  // Google Sign-In with Firebase Auth
  const handleGoogleSignIn = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (!fbUser || !fbUser.email) return false;

      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email.split('@')[0],
          photoURL: fbUser.photoURL || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('tenant_ai_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setTenant(data.tenant);
        setActiveTab('chat');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Google Sign-In error:', err);
      return false;
    }
  };

  const handleSwitchWorkspace = async (targetTenantId: string) => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ tenantId: targetTenantId }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setTenant(data.tenant);
        fetchDocuments();
      }
    } catch (err) {
      console.error('Switch workspace error:', err);
    }
  };

  const handleRegisterTenant = async (data: {
    tenantName: string;
    companyDomain: string;
    adminEmail: string;
    adminName: string;
    password: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        // Auto-login after registration
        return await handleLogin(data.adminEmail, data.password);
      }
      return false;
    } catch (err) {
      console.error('Registration error:', err);
      return false;
    }
  };

  const handleLogout = async () => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.removeItem('tenant_ai_token');
    setToken(null);
    setUser(null);
    setTenant(null);
    setDocuments([]);
  };

  const handleQuickSwitch = async (email: string, pass: string) => {
    await handleLogin(email, pass);
  };

  // Document Operations
  const handleUploadDocument = async (data: {
    title: string;
    fileName: string;
    content: string;
  }): Promise<boolean> => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteDocument = async (id: string): Promise<boolean> => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        fetchDocuments();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Chat Operations
  const handleSendMessage = async (params: {
    text: string;
    model: ModelOption;
    rolePersona: RolePersona;
    enableSearch: boolean;
    conversationId?: string;
  }) => {
    let currentToken = localStorage.getItem('tenant_ai_token');
    try {
      let res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          message: params.text,
          model: params.model,
          rolePersona: params.rolePersona,
          enableSearch: params.enableSearch,
          forceMockAI: params.model === 'mock',
          conversationId: params.conversationId,
        }),
      });

      // If token expired, auto-refresh session if demo account
      if (res.status === 401 && user) {
        const loginSuccess = await handleLogin(user.email, user.tenantId.includes('globex') ? 'globex123' : user.tenantId.includes('stark') ? 'stark123' : user.role === 'admin' ? 'admin123' : 'acme123');
        if (loginSuccess) {
          currentToken = localStorage.getItem('tenant_ai_token');
          res = await fetch('/api/chat/message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentToken}`,
            },
            body: JSON.stringify({
              message: params.text,
              model: params.model,
              rolePersona: params.rolePersona,
              enableSearch: params.enableSearch,
              forceMockAI: params.model === 'mock',
              conversationId: params.conversationId,
            }),
          });
        }
      }

      if (res.ok) {
        const data = await res.json();
        return {
          conversationId: data.conversationId,
          userMessage: data.userMessage,
          assistantMessage: data.assistantMessage,
          citations: data.citations,
          groundingSources: data.groundingSources,
        };
      }
      const errData = await res.json().catch(() => ({}));
      return {
        error: errData.error || 'Server returned an error',
        userMessage: { id: 'err-u', role: 'user' as const, content: params.text, timestamp: new Date().toISOString() },
        assistantMessage: { id: 'err-a', role: 'assistant' as const, content: 'Connection temporarily interrupted. Switching to local mock engine.', timestamp: new Date().toISOString() }
      };
    } catch (err: any) {
      console.error('Chat error:', err);
      return {
        error: err.message || 'Network error',
        userMessage: { id: 'err-u', role: 'user' as const, content: params.text, timestamp: new Date().toISOString() },
        assistantMessage: { id: 'err-a', role: 'assistant' as const, content: 'Network timeout. Please retry.', timestamp: new Date().toISOString() }
      };
    }
  };

  // Security Penetration Test Operations
  const handleRunAttack = async (params: {
    attackType: string;
    targetDocumentId?: string;
    spoofedTenantId?: string;
    crossTenantConvId?: string;
  }): Promise<AttackTestResult | null> => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/security/test-attack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(params),
      });

      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error('Attack test error:', err);
      return null;
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-wider font-semibold">Initializing Tenant AI Gateway...</span>
        </div>
      </div>
    );
  }

  // If not logged in, show Auth / Login View
  if (!user) {
    return (
      <>
        <LoginModal
          demoAccounts={demoAccounts}
          onLogin={handleLogin}
          onGoogleSignIn={handleGoogleSignIn}
          onRegisterTenant={handleRegisterTenant}
          onDirectSession={(tok, u, t) => {
            setToken(tok);
            setUser(u);
            setTenant(t);
            if (u.role === 'admin') setActiveTab('admin');
            else setActiveTab('chat');
          }}
        />
        <HackathonGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header
        user={user}
        tenant={tenant}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        demoAccounts={demoAccounts}
        onQuickSwitch={handleQuickSwitch}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatView
            user={user}
            tenant={tenant}
            onSendMessage={handleSendMessage}
            onOpenVoice={() => setIsVoiceOpen(true)}
            onSwitchWorkspace={handleSwitchWorkspace}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            user={user}
            tenant={tenant}
            documents={documents}
            onUpload={handleUploadDocument}
            onDelete={handleDeleteDocument}
            onRefresh={fetchDocuments}
          />
        )}

        {activeTab === 'security' && (
          <SecurityLabView
            user={user}
            tenant={tenant}
            onRunAttack={handleRunAttack}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            user={user}
            onRefresh={() => {}}
          />
        )}
      </main>

      <HackathonGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        user={user}
        tenant={tenant}
      />
    </div>
  );
}
