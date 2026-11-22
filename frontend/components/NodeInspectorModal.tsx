import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Bot, 
  Sparkles, 
  Check, 
  Copy, 
  CornerDownRight, 
  Bookmark 
} from 'lucide-react';
import { TreeNode } from '../types';

interface NodeInspectorModalProps {
  node: TreeNode | null;
  onClose: () => void;
  annotation: string;
  onSaveAnnotation: (nodeId: string | number, text: string) => void;
}

export const NodeInspectorModal: React.FC<NodeInspectorModalProps> = ({
  node,
  onClose,
  annotation,
  onSaveAnnotation,
}) => {
  if (!node) return null;

  const [annotText, setAnnotText] = useState(annotation);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAnnotText(annotation);
  }, [annotation, node]);

  const handleCopyContent = () => {
    navigator.clipboard.writeText(node.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-rp-surface border-l border-rp-highlightMed shadow-2xl z-40 flex flex-col p-4 select-text">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-rp-highlightMed">
        <div className="flex items-center gap-2">
          {node.type === 'user' ? (
            <span className="p-1.5 rounded-lg bg-rp-foam/10 text-rp-foam border border-rp-foam/20">
              <User className="w-4 h-4" />
            </span>
          ) : (
            <span className="p-1.5 rounded-lg bg-rp-rose/10 text-rp-rose border border-rp-rose/20">
              <Bot className="w-4 h-4" />
            </span>
          )}
          <div>
            <div className="font-semibold text-xs text-rp-text uppercase tracking-wider">
              {node.type} Node Details
            </div>
            <div className="text-[10px] text-rp-muted font-mono">ID: {node.id}</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-rp-muted hover:text-rp-text rounded-lg hover:bg-rp-overlay transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
        {/* Content Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-rp-subtle text-[11px] font-medium">
            <span>Message Content</span>
            <button
              onClick={handleCopyContent}
              className="flex items-center gap-1 text-rp-muted hover:text-rp-text transition"
            >
              {copied ? <Check className="w-3 h-3 text-rp-pine" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-3 rounded-xl bg-rp-base border border-rp-highlightMed text-rp-text whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
            {node.content || <span className="text-rp-muted italic">[Empty content]</span>}
          </div>
        </div>

        {/* Thought Section */}
        {node.thought && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-rp-gold text-[11px] font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chain of Thought / Reflection</span>
            </div>
            <div className="p-3 rounded-xl bg-rp-base border border-rp-gold/30 text-rp-gold/90 whitespace-pre-wrap leading-relaxed font-mono text-[11px] max-h-44 overflow-y-auto">
              {node.thought}
            </div>
          </div>
        )}

        {/* Sandbox Virtual Annotation */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 text-rp-iris text-[11px] font-medium">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Node Note / Tag (Sandbox only)</span>
          </div>
          <textarea
            value={annotText}
            onChange={(e) => setAnnotText(e.target.value)}
            placeholder="Add a virtual note or tag for this specific node..."
            className="w-full h-20 bg-rp-base border border-rp-highlightMed rounded-xl p-2.5 text-rp-text placeholder-rp-muted focus:outline-none focus:border-rp-iris text-xs resize-none"
          />
          <button
            onClick={() => onSaveAnnotation(node.id, annotText)}
            className="mt-1.5 w-full py-1.5 rounded-lg bg-rp-iris hover:opacity-90 text-rp-base font-semibold transition text-xs flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Node Note</span>
          </button>
        </div>

        {/* Children Branches */}
        <div>
          <div className="text-rp-subtle text-[11px] font-medium mb-1.5 flex items-center gap-1">
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>Child Branches ({node.children ? node.children.length : 0})</span>
          </div>
          <div className="space-y-1">
            {node.children && node.children.length > 0 ? (
              node.children.map((child) => (
                <div
                  key={child.id}
                  className="p-2 rounded-lg bg-rp-base border border-rp-highlightMed text-[11px] text-rp-text flex items-center justify-between"
                >
                  <span className="truncate max-w-[200px]">{child.content || `[${child.type}]`}</span>
                  <span className="font-mono text-rp-muted">#{child.id}</span>
                </div>
              ))
            ) : (
              <span className="text-rp-muted text-[11px] italic">This is a leaf node (terminal turn).</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
