import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { 
  User, 
  Bot, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Star, 
  StickyNote,
  Columns2,
  Rows2,
  ChevronDownSquare,
  ChevronUpSquare
} from 'lucide-react';
import { TreeNode, BranchMeta, GraphTransformState } from '../types';
import { extractConversationPaths } from '../services/treeRebaseService';

interface TreeViewProps {
  rootNodes: TreeNode[];
  onSelectNode: (node: TreeNode) => void;
  selectedNodeId: number | string | null;
  nodeAnnotations?: Record<string | number, string>;
  starredBranches?: string[];
  branchMeta?: Record<string, BranchMeta>;
  savedTransform?: GraphTransformState;
  onSaveTransform?: (state: GraphTransformState) => void;
}

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  collapsed: boolean;
  hasHiddenRule?: boolean;
  hiddenRuleCount?: number;
  children: LayoutNode[];
}

const DEFAULT_TRANSFORM: GraphTransformState = {
  zoom: 1,
  x: 60,
  y: 60,
  orientation: 'vertical',
};

export const TreeView: React.FC<TreeViewProps> = ({
  rootNodes,
  onSelectNode,
  selectedNodeId,
  nodeAnnotations = {},
  starredBranches = [],
  branchMeta = {},
  savedTransform = DEFAULT_TRANSFORM,
  onSaveTransform,
}) => {
  // Retain transform from saved state (persisting position/zoom across views)
  const [transform, setTransform] = useState<GraphTransformState>(savedTransform);

  // Sync transform if savedTransform updates from outside
  useEffect(() => {
    if (savedTransform) {
      setTransform(savedTransform);
    }
  }, [savedTransform]);

  // Manual collapses
  const [collapsedIds, setCollapsedIds] = useState<Set<string | number>>(new Set());
  // Parents whose collapsed turns are temporarily expanded
  const [expandedShowMoreParentIds, setExpandedShowMoreParentIds] = useState<Set<string | number>>(new Set());
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number }>({
    mouseX: 0,
    mouseY: 0,
    panX: savedTransform.x,
    panY: savedTransform.y,
  });

  // Notify parent of updated transform to preserve position across tab switches and refreshes
  const updateTransform = (next: GraphTransformState | ((prev: GraphTransformState) => GraphTransformState)) => {
    setTransform((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      onSaveTransform?.(resolved);
      return resolved;
    });
  };

  // Map leaf node id and path node ids belonging to starred threads
  const { starredNodeIds, leafBranchMap } = useMemo(() => {
    const paths = extractConversationPaths(rootNodes);
    const starredNodeSet = new Set<string | number>();
    const leafMap = new Map<string | number, { branchId: string; meta?: BranchMeta; isStarred: boolean }>();

    for (const p of paths) {
      const isStarred = starredBranches.includes(p.id);
      const meta = branchMeta[p.id];
      leafMap.set(p.leafNodeId, { branchId: p.id, meta, isStarred });

      if (isStarred) {
        for (const n of p.pathNodes) {
          starredNodeSet.add(n.id);
        }
      }
    }

    return {
      starredNodeIds: starredNodeSet,
      leafBranchMap: leafMap,
    };
  }, [rootNodes, starredBranches, branchMeta]);

  const toggleCollapse = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleShowMore = (parentId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedShowMoreParentIds((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  // Zoom anchored directly at cursor position
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

    updateTransform((prev) => {
      const nextZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.15), 2.5);
      if (nextZoom === prev.zoom) return prev;

      const scaleRatio = nextZoom / prev.zoom;
      const nextX = cursorX - (cursorX - prev.x) * scaleRatio;
      const nextY = cursorY - (cursorY - prev.y) * scaleRatio;

      return {
        ...prev,
        zoom: nextZoom,
        x: nextX,
        y: nextY,
      };
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.tree-node-card') || (e.target as HTMLElement).closest('.tree-show-more-btn')) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: transform.x,
      panY: transform.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    updateTransform((prev) => ({
      ...prev,
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomAtCenter = (factor: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    updateTransform((prev) => {
      const nextZoom = Math.min(Math.max(prev.zoom * factor, 0.15), 2.5);
      const scaleRatio = nextZoom / prev.zoom;
      return {
        ...prev,
        zoom: nextZoom,
        x: cx - (cx - prev.x) * scaleRatio,
        y: cy - (cy - prev.y) * scaleRatio,
      };
    });
  };

  const resetToDefaultView = () => {
    updateTransform(DEFAULT_TRANSFORM);
  };

  // Helper: check if a child node or its subtree has notes, tags, or is starred (EXEMPT from hiding)
  const isNodeExemptFromCollapse = useCallback((childNode: TreeNode): boolean => {
    // 1. Has direct node annotation
    if (nodeAnnotations[childNode.id]) return true;

    // 2. Is on a starred branch
    if (starredNodeIds.has(childNode.id)) return true;

    // 3. Leaf has custom branch metadata, notes or tags
    const leafInfo = leafBranchMap.get(childNode.id);
    if (leafInfo?.meta?.notes || (leafInfo?.meta?.tags && leafInfo.meta.tags.length > 0) || leafInfo?.meta?.customName) {
      return true;
    }

    // 4. Recursive check on children
    if (childNode.children && childNode.children.length > 0) {
      return childNode.children.some(isNodeExemptFromCollapse);
    }

    return false;
  }, [nodeAnnotations, starredNodeIds, leafBranchMap]);

  // Compute 2D tree hierarchy layout applying revised collapsible rule:
  // No node count threshold! Any node fitting criteria is hidden unless starred, noted, or tagged.
  const { layoutRoots, totalWidth, totalHeight } = useMemo(() => {
    const isVert = transform.orientation === 'vertical';
    const NODE_WIDTH = isVert ? 280 : 270;
    const NODE_HEIGHT = isVert ? 125 : 120;
    const PRIMARY_GAP = isVert ? 90 : 100;
    const SECONDARY_GAP = isVert ? 48 : 38;

    let breadthCursor = 40;

    function buildLayout(
      node: TreeNode,
      depth: number,
      collapsedMap: Set<string | number>
    ): LayoutNode {
      const isCollapsed = collapsedMap.has(node.id);
      const childLayouts: LayoutNode[] = [];

      let hasHiddenRule = false;
      let hiddenRuleCount = 0;

      if (!isCollapsed && node.children && node.children.length > 0) {
        const rawChildren = node.children;
        const isShowMoreExpanded = expandedShowMoreParentIds.has(node.id);

        let visibleChildren: TreeNode[] = rawChildren;

        // CASE 1: Children of an assistant node.
        // For ANY user child that only has one child AND that child doesn't have a child of its own:
        // Hide under "show more", UNLESS it has notes, tags, or is starred.
        if (node.type === 'assistant') {
          const keep: TreeNode[] = [];
          const hide: TreeNode[] = [];

          for (const ch of rawChildren) {
            const chChildren = ch.children || [];
            const hasOnlyOneChild = chChildren.length === 1;
            const singleChildHasNoChildren =
              hasOnlyOneChild && (!chChildren[0].children || chChildren[0].children.length === 0);

            const fitsHideCriteria = ch.type === 'user' && hasOnlyOneChild && singleChildHasNoChildren;
            const isExempt = isNodeExemptFromCollapse(ch);

            if (fitsHideCriteria && !isExempt) {
              hide.push(ch);
            } else {
              keep.push(ch);
            }
          }

          if (hide.length > 0) {
            hasHiddenRule = true;
            hiddenRuleCount = hide.length;
            visibleChildren = isShowMoreExpanded ? rawChildren : keep;
          }
        }
        // CASE 2: Children of a user node.
        // For ANY assistant child with 0 children:
        // Hide under "show more", UNLESS it has notes, tags, or is starred.
        else if (node.type === 'user') {
          const keep: TreeNode[] = [];
          const hide: TreeNode[] = [];

          for (const ch of rawChildren) {
            const chChildren = ch.children || [];
            const hasZeroChildren = chChildren.length === 0;

            const fitsHideCriteria = ch.type === 'assistant' && hasZeroChildren;
            const isExempt = isNodeExemptFromCollapse(ch);

            if (fitsHideCriteria && !isExempt) {
              hide.push(ch);
            } else {
              keep.push(ch);
            }
          }

          if (hide.length > 0) {
            hasHiddenRule = true;
            hiddenRuleCount = hide.length;
            visibleChildren = isShowMoreExpanded ? rawChildren : keep;
          }
        }

        for (const child of visibleChildren) {
          childLayouts.push(buildLayout(child, depth + 1, collapsedMap));
        }
      }

      const primaryCoord = depth * ((isVert ? NODE_HEIGHT : NODE_WIDTH) + PRIMARY_GAP) + 40;
      let secondaryCoord = 0;

      if (childLayouts.length === 0) {
        secondaryCoord = breadthCursor;
        breadthCursor += (isVert ? NODE_WIDTH : NODE_HEIGHT) + SECONDARY_GAP;
      } else if (childLayouts.length === 1) {
        secondaryCoord = isVert ? childLayouts[0].x : childLayouts[0].y;
      } else {
        const first = isVert ? childLayouts[0].x : childLayouts[0].y;
        const last = isVert ? childLayouts[childLayouts.length - 1].x : childLayouts[childLayouts.length - 1].y;
        secondaryCoord = (first + last) / 2;
      }

      return {
        node,
        x: isVert ? secondaryCoord : primaryCoord,
        y: isVert ? primaryCoord : secondaryCoord,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        depth,
        collapsed: isCollapsed,
        hasHiddenRule,
        hiddenRuleCount,
        children: childLayouts
      };
    }

    const roots: LayoutNode[] = [];
    for (const r of rootNodes) {
      roots.push(buildLayout(r, 0, collapsedIds));
    }

    let maxX = 1400;
    let maxY = 1000;

    function checkBounds(item: LayoutNode) {
      if (item.x + item.width + 250 > maxX) maxX = item.x + item.width + 250;
      if (item.y + item.height + 250 > maxY) maxY = item.y + item.height + 250;
      item.children.forEach(checkBounds);
    }

    roots.forEach(checkBounds);

    return {
      layoutRoots: roots,
      totalWidth: maxX,
      totalHeight: maxY
    };
  }, [rootNodes, collapsedIds, transform.orientation, expandedShowMoreParentIds, isNodeExemptFromCollapse]);

  // Render connecting lines
  const renderLines = (item: LayoutNode): React.ReactNode => {
    const isVert = transform.orientation === 'vertical';

    return (
      <React.Fragment key={`lines-${item.node.id}`}>
        {item.children.map((child) => {
          let startX = 0;
          let startY = 0;
          let endX = 0;
          let endY = 0;
          let pathString = '';

          if (isVert) {
            startX = item.x + item.width / 2;
            startY = item.y + item.height;
            endX = child.x + child.width / 2;
            endY = child.y;
            const midY = (startY + endY) / 2;
            pathString = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
          } else {
            startX = item.x + item.width;
            startY = item.y + item.height / 2;
            endX = child.x;
            endY = child.y + child.height / 2;
            const midX = (startX + endX) / 2;
            pathString = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
          }

          const isChildStarred = starredNodeIds.has(child.node.id) && starredNodeIds.has(item.node.id);

          return (
            <path
              key={`conn-${item.node.id}-${child.node.id}`}
              d={pathString}
              fill="none"
              stroke={isChildStarred ? '#ffd17c' : child.node._isNew ? '#4192b3' : '#4b4764'}
              strokeWidth={isChildStarred ? 3 : child.node._isNew ? 2.5 : 1.75}
              strokeDasharray={child.node._isNew ? '4 3' : undefined}
              className={isChildStarred ? 'drop-shadow-[0_0_8px_rgba(255,209,124,0.35)]' : ''}
            />
          );
        })}
        {item.children.map(renderLines)}
      </React.Fragment>
    );
  };

  // Render Node Cards
  const renderNodeCards = (item: LayoutNode): React.ReactNode => {
    const isSelected = selectedNodeId === item.node.id;
    const hasChildren = item.node.children && item.node.children.length > 0;
    const isUser = item.node.type === 'user';
    const isAssistant = item.node.type === 'assistant';
    const annotation = nodeAnnotations[item.node.id];
    const isLeaf = !hasChildren;
    const leafData = isLeaf ? leafBranchMap.get(item.node.id) : null;
    const isStarred = Boolean(leafData?.isStarred || (!isLeaf && starredNodeIds.has(item.node.id)));
    const leafMeta = leafData?.meta;
    const isShowMoreExpanded = expandedShowMoreParentIds.has(item.node.id);
    const isVert = transform.orientation === 'vertical';

    return (
      <React.Fragment key={`card-${item.node.id}`}>
        <div
          onClick={() => onSelectNode(item.node)}
          style={{
            position: 'absolute',
            left: `${item.x}px`,
            top: `${item.y}px`,
            width: `${item.width}px`,
            height: `${item.height}px`,
          }}
          className={`tree-node-card rounded-xl p-3 cursor-pointer transition-all border flex flex-col justify-between shadow-2xl backdrop-blur ${
            isSelected
              ? 'ring-2 ring-rp-rose border-rp-rose bg-rp-surface shadow-rp-rose/25'
              : isStarred
              ? 'border-rp-gold/80 bg-rp-surface ring-1 ring-rp-gold/40 shadow-rp-gold/15'
              : item.node._isNew
              ? 'border-rp-pine bg-rp-surface ring-1 ring-rp-pine/60'
              : 'border-rp-highlightMed bg-rp-surface hover:border-rp-highlightHigh hover:bg-rp-overlay'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Starred thread indicator: icon only */}
              {isStarred && (
                <span className="p-1 rounded bg-rp-gold/20 text-rp-gold border border-rp-gold/40 inline-flex items-center justify-center" title="Starred Thread Path">
                  <Star className="w-3.5 h-3.5 fill-rp-gold text-rp-gold" />
                </span>
              )}

              {isUser ? (
                <span className="flex items-center gap-1 text-rp-foam bg-rp-foam/15 px-1.5 py-0.5 rounded border border-rp-foam/30">
                  <User className="w-3 h-3" /> User
                </span>
              ) : isAssistant ? (
                <span className="flex items-center gap-1 text-rp-rose bg-rp-rose/15 px-1.5 py-0.5 rounded border border-rp-rose/30">
                  <Bot className="w-3 h-3" /> Assistant
                </span>
              ) : (
                <span className="text-rp-subtle bg-rp-overlay px-1.5 py-0.5 rounded">
                  {item.node.type}
                </span>
              )}

              <span className="text-rp-muted font-mono text-[10px]">
                #{item.node.id}
              </span>

              {item.node._isNew && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-rp-pine text-rp-base font-bold uppercase tracking-wider">
                  NEW
                </span>
              )}
            </div>

            {hasChildren && (
              <button
                onClick={(e) => toggleCollapse(item.node.id, e)}
                className="text-rp-subtle hover:text-rp-text p-0.5 rounded hover:bg-rp-highlightMed"
                title={item.collapsed ? 'Expand branches' : 'Collapse branches'}
              >
                {item.collapsed ? (
                  <span className="flex items-center text-[10px] text-rp-rose font-mono">
                    <ChevronRight className="w-3.5 h-3.5" />
                    +{item.node.children.length}
                  </span>
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Custom branch name */}
          {leafMeta?.customName && (
            <div className="text-[11px] font-semibold text-rp-iris truncate flex items-center gap-1 mt-0.5">
              <span>Thread: {leafMeta.customName}</span>
            </div>
          )}

          {/* Content snippet */}
          <p className="text-xs text-rp-text line-clamp-2 my-1 leading-snug">
            {item.node.content || (
              <span className="italic text-rp-muted">[Empty response / thought only]</span>
            )}
          </p>

          {/* Footer & Badges */}
          <div className="flex items-center justify-between text-[10px] text-rp-subtle pt-1 border-t border-rp-highlightMed/80">
            <div className="flex items-center gap-1.5 truncate flex-1">
              {item.node.thought && (
                <span className="flex items-center gap-0.5 text-rp-gold text-[10px]" title="Thought process present">
                  <Sparkles className="w-3 h-3" />
                  <span className="truncate max-w-[70px]">Thought</span>
                </span>
              )}

              {/* Thread Tags on leaf */}
              {leafMeta?.tags && leafMeta.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  {leafMeta.tags.slice(0, 1).map((t, idx) => (
                    <span key={idx} className="bg-rp-pine/20 text-rp-foam border border-rp-pine/40 px-1 rounded text-[9px] truncate max-w-[80px]">
                      #{t}
                    </span>
                  ))}
                  {leafMeta.tags.length > 1 && (
                    <span className="text-[9px] text-rp-muted font-mono">+{leafMeta.tags.length - 1}</span>
                  )}
                </div>
              )}

              {/* Thread Note indicator on leaf */}
              {leafMeta?.notes && (
                <span className="text-rp-iris flex items-center gap-0.5" title={leafMeta.notes}>
                  <StickyNote className="w-2.5 h-2.5" />
                </span>
              )}

              {annotation && (
                <span className="bg-rp-iris/25 text-rp-iris border border-rp-iris/40 px-1.5 rounded truncate max-w-[100px]">
                  {annotation}
                </span>
              )}
            </div>

            <span className="text-rp-muted font-mono text-[10px] shrink-0 ml-1">
              {hasChildren ? `${item.node.children.length} br` : 'leaf'}
            </span>
          </div>
        </div>

        {/* Show More / Hide Button positioned directly near respective parent node */}
        {item.hasHiddenRule && !item.collapsed && (
          <div
            style={{
              position: 'absolute',
              left: isVert ? `${item.x + item.width / 2}px` : `${item.x + item.width + 12}px`,
              top: isVert ? `${item.y + item.height + 8}px` : `${item.y + item.height / 2}px`,
              transform: isVert ? 'translateX(-50%)' : 'translateY(-50%)',
              zIndex: 15,
            }}
            className="tree-show-more-btn"
          >
            <button
              onClick={(e) => toggleShowMore(item.node.id, e)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rp-overlay border border-rp-iris/80 text-rp-iris hover:bg-rp-iris hover:text-rp-base text-[11px] font-semibold shadow-xl transition-all whitespace-nowrap"
              title={isShowMoreExpanded ? 'Collapse extra leaf turns' : 'Expand collapsed leaf turns'}
            >
              {isShowMoreExpanded ? (
                <>
                  <ChevronUpSquare className="w-3.5 h-3.5" />
                  <span>Hide {item.hiddenRuleCount} turns</span>
                </>
              ) : (
                <>
                  <ChevronDownSquare className="w-3.5 h-3.5" />
                  <span>+{item.hiddenRuleCount} turns (Show more)</span>
                </>
              )}
            </button>
          </div>
        )}

        {item.children.map(renderNodeCards)}
      </React.Fragment>
    );
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative flex-1 h-[calc(100vh-3.5rem)] bg-rp-base overflow-hidden select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Precision Dotted Background for Graph */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-45"
        style={{
          backgroundImage: 'radial-gradient(circle, #4b4764 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${transform.x % 24}px ${transform.y % 24}px`,
        }}
      />

      {/* Floating Toolbar: Orientation Switcher, Zoom, Reset to Default View */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-rp-surface/95 border border-rp-highlightMed p-1.5 rounded-xl backdrop-blur shadow-2xl">
        {/* Orientation Toggle */}
        <div className="flex items-center gap-0.5 bg-rp-base p-0.5 rounded-lg border border-rp-highlightMed">
          <button
            onClick={() => updateTransform((prev) => ({ ...prev, orientation: 'vertical' }))}
            className={`p-1.5 rounded-md flex items-center gap-1 text-[11px] transition font-medium ${
              transform.orientation === 'vertical' 
                ? 'bg-rp-rose text-rp-base font-bold shadow-sm' 
                : 'text-rp-subtle hover:text-rp-text'
            }`}
            title="Vertical Layout (Top to Bottom)"
          >
            <Rows2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vertical</span>
          </button>
          <button
            onClick={() => updateTransform((prev) => ({ ...prev, orientation: 'horizontal' }))}
            className={`p-1.5 rounded-md flex items-center gap-1 text-[11px] transition font-medium ${
              transform.orientation === 'horizontal' 
                ? 'bg-rp-rose text-rp-base font-bold shadow-sm' 
                : 'text-rp-subtle hover:text-rp-text'
            }`}
            title="Horizontal Layout (Left to Right)"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Horizontal</span>
          </button>
        </div>

        {starredBranches.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-rp-gold px-2 border-l border-rp-highlightMed font-semibold">
            <Star className="w-3.5 h-3.5 fill-rp-gold" />
            <span>{starredBranches.length}</span>
          </div>
        )}

        <div className="h-4 w-px bg-rp-highlightMed" />

        <button
          onClick={() => zoomAtCenter(0.85)}
          className="p-1.5 text-rp-subtle hover:text-rp-text hover:bg-rp-overlay rounded-lg transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-mono font-semibold text-rp-text w-11 text-center">
          {Math.round(transform.zoom * 100)}%
        </span>

        <button
          onClick={() => zoomAtCenter(1.15)}
          className="p-1.5 text-rp-subtle hover:text-rp-text hover:bg-rp-overlay rounded-lg transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Button to reset view position & zoom to default */}
        <button
          onClick={resetToDefaultView}
          className="flex items-center gap-1 px-2 py-1 text-rp-subtle hover:text-rp-text hover:bg-rp-overlay rounded-lg border border-rp-highlightMed transition text-[11px]"
          title="Reset to Default View (100% Zoom, Origin Position)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rp-foam" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Canvas container with pan transform */}
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
          transformOrigin: '0 0',
          width: `${totalWidth}px`,
          height: `${totalHeight}px`,
        }}
        className="relative transition-transform duration-75"
      >
        {/* SVG connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height={totalHeight}
        >
          {layoutRoots.map(renderLines)}
        </svg>

        {/* HTML Node cards */}
        {layoutRoots.map(renderNodeCards)}
      </div>
    </div>
  );
};
