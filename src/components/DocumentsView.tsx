import React, { useState, useRef } from 'react';
import { User, Tenant, DocumentItem } from '../types';
import { FileText, Upload, Trash2, Eye, Plus, Shield, CheckCircle, AlertTriangle, FileCheck, Layers, FileUp, Sparkles, Search, Lock } from 'lucide-react';

interface DocumentsViewProps {
  user: User;
  tenant: Tenant | null;
  documents: DocumentItem[];
  onUpload: (data: { title: string; fileName: string; content: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onRefresh: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  user,
  tenant,
  documents,
  onUpload,
  onDelete,
  onRefresh,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = documents.filter(d => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return d.title.toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q) || (d.preview && d.preview.toLowerCase().includes(q));
  });

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds the 2MB security limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text || '');
      setFileName(file.name);
      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    };
    reader.onerror = () => {
      setError('Failed to read file. Please ensure it is a text-based file (.txt, .md, .json, .csv).');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and document content are required.');
      return;
    }

    if (content.length > 2 * 1024 * 1024) {
      setError('File size exceeds the 2MB security limit.');
      return;
    }

    setUploading(true);
    setError(null);
    const success = await onUpload({
      title: title.trim(),
      fileName: fileName.trim() || `${title.replace(/\s+/g, '_')}.txt`,
      content: content.trim(),
    });
    setUploading(false);

    if (success) {
      setTitle('');
      setFileName('');
      setContent('');
      setShowUploadModal(false);
      onRefresh();
      setSuccessToast(`Document indexed successfully under ${tenant ? tenant.name : user.tenantId} vault.`);
      setTimeout(() => setSuccessToast(null), 3000);
    } else {
      setError('Upload failed. Server-side validation rejected the file.');
    }
  };

  const loadPreset = (presetType: 'nda' | 'safety' | 'security' | 'travel') => {
    if (presetType === 'nda') {
      setTitle('Non-Disclosure Agreement & Trade Secret Security Protocol');
      setFileName('Corporate_NDA_2026.txt');
      setContent(
        `CONFIDENTIAL NON-DISCLOSURE AGREEMENT 2026\n` +
        `Authorized Organization: ${tenant ? tenant.name : user.tenantId}\n` +
        `Clause 1: All trade secrets, architectural blueprints, and AI embeddings are classified as Tier-1 company confidential.\n` +
        `Clause 2: Breach penalty is $500,000 per violation with immediate contract revocation.\n` +
        `Clause 3: All data retention must comply with localized tenant isolation protocols. Cross-tenant retrieval is strictly prohibited.`
      );
    } else if (presetType === 'safety') {
      setTitle('Facility Operations & Disaster Recovery Protocol');
      setFileName('Facility_Disaster_Protocol_v2.txt');
      setContent(
        `EMERGENCY OPERATIONS & DISASTER RECOVERY PROTOCOL\n` +
        `Organization: ${tenant ? tenant.name : user.tenantId}\n` +
        `Evacuation Assembly Point: Sector 4 North Carpark.\n` +
        `Offsite Backup Frequency: Automated snapshot every 6 hours to encrypted cold vault.\n` +
        `Primary Incident Commander: Contact extension 4099.`
      );
    } else if (presetType === 'travel') {
      setTitle('Corporate Travel & Per Diem Reimbursement Schedule');
      setFileName('Travel_Policy_Schedule_2026.txt');
      setContent(
        `CORPORATE TRAVEL AND ENTERTAINMENT EXPENSE GUIDELINES 2026\n` +
        `Authorized Entity: ${tenant ? tenant.name : user.tenantId}\n` +
        `Domestic Meal Allowance: $85 per day standard rate with itemized receipts.\n` +
        `Hotel Nightly Cap: $220 in tier-2 cities, $310 in tier-1 financial capitals.\n` +
        `International Travel: Flights exceeding 8 continuous hours are eligible for Premium Economy or Business Class with VP authorization.`
      );
    } else {
      setTitle('Information Security & Token Authorization Matrix');
      setFileName('SecOps_Authorization_Matrix.txt');
      setContent(
        `ENTERPRISE INFORMATION SECURITY POLICY\n` +
        `Company: ${tenant ? tenant.name : user.tenantId}\n` +
        `Requirement 1: Every API request must pass cryptographically bound session token validation.\n` +
        `Requirement 2: Client-side tenant ID spoofing attempts are recorded immediately in the immutable audit log.\n` +
        `Requirement 3: Documents are strictly partition-isolated before vector or BM25 retrieval.`
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 space-y-5">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header section with Security Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-100">
              Corporate Document Vault
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-md">
              🏢 {tenant ? tenant.name : user.tenantId}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Documents uploaded here are indexed exclusively for employees of <strong className="text-slate-300">{tenant ? tenant.name : user.tenantId}</strong>.
          </p>
        </div>

        <button
          onClick={() => { setShowUploadModal(true); setError(null); }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search indexed documents by title or keywords..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>
        <div className="text-xs text-slate-400 flex items-center space-x-2">
          <span>Total Vault Documents: <strong className="text-cyan-300">{documents.length}</strong></span>
          <span>•</span>
          <span className="text-emerald-400 flex items-center">
            <Lock className="w-3 h-3 mr-1" />
            Isolated Partition
          </span>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">
            {searchFilter ? 'No matching documents found' : 'No documents indexed in this vault yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Upload policies, technical manuals, or guidelines to ground the AI assistant in your company's data.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
          >
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-900 flex items-center justify-center text-cyan-400 shrink-0 mr-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Inspect Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingDoc(doc)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete from Vault"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-200 text-sm mt-3 line-clamp-1">
                  {doc.title}
                </h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                  {doc.fileName}
                </p>

                {doc.preview && (
                  <p className="text-xs text-slate-400 mt-2.5 line-clamp-3 bg-slate-950/60 p-2 rounded-lg border border-slate-850 font-mono text-[11px] leading-relaxed">
                    {doc.preview}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{doc.chunkCount} passages</span>
                </span>
                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document View Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-slate-100">{selectedDoc.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>File: <strong className="font-mono text-slate-300">{selectedDoc.fileName}</strong> • Uploaded by: {selectedDoc.uploadedBy}</p>
              <p className="text-cyan-400">🛡️ Vault Boundary: Partitioned strictly under Tenant ID: {selectedDoc.tenantId}</p>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
              {selectedDoc.preview || 'Content loaded in encrypted store.'}
            </div>
            <div className="text-right">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-semibold text-slate-100">Delete Vault Document</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">"{deletingDoc.title}"</strong> from the corporate vault?
              This action will immediately purge all indexed passages from the RAG pipeline.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const docId = deletingDoc.id;
                  setDeletingDoc(null);
                  await onDelete(docId);
                  onRefresh();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal with Drag-and-Drop & Presets */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-slate-100">Upload to Corporate Vault</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl">
                {error}
              </div>
            )}

            {/* 1-Click Preset Templates */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Load Sample Document Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => loadPreset('nda')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded-lg border border-slate-700 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Confidential NDA</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('safety')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded-lg border border-slate-700 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Disaster Protocol</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('travel')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded-lg border border-slate-700 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Travel Policy</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('security')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded-lg border border-slate-700 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>SecOps Matrix</span>
                </button>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                accept=".txt,.md,.json,.csv"
                className="hidden"
              />
              <FileUp className="w-7 h-7 text-cyan-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-200">
                Click to browse or drag & drop text file here
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Supports .txt, .md, .json, .csv (Max 2MB)
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadSubmit} className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Autonomous Drone Fleet Specs"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Drone_Fleet_Specs_2026.txt"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Text / Content *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder="Paste or drop document text content here..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
                />
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-[11px] text-slate-400">
                🛡️ Partition Guarantee: Encrypted and partitioned strictly for <strong>{tenant ? tenant.name : user.tenantId}</strong>.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  {uploading ? 'Chunking & Indexing...' : 'Upload & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
