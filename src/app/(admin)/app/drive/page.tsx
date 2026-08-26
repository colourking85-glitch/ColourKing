'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  size?: string;
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';

function formatSize(bytes?: string) {
  if (!bytes) return '';
  const b = parseInt(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string) {
  if (mimeType === FOLDER_MIME) return '📁';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('video')) return '🎬';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
  return '📎';
}

export default function DrivePage() {
  const t = useTranslations('drive');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [folderStack, setFolderStack] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : null;

  const fetchFiles = useCallback(async (folderId?: string | null) => {
    setLoading(true);
    setError('');
    setIsSearch(false);
    try {
      const url = folderId ? `/api/drive?folderId=${folderId}` : '/api/drive';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load files');
        setFiles([]);
      } else {
        setFiles(json.files || []);
      }
    } catch {
      setError('Failed to connect to Drive');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [currentFolderId, fetchFiles]);

  async function handleSearch() {
    if (!search.trim()) {
      fetchFiles(currentFolderId);
      return;
    }
    setSearching(true);
    setIsSearch(true);
    try {
      const res = await fetch(`/api/drive?search=${encodeURIComponent(search.trim())}`);
      const json = await res.json();
      setFiles(json.files || []);
    } catch {
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  }

  function navigateToFolder(file: DriveFile) {
    setFolderStack((prev) => [...prev, { id: file.id, name: file.name }]);
    setSearch('');
  }

  function navigateUp() {
    setFolderStack((prev) => prev.slice(0, -1));
    setSearch('');
  }

  function navigateToBreadcrumb(index: number) {
    setFolderStack((prev) => prev.slice(0, index + 1));
    setSearch('');
  }

  function navigateToRoot() {
    setFolderStack([]);
    setSearch('');
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId) formData.append('folderId', currentFolderId);
      const res = await fetch('/api/drive', { method: 'POST', body: formData });
      if (res.ok) {
        fetchFiles(currentFolderId);
      } else {
        const json = await res.json();
        setError(json.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_folder',
          folderName: newFolderName.trim(),
          parentFolderId: currentFolderId,
        }),
      });
      if (res.ok) {
        setNewFolderName('');
        setShowNewFolder(false);
        fetchFiles(currentFolderId);
      }
    } catch {
      setError('Failed to create folder');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(fileId: string, fileName: string) {
    if (!confirm(`${t('confirmDelete')} "${fileName}"?`)) return;
    try {
      const res = await fetch(`/api/drive?fileId=${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFiles(currentFolderId);
      }
    } catch {
      setError('Delete failed');
    }
  }

  const folders = files.filter((f) => f.mimeType === FOLDER_MIME);
  const nonFolders = files.filter((f) => f.mimeType !== FOLDER_MIME);
  const sortedFiles = [...folders, ...nonFolders];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="SY30" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
            <p className="text-sm text-ck-muted-light">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-ck-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? t('uploading') : t('upload')}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          <button
            onClick={() => setShowNewFolder(!showNewFolder)}
            className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs text-ck-muted-light hover:bg-ck-dark-surface"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {t('newFolder')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t('searchPlaceholder')}
          className="flex-1 rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white placeholder:text-ck-muted-light focus:border-ck-red focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="rounded-lg border border-ck-dark-border px-4 py-2 text-sm text-ck-muted-light hover:bg-ck-dark-surface"
        >
          {searching ? '...' : t('searchBtn')}
        </button>
      </div>

      {/* New folder input */}
      {showNewFolder && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            placeholder={t('folderNamePlaceholder')}
            className="flex-1 rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white placeholder:text-ck-muted-light focus:border-ck-red focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleCreateFolder}
            disabled={creating || !newFolderName.trim()}
            className="rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
          >
            {creating ? '...' : t('create')}
          </button>
          <button
            onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
            className="rounded-lg border border-ck-dark-border px-4 py-2 text-sm text-ck-muted-light hover:bg-ck-dark-surface"
          >
            {t('cancel')}
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-ck-muted-light">
        <button onClick={navigateToRoot} className="flex items-center gap-1 hover:text-white">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Root
        </button>
        {folderStack.map((folder, i) => (
          <span key={folder.id} className="flex items-center gap-1.5">
            <span className="text-ck-muted-light">/</span>
            <button onClick={() => navigateToBreadcrumb(i)} className="hover:text-white">
              {folder.name}
            </button>
          </span>
        ))}
        {isSearch && <span className="ml-2 text-amber-400">({t('searchResults')})</span>}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">×</button>
        </div>
      )}

      {/* File list */}
      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ck-muted-light">
            <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('loading')}
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="py-16 text-center text-sm text-ck-muted-light">{t('empty')}</div>
        ) : (
          <div className="divide-y divide-ck-dark-border">
            {folderStack.length > 0 && !isSearch && (
              <button
                onClick={navigateUp}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ck-muted-light hover:bg-ck-dark-surface"
              >
                <span className="text-lg">⬆️</span>
                <span>..</span>
              </button>
            )}
            {sortedFiles.map((file) => (
              <div
                key={file.id}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-ck-dark-surface"
              >
                {file.mimeType === FOLDER_MIME ? (
                  <button
                    onClick={() => navigateToFolder(file)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span className="text-lg">{fileIcon(file.mimeType)}</span>
                    <span className="text-sm font-medium text-white">{file.name}</span>
                  </button>
                ) : (
                  <a
                    href={file.webViewLink || file.webContentLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center gap-3"
                  >
                    <span className="text-lg">{fileIcon(file.mimeType)}</span>
                    <div className="flex-1">
                      <div className="text-sm text-white">{file.name}</div>
                      <div className="flex gap-3 text-[10px] text-ck-muted-light">
                        {file.size && <span>{formatSize(file.size)}</span>}
                        {file.createdTime && (
                          <span>
                            {new Date(file.createdTime).toLocaleDateString('nl-NL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <svg className="h-3.5 w-3.5 text-ck-muted-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                <button
                  onClick={() => handleDelete(file.id, file.name)}
                  className="rounded p-1 text-ck-muted-light opacity-0 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  title={t('delete')}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-ck-dark-border px-4 py-2 text-xs text-ck-muted-light">
          {sortedFiles.length} {t('items')}
        </div>
      </div>
    </div>
  );
}
