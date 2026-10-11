export interface Tenant {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  status: 'active' | 'suspended';
  documentCount?: number;
  userCount?: number;
  conversationCount?: number;
  storageKb?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'manager' | 'admin';
  tenantId: string;
}

export interface DocumentItem {
  id: string;
  tenantId: string;
  title: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  chunkCount: number;
  preview?: string;
  content?: string;
  chunks?: string[];
}

export type ModelOption = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview' | 'mock';
export type RolePersona = 'compliance_officer' | 'security_auditor' | 'policy_analyst' | 'general_assistant';

export interface SearchGroundingSource {
  title: string;
  url: string;
}

export interface MessageCitation {
  documentId: string;
  docTitle: string;
  snippet: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: MessageCitation[];
  groundingSources?: SearchGroundingSource[];
  modelUsed?: string;
  rolePersona?: RolePersona;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  tenantId: string;
  userEmail: string;
  action: string;
  ip: string;
  status: number;
  details: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

export interface DemoAccount {
  email: string;
  role: 'member' | 'manager' | 'admin';
  tenantName: string;
  tenantId: string;
  password: string;
}

export interface AttackTestResult {
  attackType: string;
  description: string;
  attemptingUser: string;
  userTenant: string;
  blocked: boolean;
  responseStatus: number;
  reason: string;
  auditLogRecorded: boolean;
  httpStatus?: number;
  message?: string;
  safeguard?: string;
  auditEntry?: any;
}
