import React, { useState } from 'react';
import { 
  X, 
  GitMerge, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { TreeNode, RebaseDiffResult } from '../types';
import { rebaseTrees } from '../services/treeRebaseService';

interface RebaseModalProps {
  currentBaseNodes: TreeNode[];
  fileName: string;
  onClose: () => void;
  onApplyRebase: (result: RebaseDiffResult, newRawJson: string) => void;
}

export const RebaseModal: React.FC<RebaseModalProps> = ({
  currentBaseNodes,
  fileName,
  onClose,
  onApplyRebase,
}) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [diffResult, setDiffResult] = useState<RebaseDiffResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      computeDiff(content);
    };
    reader.readAsText(file);
  };

  const computeDiff = (rawJson: string) => {
    setError(null);
    try {
      let parsed = JSON.parse(rawJson);
      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }
      const diff = rebaseTrees(currentBaseNodes, parsed as TreeNode[]);
      setDiffResult(diff);
    } catch {
      setError('Invalid JSON format. Please verify the N-ary JSON file structure.');
      setDiffResult(null);
    }
  };

  const handleApply = () => {
    if (!diffResult) return;
    onApplyRebase(diffResult, jsonInput);
    onClose();
  };

  const handleLoadDemoUpdate = () => {
    const demoUpdated: TreeNode[] = JSON.parse(JSON.stringify(currentBaseNodes));
    function attachExtra(node: TreeNode) {
      if (node.id === 6) {
        node.children.push({
          id: 11,
          type: 'user',
          content: 'write a 3rd scenario where eli stays quiet, makes hot tea for both of them, and then quietly starts crying while setting the mug down.',
          thought: null,
          children: [
            {
              id: 12,
              type: 'assistant',
              content: 'Eli did not yell. He walked into the kitchen with stiff shoulders, the kettle whistling in the tense silence. When he placed the steaming chamomile in front of Caelus, his knuckles brushed the table—and a single teardrop hit the ceramic.',
              thought: 'Scenario C: Quiet withdrawal and grief over explosive confrontation.',
              children: []
            }
          ]
        });
      } else if (node.children) {
        node.children.forEach(attachExtra);
      }
    }
    demoUpdated.forEach(attachExtra);
    const demoJson = JSON.stringify(demoUpdated, null, 2);
    setJsonInput(demoJson);
    computeDiff(demoJson);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-rp-surface border border-rp-highlightMed rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-rp-highlightMed flex items-center justify-between">
          <div className="flex items-center gap-2 text-rp-pine">
            <GitMerge className="w-5 h-5" />
            <h2 className="text-sm font-semibold text-rp-text">
              Rebase N-Ary Conversation Tree
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-rp-muted hover:text-rp-text p-1 rounded-lg hover:bg-rp-overlay transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 bg-rp-base rounded-xl border border-rp-highlightMed text-rp-text leading-relaxed">
            Rebasing integrates an updated revision of <code className="text-rp-rose font-mono">{fileName}</code>.
            Existing nodes and your custom notes remain preserved, while newly branched turns are merged seamlessly.
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 bg-rp-pine hover:opacity-90 text-rp-base rounded-lg cursor-pointer font-semibold transition">
              <Upload className="w-4 h-4" />
              <span>Select Updated JSON File</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleLoadDemoUpdate}
              className="flex items-center gap-1.5 px-3 py-2 bg-rp-overlay hover:bg-rp-highlightMed text-rp-text rounded-lg border border-rp-highlightMed transition"
              title="Loads an example update with nodes #11 and #12 appended"
            >
              <Sparkles className="w-4 h-4 text-rp-gold" />
              <span>Simulate Newer Version (+Branch #3)</span>
            </button>
          </div>

          <div>
            <label className="block text-rp-subtle text-[11px] font-medium mb-1">
              Or paste newer JSON payload:
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                if (e.target.value.trim()) computeDiff(e.target.value);
                else setDiffResult(null);
              }}
              placeholder='[ { "id": 1, "type": "user", "content": "...", "children": [...] } ]'
              className="w-full h-32 bg-rp-base border border-rp-highlightMed rounded-xl p-3 font-mono text-[11px] text-rp-text placeholder-rp-muted focus:outline-none focus:border-rp-rose"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rp-love/15 border border-rp-love/40 text-rp-love">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Diff Result Summary */}
          {diffResult && (
            <div className="p-4 rounded-xl bg-rp-base border border-rp-highlightMed space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-rp-text border-b border-rp-highlightMed pb-2">
                <span>Rebase Calculation Preview</span>
                <span className="flex items-center gap-1 text-rp-pine">
                  <CheckCircle2 className="w-4 h-4" /> Ready to rebase
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-xl bg-rp-pine/15 border border-rp-pine/30">
                  <div className="text-lg font-bold text-rp-foam">+{diffResult.addedNodesCount}</div>
                  <div className="text-[10px] text-rp-subtle">New Nodes Added</div>
                </div>

                <div className="p-2 rounded-xl bg-rp-rose/15 border border-rp-rose/30">
                  <div className="text-lg font-bold text-rp-rose">{diffResult.modifiedNodesCount}</div>
                  <div className="text-[10px] text-rp-subtle">Updated Turns</div>
                </div>

                <div className="p-2 rounded-xl bg-rp-overlay border border-rp-highlightMed">
                  <div className="text-lg font-bold text-rp-text">{diffResult.unchangedNodesCount}</div>
                  <div className="text-[10px] text-rp-subtle">Unchanged Turns</div>
                </div>
              </div>

              {diffResult.diffList.length > 0 && (
                <div className="mt-3 max-h-36 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                  {diffResult.diffList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-rp-overlay border border-rp-highlightMed flex items-center justify-between text-rp-text"
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] uppercase font-bold ${
                            item.action === 'added' ? 'bg-rp-pine text-rp-base' : 'bg-rp-rose text-rp-base'
                          }`}
                        >
                          {item.action}
                        </span>
                        <span className="truncate max-w-[320px]">{item.content}</span>
                      </span>
                      <span className="text-rp-muted text-[10px]">Node #{item.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-rp-highlightMed bg-rp-base/40 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-rp-overlay hover:bg-rp-highlightMed text-rp-subtle transition text-xs"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={!diffResult}
            className="px-4 py-2 rounded-lg bg-rp-pine hover:opacity-90 text-rp-base font-semibold transition text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <GitMerge className="w-4 h-4" />
            <span>Apply Tree Rebase</span>
          </button>
        </div>
      </div>
    </div>
  );
};
