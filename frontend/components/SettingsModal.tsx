import React, { useState } from 'react';
import { X, Settings, Plus, Trash2, Eye, EyeOff, Type } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [newTag, setNewTag] = useState('');

  const handleAddGlobalTag = () => {
    const trimmed = newTag.trim().replace(/^#/, '');
    if (trimmed && !settings.globalTags.includes(trimmed)) {
      onUpdateSettings({
        globalTags: [...settings.globalTags, trimmed],
      });
      setNewTag('');
    }
  };

  const handleRemoveGlobalTag = (tagToRemove: string) => {
    onUpdateSettings({
      globalTags: settings.globalTags.filter((t) => t !== tagToRemove),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-rp-surface border border-rp-highlightMed rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-rp-highlightMed flex items-center justify-between">
          <div className="flex items-center gap-2 text-rp-rose font-semibold text-sm">
            <Settings className="w-4 h-4" />
            <span>Sandbox & Reader Settings</span>
          </div>
          <button
            onClick={onClose}
            className="text-rp-muted hover:text-rp-text p-1 rounded-lg hover:bg-rp-overlay transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-5">
          {/* Font Size */}
          <div>
            <label className="block text-rp-text font-semibold mb-1.5 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-rp-foam" />
              <span>Path Thread Message Font Size</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ fontSize: size })}
                  className={`py-2 px-3 rounded-lg border capitalize font-medium transition ${
                    settings.fontSize === size
                      ? 'bg-rp-rose/20 border-rp-rose text-rp-rose'
                      : 'bg-rp-base border-rp-highlightMed text-rp-subtle hover:text-rp-text'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Show Thoughts Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-rp-base border border-rp-highlightMed">
            <div>
              <div className="font-semibold text-rp-text">Display Internal Thoughts</div>
              <div className="text-[11px] text-rp-muted">
                Show or hide the internal chain-of-thought blocks in path thread
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ showThoughts: !settings.showThoughts })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition ${
                settings.showThoughts
                  ? 'bg-rp-gold/20 border-rp-gold text-rp-gold'
                  : 'bg-rp-overlay border-rp-highlightMed text-rp-muted'
              }`}
            >
              {settings.showThoughts ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visible</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hidden</span>
                </>
              )}
            </button>
          </div>

          {/* Global Tag Management */}
          <div>
            <label className="block text-rp-text font-semibold mb-1.5">
              Sandbox Tag Registry
            </label>
            <div className="flex items-center gap-1.5 mb-2.5">
              <input
                type="text"
                placeholder="Register new tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGlobalTag();
                  }
                }}
                className="flex-1 bg-rp-base border border-rp-highlightMed rounded-lg px-2.5 py-1.5 text-rp-text placeholder-rp-muted focus:outline-none focus:border-rp-rose"
              />
              <button
                onClick={handleAddGlobalTag}
                className="flex items-center gap-1 px-3 py-1.5 bg-rp-overlay hover:bg-rp-highlightMed text-rp-text border border-rp-highlightMed rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {settings.globalTags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center justify-between p-2 rounded-lg bg-rp-base border border-rp-highlightMed text-rp-subtle"
                >
                  <span className="font-mono text-rp-foam">#{tag}</span>
                  <button
                    onClick={() => handleRemoveGlobalTag(tag)}
                    className="p-1 text-rp-muted hover:text-rp-love rounded transition"
                    title="Delete tag"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-rp-highlightMed bg-rp-base/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-rp-overlay hover:bg-rp-highlightMed text-rp-text border border-rp-highlightMed transition font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
