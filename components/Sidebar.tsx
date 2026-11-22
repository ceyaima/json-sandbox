import React, { useState, useMemo } from 'react';
import { 
  Search, 
  FileText, 
  Edit3, 
  Hash, 
  GitBranch, 
  Layers, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  GripVertical,
  FolderPlus,
  Check,
  X
} from 'lucide-react';
import { SandboxFile, FileSortMode } from '../types';
import { CATEGORIES_PRESET } from '../constants';

interface SidebarProps {
  files: SandboxFile[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onOpenMetadataForFile: (fileId: string) => void;
  isCollapsed: boolean;
  onUpdateFileFolder?: (fileId: string, folder: string) => void;
  onRenameFolder?: (oldFolder: string, newFolder: string) => void;
  onCreateFolder?: (newFolder: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onOpenMetadataForFile,
  isCollapsed,
  onUpdateFileFolder,
  onRenameFolder,
  onCreateFolder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortMode, setSortMode] = useState<FileSortMode>('title');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  // Folder creation and renaming inline states
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');
  const [editingFolderOriginal, setEditingFolderOriginal] = useState<string | null>(null);
  const [renameFolderInput, setRenameFolderInput] = useState('');

  // Compute categories unconditionally
  const allCategories = useMemo(() => {
    return Array.from(
      new Set([...CATEGORIES_PRESET, ...files.map((f) => f.metadata.category || 'Uncategorized')])
    );
  }, [files]);

  // Filter and sort files unconditionally before any early return
  const filteredAndSortedFiles = useMemo(() => {
    const filtered = files.filter((f) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        f.metadata.category === selectedCategory ||
        (selectedCategory === 'Uncategorized' && !f.metadata.category);

      const displayName = f.metadata.aliasName || f.originalFilename;
      const matchesSearch =
        displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.originalFilename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.metadata.tags || []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.metadata.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    return filtered.sort((a, b) => {
      if (sortMode === 'nodes') {
        return b.nodeCount - a.nodeCount;
      }
      if (sortMode === 'tags') {
        return (b.metadata.tags || []).length - (a.metadata.tags || []).length;
      }
      // Default: title sort
      const nameA = (a.metadata.aliasName || a.originalFilename).toLowerCase();
      const nameB = (b.metadata.aliasName || b.originalFilename).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [files, selectedCategory, searchTerm, sortMode]);

  // Group files by folder unconditionally
  const groupedByFolder = useMemo(() => {
    const groups: Record<string, SandboxFile[]> = {};
    for (const file of filteredAndSortedFiles) {
      const folder = file.metadata.folder?.trim() || 'General';
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push(file);
    }
    return groups;
  }, [filteredAndSortedFiles]);

  const toggleFolder = (folderName: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderName)) next.delete(folderName);
      else next.add(folderName);
      return next;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData('text/plain', fileId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedFileId(fileId);
  };

  const handleDragEnd = () => {
    setDraggedFileId(null);
    setDragOverFolder(null);
  };

  const handleDragOverFolder = (e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolder !== folderName) {
      setDragOverFolder(folderName);
    }
  };

  const handleDragLeaveFolder = (e: React.DragEvent, folderName: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverFolder === folderName) {
      setDragOverFolder(null);
    }
  };

  const handleDropOnFolder = (e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    const droppedFileId = e.dataTransfer.getData('text/plain') || draggedFileId;
    if (droppedFileId && onUpdateFileFolder) {
      onUpdateFileFolder(droppedFileId, targetFolder);
    }
    setDraggedFileId(null);
    setDragOverFolder(null);
  };

  // Create folder action
  const handleConfirmCreateFolder = () => {
    const trimmed = newFolderNameInput.trim();
    if (trimmed && onCreateFolder) {
      onCreateFolder(trimmed);
      setNewFolderNameInput('');
      setIsCreatingFolder(false);
    }
  };

  // Rename folder action
  const handleStartRenameFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderOriginal(folderName);
    setRenameFolderInput(folderName);
  };

  const handleConfirmRenameFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingFolderOriginal && renameFolderInput.trim() && onRenameFolder) {
      onRenameFolder(editingFolderOriginal, renameFolderInput.trim());
      setEditingFolderOriginal(null);
    }
  };

  // Safe early return after all React hooks are declared
  if (isCollapsed) {
    return null;
  }

  return (
    <aside className="w-80 border-r border-rp-highlightMed bg-rp-surface/75 flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Header with Search and Sort Controls */}
      <div className="p-3 border-b border-rp-highlightMed/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-rp-subtle uppercase tracking-wider">
            Files ({filteredAndSortedFiles.length})
          </span>

          <div className="flex items-center gap-1.5">
            {/* Create Folder button */}
            <button
              onClick={() => setIsCreatingFolder((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rp-overlay hover:bg-rp-highlightMed text-rp-foam border border-rp-highlightMed text-[10px] font-medium transition"
              title="Create new folder"
            >
              <FolderPlus className="w-3 h-3" />
              <span>+ Folder</span>
            </button>

            <span className="text-[10px] text-rp-muted">Sort:</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as FileSortMode)}
              className="bg-rp-base border border-rp-highlightMed rounded px-2 py-0.5 text-[11px] text-rp-subtle focus:outline-none focus:border-rp-rose"
            >
              <option value="title">By Title</option>
              <option value="nodes">By Node Count</option>
              <option value="tags">By Tags Count</option>
            </select>
          </div>
        </div>

        {/* Inline Create Folder Input */}
        {isCreatingFolder && (
          <div className="flex items-center gap-1 p-1.5 rounded-lg bg-rp-base border border-rp-foam/40 animate-fadeIn">
            <input
              type="text"
              value={newFolderNameInput}
              onChange={(e) => setNewFolderNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreateFolder();
                if (e.key === 'Escape') setIsCreatingFolder(false);
              }}
              placeholder="New folder name..."
              className="flex-1 bg-transparent px-2 py-0.5 text-xs text-rp-text placeholder-rp-muted focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleConfirmCreateFolder}
              className="p-1 rounded hover:bg-rp-pine/20 text-rp-pine"
              title="Confirm"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsCreatingFolder(false)}
              className="p-1 rounded hover:bg-rp-love/20 text-rp-love"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-rp-muted" />
          <input
            type="text"
            placeholder="Filter files, tags, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-rp-base border border-rp-highlightMed text-xs rounded-lg pl-8 pr-3 py-1.5 text-rp-text placeholder-rp-muted focus:outline-none focus:border-rp-rose"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-rp-rose/20 text-rp-rose border border-rp-rose/30 font-medium'
                  : 'text-rp-subtle hover:text-rp-text bg-rp-overlay/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* File List Grouped by Folder with Drag-and-Drop and Inline Rename */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {filteredAndSortedFiles.length === 0 ? (
          <div className="p-6 text-center text-xs text-rp-muted">
            No JSON trees match your filter.
          </div>
        ) : (
          Object.entries(groupedByFolder).map(([folderName, folderFiles]) => {
            const isFolderCollapsed = collapsedFolders.has(folderName);
            const isDragOver = dragOverFolder === folderName;
            const isEditingThisFolder = editingFolderOriginal === folderName;

            return (
              <div 
                key={folderName} 
                className={`space-y-1.5 rounded-xl p-1 transition-colors ${
                  isDragOver 
                    ? 'bg-rp-pine/20 ring-2 ring-rp-pine border border-rp-pine/40' 
                    : ''
                }`}
                onDragOver={(e) => handleDragOverFolder(e, folderName)}
                onDragLeave={(e) => handleDragLeaveFolder(e, folderName)}
                onDrop={(e) => handleDropOnFolder(e, folderName)}
              >
                {/* Folder Header */}
                <div
                  onClick={() => toggleFolder(folderName)}
                  className={`group/folder flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition ${
                    isDragOver 
                      ? 'bg-rp-pine/30 text-rp-foam font-bold' 
                      : 'hover:bg-rp-overlay/60 text-rp-subtle'
                  }`}
                  title="Click to collapse/expand, or drag and drop files here"
                >
                  {isEditingThisFolder ? (
                    <div 
                      className="flex items-center gap-1 flex-1 mr-2" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={renameFolderInput}
                        onChange={(e) => setRenameFolderInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRenameFolder(e as any);
                          if (e.key === 'Escape') setEditingFolderOriginal(null);
                        }}
                        className="w-full bg-rp-base border border-rp-gold text-xs px-1.5 py-0.5 rounded text-rp-text focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleConfirmRenameFolder}
                        className="p-1 hover:bg-rp-pine/20 text-rp-pine rounded"
                        title="Save folder name"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolderOriginal(null);
                        }}
                        className="p-1 hover:bg-rp-love/20 text-rp-love rounded"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rp-text min-w-0 flex-1">
                      {isFolderCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-rp-muted shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-rp-muted shrink-0" />
                      )}
                      {isFolderCollapsed ? (
                        <Folder className="w-4 h-4 text-rp-gold shrink-0" />
                      ) : (
                        <FolderOpen className="w-4 h-4 text-rp-gold shrink-0" />
                      )}
                      <span className="truncate">{folderName}</span>

                      {/* Rename folder button */}
                      <button
                        onClick={(e) => handleStartRenameFolder(folderName, e)}
                        className="opacity-0 group-hover/folder:opacity-100 p-1 text-rp-muted hover:text-rp-text rounded transition ml-1 shrink-0"
                        title="Rename this folder"
                      >
                        <Edit3 className="w-3 h-3 text-rp-gold" />
                      </button>
                    </div>
                  )}

                  <span className="text-[10px] text-rp-muted font-mono bg-rp-base/60 px-1.5 py-0.2 rounded border border-rp-highlightMed/60 shrink-0">
                    {folderFiles.length}
                  </span>
                </div>

                {/* Folder Content with draggable file cards */}
                {!isFolderCollapsed && (
                  <div className="space-y-1.5 pl-2">
                    {folderFiles.map((file) => {
                      const isActive = file.id === activeFileId;
                      const isFileBeingDragged = draggedFileId === file.id;

                      return (
                        <div
                          key={file.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, file.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onSelectFile(file.id)}
                          className={`group relative p-2.5 rounded-xl border transition cursor-grab active:cursor-grabbing ${
                            isFileBeingDragged ? 'opacity-40 scale-95 border-dashed border-rp-rose' : ''
                          } ${
                            isActive
                              ? 'bg-rp-overlay border-rp-rose/50 text-rp-text shadow-sm'
                              : 'bg-rp-base/80 hover:bg-rp-overlay/70 border-rp-highlightMed/70 text-rp-subtle'
                          }`}
                        >
                          {/* Title & Edit Button */}
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <GripVertical className="w-3.5 h-3.5 text-rp-muted/50 group-hover:text-rp-muted shrink-0 cursor-grab" />
                              <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-rp-rose' : 'text-rp-subtle'}`} />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-xs truncate text-rp-text">
                                  {file.metadata.aliasName || file.originalFilename}
                                </div>
                                {file.metadata.aliasName && (
                                  <div className="text-[10px] text-rp-muted font-mono truncate">
                                    orig: {file.originalFilename}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Edit Button opens Metadata Panel */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenMetadataForFile(file.id);
                              }}
                              className="p-1 text-rp-muted hover:text-rp-text hover:bg-rp-highlightMed rounded transition"
                              title="Edit File Metadata (Alias, Folder, Tags, Notes)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Tree Metrics */}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-rp-subtle font-mono">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3 text-rp-foam" />
                              {file.nodeCount} nodes
                            </span>
                            <span className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3 text-rp-pine" />
                              {file.branchCount} branches
                            </span>
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3 text-rp-gold" />
                              depth {file.maxDepth}
                            </span>
                          </div>

                          {/* Tags and Category */}
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {file.metadata.category && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rp-overlay text-rp-subtle font-medium border border-rp-highlightMed">
                                {file.metadata.category}
                              </span>
                            )}
                            {(file.metadata.tags || []).slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-rp-pine/15 text-rp-foam border border-rp-pine/30"
                              >
                                #{tag}
                              </span>
                            ))}
                            {(file.metadata.tags || []).length > 2 && (
                              <span className="text-[9px] text-rp-muted font-mono">
                                +{(file.metadata.tags || []).length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
