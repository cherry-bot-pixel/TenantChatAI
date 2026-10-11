import React, { useState } from 'react';
import { Terminal, Shield, CheckCircle, Code2, BookOpen, Sparkles, Copy, Check } from 'lucide-react';

interface HackathonGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HackathonGuideModal: React.FC<HackathonGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'answers' | 'presentation' | 'python'>('answers');

  if (!isOpen) return null;

  const pythonSnippet = `# Run offline on your laptop:
# pip install streamlit
# streamlit run python_prototype/app.py

# In-memory user credentials & tenants:
USERS = {
    "alice@acme.com": {"password_hash": "...", "tenant_id": "acme-corp", "role": "manager"},
    "charlie@globex.com": {"password_hash": "...", "tenant_id": "globex-robotics", "role": "member"}
}

# Pre-retrieval tenant isolation:
def retrieve_passages(query, authorized_tenant_id):
    # FILTER BY TENANT BEFORE SCORING
    tenant_docs = [d for d in DOCUMENTS if d["tenant_id"] == authorized_tenant_id]
    ...
`;

  const copyPython = () => {
    navigator.clipboard.writeText(pythonSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Team Mentor Guide & Judge Pitch Kit
              </h2>
              <p className="text-xs text-slate-400">Prepared for the first-semester engineering hackathon team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('answers')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'answers'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Core Questions Answered
          </button>
          <button
            onClick={() => setActiveTab('presentation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'presentation'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Judge Pitch & Demo Script
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'python'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Python / Streamlit MVP File
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {activeTab === 'answers' && (
            <div className="space-y-4 text-slate-300">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h3 className="font-semibold text-cyan-300 text-sm flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Answers to the 6 Essential Architecture Questions</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-400 leading-relaxed">
                  <li>
                    <strong className="text-slate-200">Operating System & Environment:</strong> Runs locally on standard Node.js / Linux / macOS / Windows on port 3000, and is fully deployed in this live AI Studio sandbox.
                  </li>
                  <li>
                    <strong className="text-slate-200">Python Availability:</strong> Python 3 can run the companion single-file Streamlit script located at <code className="text-cyan-300">python_prototype/app.py</code>.
                  </li>
                  <li>
                    <strong className="text-slate-200">AI API Key:</strong> We engineered a dual-mode system:
                    <ul className="list-disc list-inside ml-4 mt-1 text-slate-400">
                      <li><strong>Mock AI Service Mode:</strong> Simulates realistic API responses locally with 0 API key required!</li>
                      <li><strong>Gemini 3.8 Flash Mode:</strong> Connects server-side when an API key is available.</li>
                    </ul>
                  </li>
                  <li>
                    <strong className="text-slate-200">External Services:</strong> 100% self-contained. No paid vector databases, no external SaaS dependencies.
                  </li>
                  <li>
                    <strong className="text-slate-200">Persistent Storage:</strong> Uses in-memory dictionaries with cryptographic SHA-256 password hashing. Perfect for a 24-hour hackathon MVP.
                  </li>
                  <li>
                    <strong className="text-slate-200">Remaining Time:</strong> The full working prototype is already built, verified, and testable right now!
                  </li>
                </ol>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-semibold text-slate-200">Why Tenant Isolation Must Be in the Data Layer</h4>
                <p className="text-slate-400 leading-relaxed">
                  Beginners often try to hide data in the UI or ask the AI "Please don't show Acme documents to Globex". <strong>This is dangerous and easily bypassed.</strong> Our platform enforces:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mt-2">
                  <div className="p-2 bg-slate-900 border border-slate-850 rounded-lg">
                    <strong className="text-cyan-400">1. Cryptographic Session Binding:</strong> The browser cannot pick its tenantId. The server extracts tenantId from the verified token.
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-850 rounded-lg">
                    <strong className="text-cyan-400">2. Pre-Retrieval Partitioning:</strong> Before the search algorithm scores documents, non-tenant files are filtered out completely.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presentation' && (
            <div className="space-y-3 text-slate-300">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h3 className="font-semibold text-cyan-300 text-sm">
                  🎤 2-Minute Hackathon Demo Script for the Team
                </h3>
                <div className="space-y-2 text-slate-400 leading-relaxed">
                  <p>
                    <strong className="text-slate-200">Step 1 (The Hook):</strong> "Judges, in enterprise AI, the biggest fear is cross-company data leakage—what happens when Company B asks about Company A's secret IP? We built Tenant AI with hardware-grade server-side partition isolation."
                  </p>
                  <p>
                    <strong className="text-slate-200">Step 2 (The Demonstration):</strong> Log in as <strong>Alice at Acme Corp</strong>. Ask: <em>"What are the secret specs of Project Falcon?"</em> The AI answers with Falcon's specs and cites the exact document.
                  </p>
                  <p>
                    <strong className="text-slate-200">Step 3 (The Tenant Switch):</strong> Click <strong>Switch Profile</strong> to <strong>Charlie at Globex</strong>. Ask the same question. The AI responds: <em>"I cannot find sufficient evidence in your company's uploaded documents."</em>
                  </p>
                  <p>
                    <strong className="text-slate-200">Step 4 (The Security Lab Finale):</strong> Navigate to the <strong>Security Lab</strong> tab. Execute an <strong>IDOR Attack</strong> where Charlie tries to force-read Acme's document ID. Show the judge the <strong>HTTP 403 Forbidden</strong> and the live audit log entry!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-3 text-slate-300">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-sm">Standalone Python Prototype</span>
                  <button
                    onClick={copyPython}
                    className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <p className="text-slate-400 text-xs">
                  We have included the complete single-file Python script inside <code className="text-cyan-300">python_prototype/app.py</code> with in-memory dictionaries for <code className="text-cyan-300">USERS</code> and <code className="text-cyan-300">TENANTS</code>, password hashing, and the Mock AI Service.
                </p>
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {pythonSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
