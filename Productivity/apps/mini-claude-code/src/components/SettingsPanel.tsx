import React, { useState } from 'react';
import { X, Monitor, Sun, Moon, Type, Palette, Keyboard, Extensions } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
  currentTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  currentTheme,
  onThemeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'editor' | 'appearance' | 'keybindings'>('general');
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('Monaco');
  const [tabSize, setTabSize] = useState(4);
  const [wordWrap, setWordWrap] = useState(false);
  const [minimap, setMinimap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);

  const tabs = [
    { id: 'general', label: 'General', icon: <Monitor size={16} /> },
    { id: 'editor', label: 'Editor', icon: <Type size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'keybindings', label: 'Keybindings', icon: <Keyboard size={16} /> },
  ];

  const themes = [
    { id: 'light', label: 'Light', icon: <Sun size={16} /> },
    { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
  ];

  const fontFamilies = [
    'Monaco',
    'Cascadia Code',
    'Roboto Mono',
    'Courier New',
    'Fira Code',
    'JetBrains Mono',
    'Source Code Pro',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl h-full max-h-[80vh] flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-border">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Settings</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 p-3 text-left rounded hover:bg-secondary ${
                  activeTab === tab.id ? 'bg-secondary' : ''
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">General Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Auto Save</label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-sm">Automatically save files</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Auto Save Delay (ms)</label>
                    <input
                      type="number"
                      defaultValue={1000}
                      className="w-32 px-3 py-2 text-sm bg-background border border-border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Format on Save</label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Format files on save</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Editor Settings</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Font Size</label>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      min={8}
                      max={72}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Font Family</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded"
                    >
                      {fontFamilies.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tab Size</label>
                    <input
                      type="number"
                      value={tabSize}
                      onChange={(e) => setTabSize(Number(e.target.value))}
                      min={1}
                      max={8}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Insert Spaces</label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-sm">Use spaces instead of tabs</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Word Wrap</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={wordWrap}
                        onChange={(e) => setWordWrap(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Wrap long lines</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Line Numbers</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={lineNumbers}
                        onChange={(e) => setLineNumbers(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Show line numbers</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Minimap</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={minimap}
                        onChange={(e) => setMinimap(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Show minimap</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Appearance Settings</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <div className="grid grid-cols-2 gap-2 max-w-md">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => onThemeChange(theme.id as 'light' | 'dark')}
                        className={`p-3 border rounded flex items-center space-x-2 ${
                          currentTheme === theme.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-secondary'
                        }`}
                      >
                        {theme.icon}
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color Theme</label>
                  <select className="w-full max-w-md px-3 py-2 text-sm bg-background border border-border rounded">
                    <option>Claude Dark</option>
                    <option>Claude Light</option>
                    <option>VS Code Dark</option>
                    <option>Monokai</option>
                    <option>GitHub Light</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Activity Bar</label>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-sm">Show activity bar</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'keybindings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded hover:bg-secondary">
                    <span className="text-sm">Open Project</span>
                    <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+O</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-secondary">
                    <span className="text-sm">Save File</span>
                    <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+S</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-secondary">
                    <span className="text-sm">New File</span>
                    <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+N</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-secondary">
                    <span className="text-sm">Find in Files</span>
                    <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+F</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-secondary">
                    <span className="text-sm">Toggle Terminal</span>
                    <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+`</kbd>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;