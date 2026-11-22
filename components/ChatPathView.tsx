import React, { useState, useMemo, useEffect } from 'react';
import { 
  GitBranch, 
  User, 
  Bot, 
  Copy, 
  Check, 
  Star, 
  ArrowUpDown, 
  StickyNote, 
  Save,
  Edit2,
  Plus,
  X,
  ArrowDownUp,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { TreeNode, BranchMeta, AppSettings } from '../types';
import { extractConversationPaths } from '../services/treeRebaseService';

interface ChatPathViewProps {
  rootNodes: TreeNode[];
  onSelectNode: (node: TreeNode) => void;
  branchMeta?: Record<string, BranchMeta>;
  starredBranches?: string[];
  onUpdateBranchMeta: (branchId: string, meta: Partial<BranchMeta>) => void;
  onToggleStarBranch: (branchId: string) => void;
  settings: AppSettings;
}

// Markdown Renderer supporting ***bold-italic***, **bold**, *italic*, `code`, and newlines
function renderMarkdownContent(content: string): React.ReactNode {
  if (!content) return null;

  const lines = content.split('\n');

  return lines.map((line, lineIndex) => {
    const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const parts = line.split(regex);

    const renderedLine = parts.map((part, partIndex) => {
      if (part.startsWith('***') && part.endsWith('***')) {
        return (
          <strong key={partIndex} className="font-bold italic text-rp-rose">
            {part.slice(3, -3)}
          </strong>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={partIndex} className="font-bold text-rp-text">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={partIndex} className="italic text-rp-rose">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={partIndex} className="px-1.5 py-0.5 rounded bg-rp-overlay text-rp-gold font-mono text-[12px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

    return (
      <React.Fragment key={lineIndex}>
        {renderedLine}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export const ChatPathView: React.FC<ChatPathViewProps> = ({ 
  rootNodes, 
  onSelectNode,
  branchMeta = {},
  starredBranches = [],
  onUpdateBranchMeta,
  onToggleStarBranch,
  settings,
}) => {
  const rawPaths = useMemo(() => extractConversationPaths(rootNodes), [rootNodes]);
  
  // Default sorting set to 'length-desc' (longest first)
  const [sortMode, setSortMode] = useState<'default' | 'length-desc' | 'length-asc'>('length-desc');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [messageOrder, setMessageOrder] = useState<'oldest-first' | 'newest-first'>('oldest-first');
  const [copied, setCopied] = useState(false);

  // Collapsible Threads List Panel
  const [isThreadsPanelCollapsed, setIsThreadsPanelCollapsed] = useState(false);

  // Thread customization drawer state
  const [isEditingHeader, setIsEditingHeader] = useState<boolean>(false);
  const [threadNameInput, setThreadNameInput] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const [newTagInput, setNewTagInput] = useState<string>('');

  // Sorted and pinned list (default longest first)
  const sortedPaths = useMemo(() => {
    const list = [...rawPaths];
    if (sortMode === 'length-desc') {
      list.sort((a, b) => b.pathNodes.length - a.pathNodes.length);
    } else if (sortMode === 'length-asc') {
      list.sort((a, b) => a.pathNodes.length - b.pathNodes.length);
    }

    return list.sort((a, b) => {
      const aStarred = starredBranches.includes(a.id) ? 1 : 0;
      const bStarred = starredBranches.includes(b.id) ? 1 : 0;
      return bStarred - aStarred;
    });
  }, [rawPaths, sortMode, starredBranches]);

  useEffect(() => {
    if (sortedPaths.length > 0 && (!selectedBranchId || !sortedPaths.find((p) => p.id === selectedBranchId))) {
      setSelectedBranchId(sortedPaths[0].id);
    }
  }, [sortedPaths, selectedBranchId]);

  const activePath = sortedPaths.find((p) => p.id === selectedBranchId) || sortedPaths[0];
  const activeMeta = activePath ? branchMeta[activePath.id] || {} : {};

  // Displayed nodes based on chronological or reverse order
  const displayedNodes = useMemo(() => {
    if (!activePath) return [];
    if (messageOrder === 'newest-first') {
      return [...activePath.pathNodes].reverse();
    }
    return activePath.pathNodes;
  }, [activePath, messageOrder]);

  // Keep inputs synchronized when switching thread
  useEffect(() => {
    if (activePath) {
      setThreadNameInput(activeMeta.customName || '');
      setNoteInput(activeMeta.notes || '');
      setNewTagInput('');
      setIsEditingHeader(false);
    }
  }, [activePath?.id, activeMeta.customName, activeMeta.notes]);

  const handleCopyTranscript = () => {
    if (!activePath) return;
    const text = activePath.pathNodes
      .map(
        (n) =>
          `[${n.type.toUpperCase()}]\n${n.content}${
            n.thought ? `\n(Thought: ${n.thought})` : ''
          }\n`
      )
      .join('\n-------------------------\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveThreadDetails = () => {
    if (!activePath) return;
    onUpdateBranchMeta(activePath.id, {
      customName: threadNameInput.trim() || undefined,
      notes: noteInput,
    });
    setIsEditingHeader(false);
  };

  const handleAddThreadTag = () => {
    if (!activePath) return;
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (!trimmed) return;

    const existingTags = activeMeta.tags || [];
    if (!existingTags.includes(trimmed)) {
      onUpdateBranchMeta(activePath.id, {
        tags: [...existingTags, trimmed]
      });
      setNewTagInput('');
    }
  };

  const handleRemoveThreadTag = (tagToRemove: string) => {
    if (!activePath) return;
    const existingTags = activeMeta.tags || [];
    onUpdateBranchMeta(activePath.id, {
      tags: existingTags.filter((t) => t !== tagToRemove)
    });
  };

  if (rawPaths.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-rp-muted text-xs">
        No conversation branches found in this tree.
      </div>
    );
  }

  // Dynamic text size class
  const textSizeClass = 
    settings.fontSize === 'small' ? 'text-xs leading-relaxed' :
    settings.fontSize === 'large' ? 'text-base leading-relaxed' :
    'text-sm leading-relaxed';

  return (
    <div className="flex-1 flex h-[calc(100vh-3.5rem)] bg-rp-base overflow-hidden">
      {/* Collapsible Branch selector column */}
      {!isThreadsPanelCollapsed && (
        <div className="w-80 border-r border-rp-highlightMed bg-rp-surface flex flex-col flex-shrink-0 animate-fadeIn">
          <div className="p-3 border-b border-rp-highlightMed flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rp-text">
              <GitBranch className="w-4 h-4 text-rp-pine" />
              <span>Threads ({sortedPaths.length})</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setSortMode((prev) =>
                    prev === 'length-desc'
                      ? 'length-asc'
                      : prev === 'length-asc'
                      ? 'default'
                      : 'length-desc'
                  );
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rp-overlay border border-rp-highlightMed text-rp-subtle hover:text-rp-text transition text-[11px]"
                title="Sort by turn count"
              >
                <ArrowUpDown className="w-3 h-3 text-rp-foam" />
                <span>
                  {sortMode === 'length-desc'
                    ? 'Longest'
                    : sortMode === 'length-asc'
                    ? 'Shortest'
                    : 'Default'}
                </span>
              </button>

              <button
                onClick={() => setIsThreadsPanelCollapsed(true)}
                className="p-1 text-rp-muted hover:text-rp-text hover:bg-rp-overlay rounded-lg transition"
                title="Collapse Threads Panel"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {sortedPaths.map((p, idx) => {
              const isSelected = p.id === activePath?.id;
              const isStarred = starredBranches.includes(p.id);
              const meta = branchMeta[p.id] || {};
              const displayName = meta.customName || `Branch #${idx + 1}`;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedBranchId(p.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-rp-overlay border-rp-rose text-rp-text shadow-md'
                      : 'bg-rp-base/90 border-rp-highlightMed hover:border-rp-highlightHigh text-rp-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                    <div className="flex items-center gap-1.5 truncate flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStarBranch(p.id);
                        }}
                        className="p-0.5 rounded hover:scale-110 transition shrink-0"
                        title={isStarred ? 'Unstar Thread (marks tree graph)' : 'Star Thread (marks tree graph)'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isStarred
                              ? 'fill-rp-gold text-rp-gold'
                              : 'text-rp-muted hover:text-rp-gold'
                          }`}
                        />
                      </button>
                      <span className="text-rp-rose truncate font-medium">{displayName}</span>
                    </div>

                    <span className="font-mono text-rp-muted text-[10px] shrink-0 ml-1">
                      {p.pathNodes.length} turns
                    </span>
                  </div>

                  <p className="text-xs text-rp-text line-clamp-2 leading-relaxed">
                    {p.summary}
                  </p>

                  {/* Tags on item */}
                  {meta.tags && meta.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {meta.tags.slice(0, 2).map((t, tIdx) => (
                        <span key={tIdx} className="text-[9px] px-1.5 py-0.2 rounded bg-rp-pine/20 text-rp-foam border border-rp-pine/30">
                          #{t}
                        </span>
                      ))}
                      {meta.tags.length > 2 && (
                        <span className="text-[9px] text-rp-muted font-mono">+{meta.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-2 text-[10px] text-rp-muted flex items-center justify-between font-mono">
                    <span>Leaf ID #{p.leafNodeId}</span>
                    {meta.notes && (
                      <span className="flex items-center gap-1 text-rp-iris font-sans text-[10px] font-medium">
                        <StickyNote className="w-3 h-3" /> Has Note
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transcript Main View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header with branch actions, rename, and chronological order switch */}
        <div className="border-b border-rp-highlightMed bg-rp-surface px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Show toggle button when threads panel is collapsed */}
            {isThreadsPanelCollapsed && (
              <button
                onClick={() => setIsThreadsPanelCollapsed(false)}
                className="p-1.5 rounded-lg bg-rp-overlay border border-rp-highlightMed text-rp-subtle hover:text-rp-text transition mr-1"
                title="Open Threads Panel"
              >
                <PanelLeftOpen className="w-4 h-4 text-rp-rose" />
              </button>
            )}

            <button
              onClick={() => onToggleStarBranch(activePath.id)}
              className="p-1 rounded hover:bg-rp-overlay transition flex-shrink-0"
              title={starredBranches.includes(activePath.id) ? 'Unstar this thread' : 'Star this thread'}
            >
              <Star
                className={`w-5 h-5 ${
                  starredBranches.includes(activePath.id)
                    ? 'fill-rp-gold text-rp-gold'
                    : 'text-rp-muted hover:text-rp-gold'
                }`}
              />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-rp-text truncate">
                  {activeMeta.customName || 'Untitled Thread Branch'}
                </span>
                <button
                  onClick={() => setIsEditingHeader((prev) => !prev)}
                  className={`p-1 rounded transition flex-shrink-0 ${
                    isEditingHeader 
                      ? 'bg-rp-rose/20 text-rp-rose border border-rp-rose/30' 
                      : 'text-rp-muted hover:text-rp-text hover:bg-rp-overlay'
                  }`}
                  title={isEditingHeader ? 'Close Thread Customization' : 'Edit Thread Info & Notes'}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-[11px] text-rp-muted font-mono truncate">
                {activePath.pathNodes.length} messages in sequence • Leaf ID #{activePath.leafNodeId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Chronological order switcher */}
            <button
              onClick={() =>
                setMessageOrder((prev) =>
                  prev === 'oldest-first' ? 'newest-first' : 'oldest-first'
                )
              }
              className="flex items-center gap-1.5 text-xs bg-rp-overlay hover:bg-rp-highlightMed text-rp-text border border-rp-highlightMed px-2.5 py-1.5 rounded-lg transition"
              title={messageOrder === 'oldest-first' ? 'Switch to Newest-to-Oldest' : 'Switch to Oldest-to-Newest'}
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-rp-foam" />
              <span>{messageOrder === 'oldest-first' ? 'Oldest → Newest' : 'Newest → Oldest'}</span>
            </button>

            <button
              onClick={handleCopyTranscript}
              className="flex items-center gap-1 text-xs bg-rp-overlay hover:bg-rp-highlightMed text-rp-text border border-rp-highlightMed px-2.5 py-1.5 rounded-lg transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-rp-pine" />
                  <span className="text-rp-pine font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Thread Details Drawer */}
        {isEditingHeader && (
          <div className="p-3 bg-rp-surface/90 border-b border-rp-highlightMed px-6 text-xs space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-rp-subtle font-semibold text-[11px] uppercase tracking-wider">
                Thread Customization (Visible in Tree Graph)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingHeader(false)}
                  className="px-2.5 py-1 rounded-lg bg-rp-overlay hover:bg-rp-highlightMed text-rp-muted hover:text-rp-text text-[11px] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveThreadDetails}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rp-iris hover:opacity-90 text-rp-base font-bold transition text-[11px]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Thread Info</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Rename Input */}
              <div>
                <label className="block text-rp-muted font-medium mb-1 text-[11px]">
                  Thread Name / Scenario Title
                </label>
                <input
                  type="text"
                  value={threadNameInput}
                  onChange={(e) => setThreadNameInput(e.target.value)}
                  placeholder="e.g. Meltdown Branch B: Emotional Meltdown with Crying"
                  className="w-full bg-rp-base border border-rp-highlightMed rounded-lg px-2.5 py-1.5 text-rp-text placeholder-rp-muted focus:outline-none focus:border-rp-rose text-xs"
                />
              </div>

              {/* Tag Management */}
              <div>
                <label className="block text-rp-muted font-medium mb-1 text-[11px]">
                  Thread Tags
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddThreadTag();
                      }
                    }}
                    placeholder="Add tag and press Enter..."
                    className="flex-1 bg-rp-base border border-rp-highlightMed rounded-lg px-2.5 py-1.5 text-rp-text placeholder-rp-muted focus:outline-none focus:border-rp-foam text-xs"
                  />
                  <button
                    onClick={handleAddThreadTag}
                    className="p-1.5 bg-rp-overlay hover:bg-rp-highlightMed text-rp-text rounded-lg border border-rp-highlightMed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tag Badges */}
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {(activeMeta.tags || []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rp-overlay text-rp-foam border border-rp-highlightMed font-medium"
                    >
                      #{t}
                      <button
                        onClick={() => handleRemoveThreadTag(t)}
                        className="hover:text-rp-love transition"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Textarea */}
            <div>
              <label className="block text-rp-muted font-medium mb-1 text-[11px] flex items-center gap-1">
                <StickyNote className="w-3 h-3 text-rp-iris" />
                <span>Notes for this Thread Branch</span>
              </label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Add your notes, character critiques, or writing reminders for this specific thread path..."
                className="w-full h-16 bg-rp-base border border-rp-highlightMed rounded-lg p-2 text-rp-text placeholder-rp-muted text-xs resize-none focus:outline-none focus:border-rp-iris leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Message Thread with integrated Rosé Pine scrollbar */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
          {displayedNodes.map((node, i) => {
            const isUser = node.type === 'user';
            const turnNumber = messageOrder === 'oldest-first' ? i + 1 : displayedNodes.length - i;

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`p-4 rounded-xl border transition cursor-pointer shadow-lg ${
                  isUser
                    ? 'bg-rp-surface border-rp-highlightMed hover:border-rp-highlightHigh ml-8'
                    : 'bg-rp-surface/80 border-rp-highlightMed hover:border-rp-highlightHigh mr-8'
                }`}
              >
                {/* Node metadata */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isUser ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-rp-foam bg-rp-foam/10 px-2 py-0.5 rounded border border-rp-foam/20">
                        <User className="w-3.5 h-3.5" /> User
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-rp-rose bg-rp-rose/10 px-2 py-0.5 rounded border border-rp-rose/20">
                        <Bot className="w-3.5 h-3.5" /> Assistant
                      </span>
                    )}
                    <span className="text-rp-muted font-mono text-[11px]">
                      Turn #{turnNumber} (Node #{node.id})
                    </span>
                  </div>

                  {node.thought && settings.showThoughts && (
                    <span className="flex items-center gap-1 text-[11px] text-rp-gold bg-rp-gold/15 px-2 py-0.5 rounded border border-rp-gold/30">
                      Thought Process
                    </span>
                  )}
                </div>

                {/* Thought box (rendered only when settings.showThoughts is true) */}
                {node.thought && settings.showThoughts && (
                  <div className="mb-2.5 p-2.5 rounded-lg bg-rp-base border border-rp-gold/30 text-rp-gold text-xs italic font-mono leading-relaxed">
                    <span className="font-semibold text-rp-gold not-italic block mb-0.5 text-[10px] uppercase tracking-wider">
                      Internal Chain of Thought:
                    </span>
                    {renderMarkdownContent(node.thought)}
                  </div>
                )}

                {/* Content text with markdown asterisks support */}
                <div className={`text-rp-text whitespace-pre-wrap font-normal ${textSizeClass}`}>
                  {node.content ? (
                    renderMarkdownContent(node.content)
                  ) : (
                    <span className="text-rp-muted italic">[Empty content response]</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
