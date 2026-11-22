import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  X, 
  Info,
  Folder
} from 'lucide-react';
import { SandboxFile } from '../types';
import { CATEGORIES_PRESET } from '../constants';

interface SandboxMetadataPanelProps {
  file: SandboxFile;
  onUpdateMetadata: (fileId: string, updates: Partial<SandboxFile['metadata']>) => void;
  isCollapsed: boolean;
  onClose: () => void;
  availableFolders?: string[];
}

export const SandboxMetadataPanel: React.FC<SandboxMetadataPanelProps> = ({
  file,
  onUpdateMetadata,
  isCollapsed,
  onClose,
  availableFolders = ['General', 'Storylines', 'Technical Support']
}) => {
  const [alias, setAlias] = useState(file.metadata.aliasName || '');
  const [category, setCategory] = useState(file.metadata.category || 'Uncategorized');
  const [folder, setFolder] = useState(file.metadata.folder || 'General');
  const [customFolder, setCustomFolder] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [notes, setNotes] = useState(file.metadata.notes || '');
  const [tags, setTags] = useState<string[]>(file.metadata.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    setAlias(file.metadata.aliasName || '');
    setCategory(file.metadata.category || 'Uncategorized');
    setFolder(file.metadata.folder || 'General');
    setNotes(file.metadata.notes || '');
    setTags(file.metadata.tags || []);
    setIsCreatingFolder(false);
  }, [file]);

  if (isCollapsed) {
    return null;
  }

  const handleSave = () => {
    onUpdateMetadata(file.id, {
      aliasName: alias.trim(),
      category,
      folder: isCreatingFolder && customFolder.trim() ? customFolder.trim() : folder,
      notes,
      tags
    });
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      const updated = [...tags, trimmed];
      setTags(updated);
      onUpdateMetadata(file.id, { tags: updated });
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    onUpdateMetadata(file.id, { tags: updated });
  };

  const folderOptions = Array.from(new Set([...availableFolders, folder]));

  return (
    <div className="w-80 border-l border-rp-highlightMed bg-rp-surface/90 p-4 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto space-y-4 select-none text-xs shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-rp-highlightMed">
        <span className="font-semibold text-rp-text uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-rp-iris" />
          <span>Edit File Metadata</span>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-rp-iris hover:opacity-90 text-rp-base font-semibold transition text-[11px]"
          >
            <Save className="w-3 h-3" />
            <span>Save</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-rp-muted hover:text-rp-text hover:bg-rp-overlay transition"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Virtual Alias */}
      <div>
        <label className="block text-rp-subtle font-medium mb-1 text-[11px]">
          Virtual Alias (Display Name)
        </label>
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder={file.originalFilename}
          className="w-full bg-rp-base border border-rp-highlightMed rounded-lg px-2.5 py-2 text-rp-text placeholder-rp-muted focus:outline-none focus:border-rp-iris"
        />
        <span className="text-[10px] text-rp-muted mt-1 block font-mono truncate">
          File: {file.originalFilename}
        </span>
      </div>

      {/* Folder Assignment */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-rp-subtle font-medium text-[11px] flex items-center gap-1">
            <Folder className="w-3 h-3 text-rp-gold" />
            <span>Folder</span>
          </label>
          <button
            onClick={() => setIsCreatingFolder((prev) => !prev)}
            className="text-[10px] text-rp-rose hover:underline"
          >
            {isCreatingFolder ? 'Select Existing' : '+ New Folder'}
          </button>
        </div>

        {isCreatingFolder ? (
          <input
            type="text"
            value={customFolder}
            onChange={(e) => setCustomFolder(e.target.value)}
            placeholder="Type new folder name..."
            className="w-full bg-rp-base border border-rp-highlightMed rounded-lg px-2.5 py-1.5 text-rp-text focus:outline-none focus:border-rp-gold text-xs"
          />
        ) : (
          <select
            value={folder}
            onChange={(e) => {
              setFolder(e.target.value);
              onUpdateMetadata(file.id, { folder: e.target.value });
            }}
            className="w-full bg-rp-base border border-rp-highlightMed rounded-lg px-2.5 py-2 text-rp-text focus:outline-none focus:border-rp-gold"
          >
            {folderOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-rp-subtle font-medium mb-1 text-[11px]">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            onUpdateMetadata(file.id, { category: e.target.value });
          }}
          className="w-full bg-rp-base border border-rp-highlightMed rounded-lg px-2.5 py-2 text-rp-text focus:outline-none focus:border-rp-iris"
        >
          {CATEGORIES_PRESET.filter((c) => c !== 'All').map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-rp-subtle font-medium mb-1 text-[11px]">
          Tags & Keywords
        </label>
        <div className="flex items-center gap-1.5 mb-2">
          <input
            type="text"
            placeholder="Add tag..."
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="flex-1 bg-rp-base border border-rp-highlightMed rounded-lg px-2 py-1.5 text-rp-text text-xs placeholder-rp-muted focus:outline-none focus:border-rp-iris"
          />
          <button
            onClick={handleAddTag}
            className="p-1.5 bg-rp-overlay hover:bg-rp-highlightMed text-rp-text rounded-lg border border-rp-highlightMed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rp-overlay text-rp-foam border border-rp-highlightMed"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-rp-love transition"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Global File Notes */}
      <div className="flex-1 flex flex-col">
        <label className="block text-rp-subtle font-medium mb-1 text-[11px]">
          Sandbox File Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Document insights, character dynamics, or prompt iterations..."
          className="w-full flex-1 min-h-[120px] bg-rp-base border border-rp-highlightMed rounded-lg p-2.5 text-rp-text placeholder-rp-muted focus:outline-none focus:border-rp-iris resize-none leading-relaxed"
        />
      </div>

      {/* Tree Statistics */}
      <div className="p-3 bg-rp-base rounded-xl border border-rp-highlightMed space-y-1.5 font-mono text-[11px]">
        <div className="text-rp-subtle font-sans font-semibold text-[10px] uppercase tracking-wider mb-1">
          N-Ary Tree Metrics
        </div>
        <div className="flex justify-between text-rp-text">
          <span>Total Nodes:</span>
          <span className="text-rp-foam font-bold">{file.nodeCount}</span>
        </div>
        <div className="flex justify-between text-rp-text">
          <span>Terminal Branches:</span>
          <span className="text-rp-pine font-bold">{file.branchCount}</span>
        </div>
        <div className="flex justify-between text-rp-text">
          <span>Max Hierarchy Depth:</span>
          <span className="text-rp-gold font-bold">{file.maxDepth}</span>
        </div>
      </div>
    </div>
  );
};
