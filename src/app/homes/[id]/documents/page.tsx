'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  Trash2,
  Download,
  Search,
  Tag,
  X,
} from 'lucide-react';
import type { Document } from '@/types/database';

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  default: File,
};

function getFileIcon(fileType: string | null) {
  if (!fileType) return FILE_ICONS.default;
  if (fileType.startsWith('image/')) return FILE_ICONS.image;
  if (fileType.includes('pdf')) return FILE_ICONS.pdf;
  return FILE_ICONS.default;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Common document tags for homeowners
const SUGGESTED_TAGS = [
  'warranty',
  'receipt',
  'manual',
  'contract',
  'inspection',
  'insurance',
  'permit',
  'invoice',
  'photo',
  'appraisal',
];

export default function DocumentsPage() {
  const params = useParams();
  const homeId = params.id as string;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [homeId]);

  async function fetchDocuments() {
    const supabase = createClient();
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('home_id', homeId)
      .order('created_at', { ascending: false });
    setDocuments(data || []);
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const supabase = createClient();

    // Get current user for storage path
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    // Upload file to Supabase Storage
    const filePath = `${user.id}/${homeId}/${Date.now()}_${selectedFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from('home-documents')
      .upload(filePath, selectedFile);

    if (uploadError) {
      alert(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('home-documents')
      .getPublicUrl(filePath);

    // Save document record in database
    const { error: dbError } = await supabase.from('documents').insert({
      home_id: homeId,
      name: uploadName || selectedFile.name,
      file_url: filePath, // Store the path, not the full URL (more flexible)
      file_type: selectedFile.type,
      tags: uploadTags,
      notes: uploadNotes || null,
    });

    if (dbError) {
      alert(`Error saving document: ${dbError.message}`);
      setUploading(false);
      return;
    }

    // Reset form and refresh
    setShowUploadForm(false);
    setUploadName('');
    setUploadTags([]);
    setUploadNotes('');
    setSelectedFile(null);
    setUploading(false);
    fetchDocuments();
  }

  async function deleteDocument(doc: Document) {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;

    const supabase = createClient();

    // Delete from storage
    await supabase.storage.from('home-documents').remove([doc.file_url]);

    // Delete from database
    await supabase.from('documents').delete().eq('id', doc.id);

    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  }

  async function downloadDocument(doc: Document) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('home-documents')
      .download(doc.file_url);

    if (error || !data) {
      alert('Download failed');
      return;
    }

    // Trigger browser download
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleTag(tag: string) {
    setUploadTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // Filter documents by search and tag
  const filtered = documents.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag =
      !filterTag || doc.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  // Get all unique tags across documents
  const allTags = Array.from(
    new Set(documents.flatMap((d) => d.tags))
  ).sort();

  const inputClass =
    'w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent';

  return (
    <AppShell>
      <Link
        href={`/homes/${homeId}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Documents</h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Upload size={16} />
          Upload
        </button>
      </div>

      {/* Upload form */}
      {showUploadForm && (
        <div className="border border-neutral-200 rounded-xl p-5 bg-white mb-6">
          <form onSubmit={handleUpload} className="space-y-4">
            {/* File picker */}
            <div>
              <label className="block text-sm font-medium mb-1">File *</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  if (file && !uploadName) {
                    setUploadName(file.name.replace(/\.[^/.]+$/, ''));
                  }
                }}
                className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200"
              />
              {selectedFile && (
                <p className="text-xs text-neutral-400 mt-1">
                  {selectedFile.type || 'Unknown type'} · {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Document Name *</label>
              <input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                required
                placeholder="e.g. HVAC Warranty"
                className={inputClass}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {SUGGESTED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      uploadTags.includes(tag)
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {uploadTags.length > 0 && (
                <p className="text-xs text-neutral-400">
                  Selected: {uploadTags.join(', ')}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                rows={2}
                placeholder="Optional details about this document..."
                className={inputClass}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + filter bar */}
      {documents.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {filterTag && (
                <button
                  onClick={() => setFilterTag(null)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 text-white flex items-center gap-1"
                >
                  {filterTag}
                  <X size={12} />
                </button>
              )}
              {allTags
                .filter((t) => t !== filterTag)
                .map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : documents.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-xl p-12 text-center">
          <FileText size={32} className="mx-auto text-neutral-400 mb-3" />
          <p className="text-neutral-600 font-medium">No documents yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            Upload warranties, receipts, manuals, and other home documents.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-neutral-400">No documents match your search.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => {
            const Icon = getFileIcon(doc.file_type);
            return (
              <div
                key={doc.id}
                className="border border-neutral-200 rounded-lg p-4 bg-white flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={20} className="text-neutral-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-neutral-400">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      {doc.tags.length > 0 && (
                        <div className="flex gap-1">
                          {doc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-neutral-400 mt-1 truncate">
                        {doc.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button
                    onClick={() => downloadDocument(doc)}
                    className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => deleteDocument(doc)}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
