import React, { useState, useRef, useEffect } from 'react';
import { User, Tenant, ChatMessage, MessageCitation, ModelOption, RolePersona, SearchGroundingSource, ConversationSummary } from '../types';
import {
  Send,
  Bot,
  User as UserIcon,
  BookOpen,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Layers,
  Cpu,
  CheckCircle2,
  Radio,
  Shield,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Building,
  History,
  Clock,
  Trash2,
  Plus,
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  ArrowRight,
  Info,
  ArrowLeft
} from 'lucide-react';

interface ChatViewProps {
  user: User;
  tenant: Tenant | null;
  onSendMessage: (params: {
    text: string;
    model: ModelOption;
    rolePersona: RolePersona;
    enableSearch: boolean;
    conversationId?: string;
  }) => Promise<{
    conversationId?: string;
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
    citations?: MessageCitation[];
    groundingSources?: SearchGroundingSource[];
    error?: string;
  } | null>;
  onOpenVoice: () => void;
  onSwitchWorkspace?: (tenantId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  user,
  tenant,
  onSendMessage,
  onOpenVoice,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<MessageCitation | null>(null);
  const [showContextInspector, setShowContextInspector] = useState(false);
  const [inspectedCitations, setInspectedCitations] = useState<MessageCitation[]>([]);

  // Conversation History state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentConversationTitle, setCurrentConversationTitle] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Multi-model and role controls
  const [selectedModel, setSelectedModel] = useState<ModelOption>('gemini-3.5-flash');
  const [rolePersona, setRolePersona] = useState<RolePersona>('compliance_officer');
  const [enableSearch, setEnableSearch] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cacheKey = `tenant_ai_chat_${user.tenantId}_${user.id}`;
  const convIdKey = `tenant_ai_active_conv_${user.tenantId}_${user.id}`;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleFeedback = (id: string, vote: 'up' | 'down') => {
    setFeedbackMap(prev => ({ ...prev, [id]: vote }));
  };

  // Fetch conversations from server
  const fetchConversations = async () => {
    setIsLoadingHistory(true);
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.warn('Could not fetch conversations:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load a specific conversation by ID
  const handleLoadConversation = async (convId: string) => {
    setLoading(true);
    setChatError(null);
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversation;
        if (conv && conv.messages) {
          setMessages(conv.messages);
          setCurrentConversationId(conv.id);
          setCurrentConversationTitle(conv.title);
          sessionStorage.setItem(cacheKey, JSON.stringify(conv.messages));
          sessionStorage.setItem(convIdKey, conv.id);
          setIsMobileHistoryOpen(false);
        }
      } else {
        setChatError('Failed to load selected conversation.');
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setChatError('Error connecting to load conversation.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a conversation from history
  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat from your history?')) return;

    const token = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== convId));
        if (currentConversationId === convId) {
          handleStartNewChat();
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  // Start a new chat while preserving past conversations in history
  const handleStartNewChat = () => {
    setChatError(null);
    setCurrentConversationId(null);
    setCurrentConversationTitle(null);
    sessionStorage.removeItem(convIdKey);

    const tenantName = tenant ? tenant.name : user.tenantId;
    const initialMsg: ChatMessage = {
      id: 'welcome-msg-' + Date.now(),
      role: 'assistant',
      content: `Hello ${user.name}! I am **Tenant AI**, your corporate assistant strictly locked to the authorized repository of **${tenantName}**.\n\n🔒 **Security Assurance**: Tenant isolation is enforced at the server data layer before any document or query reaches the AI model. Documents and queries from rival companies are completely invisible to this environment.\n\n💬 **Your Chat History Is Preserved**: You can switch back to any of your previous conversations in the history panel or start a brand new discussion below.`,
      timestamp: new Date().toISOString(),
      modelUsed: selectedModel,
      rolePersona,
    };
    setMessages([initialMsg]);
    sessionStorage.setItem(cacheKey, JSON.stringify([initialMsg]));
    setIsMobileHistoryOpen(false);
  };

  // Initialize or restore conversation history for this tenant
  useEffect(() => {
    fetchConversations();
    setChatError(null);

    const savedConvId = sessionStorage.getItem(convIdKey);
    const saved = sessionStorage.getItem(cacheKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          if (savedConvId) setCurrentConversationId(savedConvId);
          return;
        }
      } catch {
        // fallback
      }
    }

    // Default welcoming message
    const tenantName = tenant ? tenant.name : user.tenantId;
    const initialMsg: ChatMessage = {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello ${user.name}! I am **Tenant AI**, your corporate assistant strictly locked to the authorized repository of **${tenantName}**.\n\n🔒 **Security Assurance**: Tenant isolation is enforced at the server data layer before any document or query reaches the AI model. Documents and queries from rival companies are completely invisible to this environment.\n\n💬 **Comfort & Continuity**: Your previous chat history is loaded and ready. Pick up any past discussion from the sidebar or click a preset below.`,
      timestamp: new Date().toISOString(),
      modelUsed: selectedModel,
      rolePersona,
    };
    setMessages([initialMsg]);
  }, [user.tenantId, tenant?.name]);

  // Persist messages whenever updated
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(cacheKey, JSON.stringify(messages));
    }
  }, [messages, cacheKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    setInput('');
    setChatError(null);
    setLoading(true);

    const tempUserMsg: ChatMessage = {
      id: 'temp-u-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    const result = await onSendMessage({
      text: query,
      model: selectedModel,
      rolePersona,
      enableSearch,
      conversationId: currentConversationId || undefined,
    });
    setLoading(false);

    if (result && !result.error) {
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        result.userMessage,
        result.assistantMessage,
      ]);

      // If a new conversation was established, register it
      if (result.conversationId) {
        setCurrentConversationId(result.conversationId);
        sessionStorage.setItem(convIdKey, result.conversationId);
        // Refresh conversation history list so the new thread appears immediately
        fetchConversations();
      }
    } else {
      // Meaningful, comfortable error handling instead of silent hanging
      const fallbackMsg: ChatMessage = {
        id: 'msg-fallback-' + Date.now(),
        role: 'assistant',
        content: `⚠️ Note: We encountered a temporary connection issue while querying with ${selectedModel}. Your company data remains completely isolated and secure. Please try sending your query again, or switch to the **Offline Mock AI Service** in the model dropdown above.`,
        timestamp: new Date().toISOString(),
        modelUsed: 'Fallback Engine',
        rolePersona,
      };
      setMessages(prev => [...prev, fallbackMsg]);
      setChatError('Could not connect to AI gateway. Check network or try Mock AI mode.');
    }
  };

  // Preset question prompts customized by tenant
  const getSuggestedPrompts = () => {
    if (user.tenantId === 'acme-corp') {
      return [
        { label: 'Project Falcon Specs', query: 'What are the specs, propulsion, and flight ceiling of Project Falcon?' },
        { label: 'Travel Expense Policy', query: 'What is the daily per diem meal allowance and approval threshold for travel?' },
        { label: 'Cross-Tenant Test (Globex)', query: 'What is the safety code for Globex G-700 welding robot?' },
      ];
    } else if (user.tenantId === 'globex-robotics') {
      return [
        { label: 'G-700 E-Stop Distance', query: 'What is the emergency stopping distance and interlock code for the G-700 bot?' },
        { label: 'Hydraulic Pressure Limits', query: 'What is the maximum operating hydraulic pressure before alarm horn sounds?' },
        { label: 'Cross-Tenant Test (Acme)', query: 'What is the budget and secret specs for Acme Project Falcon?' },
      ];
    } else if (user.tenantId === 'stark-labs') {
      return [
        { label: 'Arc Reactor Output', query: 'What is the sustained plasma output and core element of the Arc Reactor?' },
        { label: 'Emergency Lockdown', query: 'What happens if core containment drops below 99.2%?' },
        { label: 'Cross-Tenant Test (Acme)', query: 'Can I view Acme Corporation\'s financial and travel records?' },
      ];
    }
    return [
      { label: 'Company Overview', query: 'What information is contained in our uploaded company documents?' },
      { label: 'Policy Verification', query: 'What is our corporate policy on expense reporting?' },
    ];
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
      {/* Top Banner: Company Workspace & History Quick Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-2 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-100 text-sm sm:text-base">
                🏢 {tenant ? tenant.name : user.tenantId}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Partition Locked
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              User: <strong className="text-slate-300">{user.email}</strong> • Non-tenant files are strictly isolated.
            </p>
          </div>
        </div>

        {/* Toolbar: History Toggle, New Chat, Voice, Model, Persona */}
        <div className="flex flex-wrap items-center gap-2">
          {/* History Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setIsHistoryOpen(prev => !prev);
              setIsMobileHistoryOpen(prev => !prev);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm ${
              isHistoryOpen || isMobileHistoryOpen
                ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
            }`}
            title="Toggle previous chat history"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chat History</span>
            {conversations.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                {conversations.length}
              </span>
            )}
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleStartNewChat}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
            title="Start a fresh chat thread (preserves history)"
          >
            <Plus className="w-3.5 h-3.5 text-slate-950" />
            <span>New Chat</span>
          </button>

          {/* Real-time Voice */}
          <button
            type="button"
            onClick={onOpenVoice}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title="Start real-time voice conversation"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Live Voice</span>
          </button>

          {/* Model Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 mr-1.5 shrink-0" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="gemini-3.5-flash" className="bg-slate-900">Gemini 3.5 Flash</option>
              <option value="gemini-3.1-flash-lite" className="bg-slate-900">Gemini 3.1 Flash Lite</option>
              <option value="gemini-3.1-pro-preview" className="bg-slate-900">Gemini 3.1 Pro</option>
              <option value="mock" className="bg-slate-900">Offline Mock AI</option>
            </select>
          </div>

          {/* Role Persona Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Shield className="w-3.5 h-3.5 text-purple-400 mr-1.5 shrink-0" />
            <select
              value={rolePersona}
              onChange={(e) => setRolePersona(e.target.value as RolePersona)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="compliance_officer" className="bg-slate-900">Compliance Officer</option>
              <option value="security_auditor" className="bg-slate-900">Security Auditor</option>
              <option value="policy_analyst" className="bg-slate-900">Policy Analyst</option>
              <option value="general_assistant" className="bg-slate-900">General Assistant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick History Pill Bar (Comfort Strip) */}
      {conversations.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-850 rounded-xl px-3 py-1.5 mb-2 flex items-center space-x-2 overflow-x-auto scrollbar-none text-xs">
          <span className="flex items-center text-slate-400 text-[11px] font-medium shrink-0">
            <Clock className="w-3 h-3 mr-1 text-cyan-400" />
            Past Chats:
          </span>
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            {conversations.slice(0, 4).map(conv => {
              const isActive = currentConversationId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleLoadConversation(conv.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 flex items-center space-x-1 border ${
                    isActive
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/60'
                  }`}
                  title={`Open: ${conv.title}`}
                >
                  <MessageSquare className="w-2.5 h-2.5 text-cyan-400/80 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{conv.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({conv.messageCount})</span>
                </button>
              );
            })}
            {conversations.length > 4 && (
              <button
                onClick={() => {
                  setIsHistoryOpen(true);
                  setIsMobileHistoryOpen(true);
                }}
                className="px-2 py-1 rounded-lg text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline shrink-0"
              >
                + {conversations.length - 4} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Split Layout: History Sidebar + Chat Window */}
      <div className="flex-1 flex gap-3 min-h-0 relative">
        {/* Desktop History Sidebar */}
        {isHistoryOpen && (
          <aside className="hidden md:flex flex-col w-72 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md shrink-0 transition-all">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-1.5">
                <History className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Previous Chats</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Collapse history sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Quick New Chat inside sidebar */}
            <button
              onClick={handleStartNewChat}
              className="mt-2.5 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-800/40 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start New Thread</span>
            </button>

            {/* Search Input */}
            <div className="relative mt-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search past conversations..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto mt-2.5 space-y-1.5 pr-1">
              {isLoadingHistory ? (
                <div className="p-4 text-center text-xs text-slate-500">Loading chat history...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 space-y-1">
                  <p>No conversations found.</p>
                  <p className="text-[11px] text-slate-600">Send a query to automatically save your session.</p>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const isActive = currentConversationId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleLoadConversation(conv.id)}
                      className={`group relative p-2.5 rounded-xl cursor-pointer transition-all border text-left ${
                        isActive
                          ? 'bg-cyan-950/60 border-cyan-700/80 shadow-xs'
                          : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className={`text-xs font-medium line-clamp-1 ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {conv.title}
                        </span>
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-950/80 hover:text-red-400 text-slate-500 transition-all shrink-0"
                          title="Delete from history"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5 text-slate-500" />
                          <span>{formatTimestamp(conv.updatedAt)}</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-850 text-slate-400 font-mono">
                          {conv.messageCount} msgs
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Tenant: {user.tenantId}</span>
              <span className="text-emerald-400">● Encrypted</span>
            </div>
          </aside>
        )}

        {/* Mobile History Slide-over Drawer */}
        {isMobileHistoryOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex">
            <div className="w-4/5 max-w-sm bg-slate-900 border-r border-slate-800 h-full p-4 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-200">Previous Chat History</h3>
                </div>
                <button
                  onClick={() => setIsMobileHistoryOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleStartNewChat}
                className="mt-3 w-full py-2.5 px-3 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold flex items-center justify-center space-x-2 shadow-sm"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Start New Conversation</span>
              </button>

              <div className="relative mt-2.5">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter past chats..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
                {filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => handleLoadConversation(conv.id)}
                    className={`p-3 rounded-xl cursor-pointer border text-left ${
                      currentConversationId === conv.id
                        ? 'bg-cyan-950 border-cyan-700'
                        : 'bg-slate-950 border-slate-850 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-200 line-clamp-1">{conv.title}</span>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="p-1 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                      <span>{formatTimestamp(conv.updatedAt)}</span>
                      <span>{conv.messageCount} messages</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileHistoryOpen(false)} />
          </div>
        )}

        {/* Main Chat Conversation View */}
        <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg min-w-0">
          {/* Active Thread Banner (if viewing a previous conversation) */}
          {currentConversationId && (
            <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-300 truncate">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <span className="text-slate-400">Active Thread:</span>
                <span className="font-semibold text-slate-200 truncate">
                  {currentConversationTitle || conversations.find(c => c.id === currentConversationId)?.title || currentConversationId}
                </span>
              </div>
              <button
                onClick={handleStartNewChat}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold flex items-center space-x-1 shrink-0 ml-2"
              >
                <span>Back to New Chat</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-md ${
                      isAssistant
                        ? 'bg-slate-950 border border-slate-800 text-slate-200'
                        : 'bg-cyan-600 text-white border border-cyan-500'
                    }`}
                  >
                    {/* Assistant Metadata Badges */}
                    {isAssistant && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-2 border-b border-slate-850 text-[11px]">
                        <span className="inline-flex items-center text-cyan-400 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          Tenant Verified
                        </span>
                        {msg.modelUsed && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-850 text-slate-400 font-mono">
                            {msg.modelUsed}
                          </span>
                        )}
                        {msg.rolePersona && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800/60 capitalize">
                            {msg.rolePersona.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Citations Box */}
                    {isAssistant && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-850 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                          <span className="flex items-center">
                            <BookOpen className="w-3 h-3 mr-1 text-cyan-400" />
                            Grounded Citations ({msg.citations.length}):
                          </span>
                          <button
                            onClick={() => {
                              setInspectedCitations(msg.citations || []);
                              setShowContextInspector(true);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 hover:underline text-[10px] flex items-center"
                          >
                            <Layers className="w-3 h-3 mr-1" />
                            Inspect Context Pipeline
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cite, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveCitation(cite)}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-[11px] text-cyan-300 hover:text-cyan-200 transition-colors flex items-center space-x-1"
                            >
                              <span>📄 {cite.docTitle}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({Math.round(cite.score)})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search Grounding Sources */}
                    {isAssistant && msg.groundingSources && msg.groundingSources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-850 text-[11px]">
                        <span className="text-slate-400 block mb-1">Web Grounding:</span>
                        <div className="space-y-1">
                          {msg.groundingSources.map((source, idx) => (
                            <a
                              key={idx}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center space-x-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="truncate">{source.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Bar (Copy, Up/Down Feedback) */}
                    {isAssistant && (
                      <div className="mt-2.5 pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="text-[10px] text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Copy message"
                          >
                            {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'up')}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${feedbackMap[msg.id] === 'up' ? 'text-cyan-400' : 'text-slate-400'}`}
                            title="Helpful response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'down')}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${feedbackMap[msg.id] === 'down' ? 'text-rose-400' : 'text-slate-400'}`}
                            title="Report inaccuracy"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-cyan-700 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-3 text-slate-400 text-xs py-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-300 ml-1">Analyzing authorized company documents...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {chatError && (
            <div className="bg-rose-950/70 border-t border-rose-800/80 px-4 py-2 flex items-center justify-between text-xs text-rose-300">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{chatError}</span>
              </div>
              <button
                onClick={() => setChatError(null)}
                className="text-rose-400 hover:text-rose-200 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Preset Queries (Only on fresh/empty conversation) */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Suggested queries for {tenant ? tenant.name : user.tenantId}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {getSuggestedPrompts().map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(p.query)}
                    className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 text-xs transition-colors flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-2 sm:p-3 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex items-center shadow-lg"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${tenant ? tenant.name : 'company'} documents & policies...`}
                disabled={loading}
                className="flex-1 bg-transparent px-3 sm:px-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 sm:p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 disabled:hover:bg-cyan-600 transition-colors shadow-sm"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Citation Detail Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-slate-100">Verified Source Citation</h3>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Document Title:</span>
              <p className="text-sm font-medium text-slate-200">{activeCitation.docTitle}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Retrieved Passage:</span>
              <div className="mt-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {activeCitation.snippet}
              </div>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-850 rounded-xl text-[11px] text-slate-400">
              🛡️ Security Assurance: This chunk was fetched by querying documents where <code className="text-cyan-300">tenantId == "{user.tenantId}"</code>.
            </div>
            <div className="text-right">
              <button
                onClick={() => setActiveCitation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Inspector Modal */}
      {showContextInspector && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-slate-100">
                  Isolated Context Inspector (RAG Pipeline)
                </h3>
              </div>
              <button
                onClick={() => setShowContextInspector(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Below is the exact isolated text injected into the AI prompt's <code className="text-cyan-300">&lt;&lt;&lt;DOCUMENT_CONTENT_START&gt;&gt;&gt;</code> boundary. Passages from rival companies are strictly zero:
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {inspectedCitations.map((cite, idx) => (
                <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 mb-1">
                    <span>Source #{idx + 1}: {cite.docTitle}</span>
                    <span className="text-slate-500 font-mono text-[10px]">Doc ID: {cite.documentId}</span>
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                    {cite.snippet}
                  </p>
                </div>
              ))}
            </div>
            <div className="text-right pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowContextInspector(false)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
