import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TreeView } from './components/TreeView';
import { ChatPathView } from './components/ChatPathView';
import { NodeInspectorModal } from './components/NodeInspectorModal';
import { RebaseModal } from './components/RebaseModal';
import { SandboxMetadataPanel } from './components/SandboxMetadataPanel';
import { SettingsModal } from './components/SettingsModal';
import { 
  INITIAL_PRESET_FILES, 
  DEFAULT_SETTINGS,
  STORAGE_KEY_FILES,
  STORAGE_KEY_ACTIVE_ID,
  STORAGE_KEY_WORKSPACE,
  STORAGE_KEY_VIEWMODE,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_TRANSFORM
} from './constants';
import { 
  SandboxFile, 
  TreeNode, 
  ViewMode, 
  RebaseDiffResult, 
  BranchMeta, 
  AppSettings, 
  GraphTransformState 
} from './types';
import { calculateTreeMetrics } from './services/treeRebaseService';
import { Layers, Copy, Check, FileCode2 } from 'lucide-react';

/**
 * Strips date or timestamp suffixes from filename formatted like `title_DATEDATE`
 * Example: 'convo_analysis_20241012' -> 'convo_analysis' or 'story_2023-08-01.json' -> 'story'
 */
function cleanJsonFilename(rawName: string): string {
  // Strip trailing .json extension
  const withoutExt = rawName.replace(/\.json$/i, '');
  
  // If format is like 'title_20231011' or 'title_1697042000' or 'title_2024-05-12'
  // Match standard title before date or timestamp
  const dateRegex = /^(.*?)_(\d{4}[-_]?\d{2}[-_]?\d{2}.*|\d{8,14}|\d{4}\.\d{2}\.\d{2}.*)$/i;
  const match = withoutExt.match(dateRegex);
  if (match && match[1]?.trim()) {
    return match[1].trim();
  }

  // Generic fallback: if there is an underscore and the part after consists primarily of digits
  const parts = withoutExt.split('_');
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    if (/^\d+/.test(lastPart)) {
      return parts.slice(0, parts.length - 1).join('_').trim();
    }
  }

  return withoutExt;
}

