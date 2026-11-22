import React from 'react';
import { 
  FolderOpen, 
  GitMerge, 
  Upload, 
  Download, 
  Layers, 
  Terminal, 
  FileCode2, 
  FolderTree, 
  Settings,
  Flower2
} from 'lucide-react';
import { ViewMode } from '../types';

interface NavbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenDirectory: () => void;
  onOpenFile: () => void;
  onOpenRebase: () => void;
  onExportSandbox: () => void;
  selectedFileName: string;
  totalFilesCount: number;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  workspaceName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  onOpenDirectory,
  onOpenFile,
  onOpenRebase,
  onExportSandbox,
  selectedFileName,
  totalFilesCount,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenSettings,
  workspaceName,
}) => {
  const displayTitle = workspaceName.trim() || 'JSON Sandbox';

  return (
    <header className="h-14 border-b border-rp-highlightMed bg-rp-surface/95 backdrop-blur px-3.5 flex items-center justify-between text-xs font-medium z-30 select-none">
      {/* Brand & Left Files Toggle */}
      <div className="flex items-center gap-2.5 min-w-0 flex-shrink">
        <button
          onClick={onToggleSidebar}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition flex-shrink-0 ${
            !isSidebarCollapsed 
              ? 'bg-rp-rose/20 border-rp-rose text-rp-rose shadow-sm' 
              : 'bg-rp-overlay border-rp-highlightMed text-rp-subtle hover:text-rp-text hover:border-rp-highlightHigh'
          }`}
          title={isSidebarCollapsed ? 'Open Files Explorer' : 'Hide Files Explorer'}
        >
          <FolderTree className="w-4 h-4" />
          <span className="hidden lg:inline text-[11px] font-semibold">
            Files
          </span>
        </button>

        {/* Dynamic Workspace / Folder Name with text overflow handling */}
        <div 
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rp-rose/10 border border-rp-rose/25 text-rp-rose min-w-0 max-w-[140px] sm:max-w-[200px] md:max-w-[280px]"
          title={displayTitle}
        >
          <Flower2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold tracking-wide uppercase text-[11px] truncate">
            {displayTitle}
          </span>
        </div>

        <div className="h-4 w-px bg-rp-highlightMed hidden sm:block flex-shrink-0" />

        <span className="text-rp-muted hidden sm:inline flex-shrink-0">
          {totalFilesCount} files
        </span>

        {selectedFileName && (
          <span 
            className="text-rp-text font-mono text-[11px] truncate max-w-[130px] md:max-w-[200px] bg-rp-overlay px-2 py-0.5 rounded border border-rp-highlightMed"
            title={selectedFileName}
          >
            {selectedFileName}
          </span>
        )}
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-1 bg-rp-base p-1 rounded-lg border border-rp-highlightMed flex-shrink-0 mx-2">
        <button
          onClick={() => setViewMode('graph')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            viewMode === 'graph'
              ? 'bg-rp-pine text-rp-base font-semibold shadow-sm'
              : 'text-rp-subtle hover:text-rp-text'
          }`}
          title="Tree Graph with Zoom Scroll and Pan Dragging"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tree Graph</span>
        </button>

        <button
          onClick={() => setViewMode('thread')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            viewMode === 'thread'
              ? 'bg-rp-pine text-rp-base font-semibold shadow-sm'
              : 'text-rp-subtle hover:text-rp-text'
          }`}
          title="Path Thread Reader with Pinning & Notes"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Path Thread</span>
        </button>

        <button
          onClick={() => setViewMode('raw')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            viewMode === 'raw'
              ? 'bg-rp-pine text-rp-base font-semibold shadow-sm'
              : 'text-rp-subtle hover:text-rp-text'
          }`}
          title="Raw JSON Payload"
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Raw JSON</span>
        </button>
      </div>

      {/* Action controls & Settings */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onOpenDirectory}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rp-overlay hover:bg-rp-highlightMed text-rp-text border border-rp-highlightMed transition"
          title="Select local directory containing JSON files"
        >
          <FolderOpen className="w-3.5 h-3.5 text-rp-gold" />
          <span className="hidden md:inline">Open Folder</span>
        </button>

        <button
          onClick={onOpenFile}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rp-overlay hover:bg-rp-highlightMed text-rp-text border border-rp-highlightMed transition"
          title="Import single N-ary JSON file"
        >
          <Upload className="w-3.5 h-3.5 text-rp-foam" />
          <span className="hidden md:inline">Import</span>
        </button>

        <button
          onClick={onOpenRebase}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rp-pine hover:opacity-90 text-rp-base font-semibold shadow-sm transition"
          title="Rebase current file with a newer JSON version"
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span>Rebase</span>
        </button>

        <button
          onClick={onExportSandbox}
          className="p-1.5 rounded-lg text-rp-subtle hover:text-rp-text hover:bg-rp-overlay border border-transparent hover:border-rp-highlightMed transition"
          title="Export Sandbox Snapshot & Rebased Tree"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-rp-subtle hover:text-rp-text hover:bg-rp-overlay border border-rp-highlightMed transition"
          title="Application Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