export default function App() {
  // Reliable hydration flag to prevent premature state overwrite on mount
  const isHydratedRef = useRef(false);

  // Load initial persistent state from localStorage
  const [files, setFiles] = useState<SandboxFile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load files from localStorage', e);
    }
    return INITIAL_PRESET_FILES;
  });

  const [workspaceName, setWorkspaceName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKSPACE);
      if (saved && saved.trim()) return saved;
    } catch {}
    return 'JSON Sandbox';
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (saved) return saved;
    } catch {}
    return 'sample-eli-caelus-v1';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VIEWMODE);
      if (saved && (saved === 'graph' || saved === 'thread' || saved === 'raw')) {
        return saved as ViewMode;
      }
    } catch {}
    return 'thread'; // default view set to path thread
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [graphTransform, setGraphTransform] = useState<GraphTransformState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSFORM);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      zoom: 1,
      x: 60,
      y: 60,
      orientation: 'vertical',
    };
  });

  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isRebaseModalOpen, setIsRebaseModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [rawCopied, setRawCopied] = useState(false);

  // Collapsible panel states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMetadataCollapsed, setIsMetadataCollapsed] = useState(true);

  // Hidden inputs for folder or file upload
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mark hydration complete after first render
  useEffect(() => {
    isHydratedRef.current = true;
  }, []);

  // Sync state to localStorage whenever changed, but ONLY after hydration
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
    } catch (e) {
      console.warn('Storage quota exceeded for files', e);
    }
  }, [files]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY_WORKSPACE, workspaceName);
    } catch {}
  }, [workspaceName]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeFileId);
    } catch {}
  }, [activeFileId]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY_VIEWMODE, viewMode);
    } catch {}
  }, [viewMode]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY_TRANSFORM, JSON.stringify(graphTransform));
    } catch {}
  }, [graphTransform]);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleUpdateMetadata = (fileId: string, updates: Partial<SandboxFile['metadata']>) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            metadata: {
              ...f.metadata,
              ...updates,
              lastModifiedTimestamp: Date.now()
            }
          };
        }
        return f;
      })
    );
  };

  const handleUpdateFileFolder = (fileId: string, newFolder: string) => {
    handleUpdateMetadata(fileId, { folder: newFolder });
  };

  // Rename a folder across all files in that folder
  const handleRenameFolder = (oldFolderName: string, newFolderName: string) => {
    const trimmed = newFolderName.trim();
    if (!trimmed || trimmed === oldFolderName) return;

    setFiles((prev) =>
      prev.map((f) => {
        const currentFolder = f.metadata.folder || 'General';
        if (currentFolder === oldFolderName) {
          return {
            ...f,
            metadata: {
              ...f.metadata,
              folder: trimmed,
              lastModifiedTimestamp: Date.now()
            }
          };
        }
        return f;
      })
    );
  };

  // Create a new folder by moving the currently active file or creating a dummy placeholder
  const handleCreateFolder = (newFolderName: string) => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    if (activeFile) {
      handleUpdateMetadata(activeFile.id, { folder: trimmed });
    }
  };

  const handleOpenFileMetadata = (fileId: string) => {
    setActiveFileId(fileId);
    setIsMetadataCollapsed(false);
  };

  const handleSaveNodeAnnotation = (nodeId: string | number, text: string) => {
    if (!activeFile) return;
    const annotations = { ...(activeFile.metadata.nodeAnnotations || {}) };
    if (text.trim()) {
      annotations[nodeId] = text.trim();
    } else {
      delete annotations[nodeId];
    }
    handleUpdateMetadata(activeFile.id, { nodeAnnotations: annotations });
  };

  const handleUpdateBranchMeta = (branchId: string, metaUpdates: Partial<BranchMeta>) => {
    if (!activeFile) return;
    const branchMetaMap = { ...(activeFile.metadata.branchMeta || {}) };
    const current = branchMetaMap[branchId] || {};
    branchMetaMap[branchId] = {
      ...current,
      ...metaUpdates,
    };
    handleUpdateMetadata(activeFile.id, { branchMeta: branchMetaMap });
  };

  const handleToggleStarBranch = (branchId: string) => {
    if (!activeFile) return;
    const starred = [...(activeFile.metadata.starredBranches || [])];
    const index = starred.indexOf(branchId);
    if (index >= 0) {
      starred.splice(index, 1);
    } else {
      starred.push(branchId);
    }
    handleUpdateMetadata(activeFile.id, { starredBranches: starred });
  };

  const handleApplyRebase = (result: RebaseDiffResult, newRawJson: string) => {
    if (!activeFile) return;
    const metrics = calculateTreeMetrics(result.rebasedTree);

    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === activeFile.id) {
          return {
            ...f,
            rootNodes: result.rebasedTree,
            nodeCount: metrics.nodeCount,
            maxDepth: metrics.maxDepth,
            branchCount: metrics.branchCount,
            rawJsonString: newRawJson || JSON.stringify(result.rebasedTree, null, 2),
            metadata: {
              ...f.metadata,
              notes: `${f.metadata.notes ? f.metadata.notes + '\n\n' : ''}[Rebased: +${result.addedNodesCount} new nodes added]`,
              lastModifiedTimestamp: Date.now()
            }
          };
        }
        return f;
      })
    );
  };

  /**
   * Opening a directory:
   * 1. Replaces any placeholder JSONs
   * 2. Sets the workspace name to the folder name
   * 3. Disregards any dates (_DATEDATE) in file names
   * 4. Sets default view to 'thread' (Path Thread)
   */
  const handleDirectoryFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const jsonFiles = filesArray.filter((f) => f.name.toLowerCase().endsWith('.json'));

    if (jsonFiles.length === 0) {
      alert('No JSON files found in the selected directory.');
      return;
    }

    let rootFolderName = 'Imported Folder';
    const sampleRelativePath = jsonFiles[0].webkitRelativePath || '';
    if (sampleRelativePath) {
      const parts = sampleRelativePath.split('/');
      if (parts.length > 0 && parts[0]) {
        rootFolderName = parts[0];
      }
    }

    setWorkspaceName(rootFolderName);

    const loadedFiles: SandboxFile[] = [];
    let completedCount = 0;

    jsonFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          let parsed = JSON.parse(content);
          if (!Array.isArray(parsed)) {
            parsed = [parsed];
          }
          const metrics = calculateTreeMetrics(parsed as TreeNode[]);

          // Infer subfolder inside the opened directory without preserving the root folder itself
          let subfolder = 'General';
          if (file.webkitRelativePath) {
            const parts = file.webkitRelativePath.split('/');
            if (parts.length > 2) {
              subfolder = parts.slice(1, -1).join('/');
            }
          }

          // Disregard dates (e.g. title_20231011 -> title)
          const cleanAlias = cleanJsonFilename(file.name);

          const newFile: SandboxFile = {
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            originalFilename: file.name,
            filePath: file.webkitRelativePath || file.name,
            rootNodes: parsed,
            rawJsonString: content,
            nodeCount: metrics.nodeCount,
            maxDepth: metrics.maxDepth,
            branchCount: metrics.branchCount,
            metadata: {
              aliasName: cleanAlias,
              category: 'Imported',
              folder: subfolder,
              tags: ['N-Ary Tree'],
              notes: `Imported from ${rootFolderName} on ${new Date().toLocaleDateString()}`,
              nodeAnnotations: {},
              branchMeta: {},
              starredBranches: []
            }
          };

          loadedFiles.push(newFile);
        } catch (err) {
          console.error(`Error parsing ${file.name}:`, err);
        } finally {
          completedCount++;
          if (completedCount === jsonFiles.length) {
            if (loadedFiles.length > 0) {
              // Immediately commit new files to state and localStorage
              setFiles(loadedFiles);
              setActiveFileId(loadedFiles[0].id);
              setViewMode('thread'); // Default view when opening is path thread!
              try {
                localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(loadedFiles));
                localStorage.setItem(STORAGE_KEY_ACTIVE_ID, loadedFiles[0].id);
                localStorage.setItem(STORAGE_KEY_WORKSPACE, rootFolderName);
                localStorage.setItem(STORAGE_KEY_VIEWMODE, 'thread');
              } catch (err) {
                console.warn('Storage sync error on folder open:', err);
              }
            }
          }
        }
      };
      reader.readAsText(file);
    });

    e.target.value = '';
  };

  // Import single JSON file
  const handleSingleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      if (!file.name.toLowerCase().endsWith('.json')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          let parsed = JSON.parse(content);
          if (!Array.isArray(parsed)) {
            parsed = [parsed];
          }
          const metrics = calculateTreeMetrics(parsed as TreeNode[]);
          const cleanAlias = cleanJsonFilename(file.name);

          const newFile: SandboxFile = {
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            originalFilename: file.name,
            filePath: file.name,
            rootNodes: parsed,
            rawJsonString: content,
            nodeCount: metrics.nodeCount,
            maxDepth: metrics.maxDepth,
            branchCount: metrics.branchCount,
            metadata: {
              aliasName: cleanAlias,
              category: 'Imported',
              folder: 'General',
              tags: ['N-Ary Tree'],
              notes: `Imported on ${new Date().toLocaleDateString()}`,
              nodeAnnotations: {},
              branchMeta: {},
              starredBranches: []
            }
          };

          setFiles((prev) => [newFile, ...prev]);
          setActiveFileId(newFile.id);
          setViewMode('thread'); // Default view on opening json file is path thread
        } catch (err) {
          console.error(`Error parsing ${file.name}:`, err);
        }
      };
      reader.readAsText(file);
    });

    e.target.value = '';
  };

  const handleExportSandbox = () => {
    if (!activeFile) return;
    const exportBundle = {
      sandboxVersion: '2.1',
      workspaceName,
      exportedAt: new Date().toISOString(),
      originalFilename: activeFile.originalFilename,
      metadata: activeFile.metadata,
      rebasedTree: activeFile.rootNodes
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sandbox_${activeFile.metadata.aliasName?.replace(/\s+/g, '_') || activeFile.originalFilename}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyRawJson = () => {
    if (!activeFile) return;
    const content = activeFile.rawJsonString || JSON.stringify(activeFile.rootNodes, null, 2);
    navigator.clipboard.writeText(content);
    setRawCopied(true);
    setTimeout(() => setRawCopied(false), 2000);
  };

  // Get distinct folders across files
  const allFolders = Array.from(new Set(files.map((f) => f.metadata.folder || 'General')));

  return (
    <div className="flex flex-col h-screen w-screen bg-rp-base text-rp-text overflow-hidden font-sans">
      {/* Hidden file & directory inputs */}
      <input
        ref={directoryInputRef}
        type="file"
        multiple
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        onChange={handleDirectoryFilesSelected}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        multiple
        onChange={handleSingleFilesSelected}
        className="hidden"
      />

      {/* Top Navbar */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenDirectory={() => directoryInputRef.current?.click()}
        onOpenFile={() => fileInputRef.current?.click()}
        onOpenRebase={() => setIsRebaseModalOpen(true)}
        onExportSandbox={handleExportSandbox}
        selectedFileName={activeFile ? (activeFile.metadata.aliasName || activeFile.originalFilename) : ''}
        totalFilesCount={files.length}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        workspaceName={workspaceName}
      />

      {/* Main workspace layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          onSelectFile={(id) => {
            setActiveFileId(id);
            setViewMode('thread'); // Default view when clicking a file is path thread
          }}
          onOpenMetadataForFile={handleOpenFileMetadata}
          isCollapsed={isSidebarCollapsed}
          onUpdateFileFolder={handleUpdateFileFolder}
          onRenameFolder={handleRenameFolder}
          onCreateFolder={handleCreateFolder}
        />

        {/* Central Visualization Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeFile ? (
            <>
              {viewMode === 'graph' && (
                <TreeView
                  rootNodes={activeFile.rootNodes}
                  onSelectNode={setSelectedNode}
                  selectedNodeId={selectedNode?.id || null}
                  nodeAnnotations={activeFile.metadata.nodeAnnotations}
                  starredBranches={activeFile.metadata.starredBranches}
                  branchMeta={activeFile.metadata.branchMeta}
                  savedTransform={graphTransform}
                  onSaveTransform={setGraphTransform}
                />
              )}

              {viewMode === 'thread' && (
                <ChatPathView
                  rootNodes={activeFile.rootNodes}
                  onSelectNode={setSelectedNode}
                  branchMeta={activeFile.metadata.branchMeta}
                  starredBranches={activeFile.metadata.starredBranches}
                  onUpdateBranchMeta={handleUpdateBranchMeta}
                  onToggleStarBranch={handleToggleStarBranch}
                  settings={settings}
                />
              )}

              {viewMode === 'raw' && (
                <div className="flex-1 p-6 overflow-y-auto bg-rp-base font-mono text-xs">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-3 text-rp-subtle">
                      <div className="flex items-center gap-2">
                        <FileCode2 className="w-4 h-4 text-rp-foam" />
                        <span className="font-semibold text-rp-text">Raw JSON Payload</span>
                        <span className="text-[11px] text-rp-muted">({activeFile.originalFilename})</span>
                      </div>

                      {/* Copy Entire Raw JSON Button */}
                      <button
                        onClick={handleCopyRawJson}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rp-overlay hover:bg-rp-highlightMed text-rp-text border border-rp-highlightMed transition text-xs font-semibold shadow-sm"
                        title="Copy complete raw JSON to clipboard"
                      >
                        {rawCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-rp-pine" />
                            <span className="text-rp-pine">Copied Whole JSON</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-rp-foam" />
                            <span>Copy Whole JSON</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-rp-surface border border-rp-highlightMed text-rp-foam overflow-x-auto whitespace-pre-wrap shadow-xl">
                      {activeFile.rawJsonString || JSON.stringify(activeFile.rootNodes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-rp-muted">
              <Layers className="w-12 h-12 text-rp-highlightMed mb-3" />
              <p className="text-sm font-semibold text-rp-subtle">No JSON Tree Selected</p>
              <p className="text-xs max-w-sm mt-1 text-rp-muted">
                Open a folder of N-ary conversation JSON files or select an item from the left explorer.
              </p>
            </div>
          )}
        </main>

        {/* Right Sandbox Metadata Drawer */}
        {activeFile && (
          <SandboxMetadataPanel
            file={activeFile}
            onUpdateMetadata={handleUpdateMetadata}
            isCollapsed={isMetadataCollapsed}
            onClose={() => setIsMetadataCollapsed(true)}
            availableFolders={allFolders}
          />
        )}
      </div>

      {/* Node Inspector Slide-over */}
      {selectedNode && (
        <NodeInspectorModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          annotation={activeFile?.metadata?.nodeAnnotations?.[selectedNode.id] || ''}
          onSaveAnnotation={handleSaveNodeAnnotation}
        />
      )}

      {/* Tree Rebase Modal */}
      {isRebaseModalOpen && activeFile && (
        <RebaseModal
          currentBaseNodes={activeFile.rootNodes}
          fileName={activeFile.originalFilename}
          onClose={() => setIsRebaseModalOpen(false)}
          onApplyRebase={handleApplyRebase}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(updates) => setSettings((prev) => ({ ...prev, ...updates }))}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
