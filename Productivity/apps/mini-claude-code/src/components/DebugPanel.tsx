import React, { useState } from 'react';
import { Play, Square, RotateCcw, Bug, Circle } from 'lucide-react';

interface DebugPanelProps {
  currentFile: any;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ currentFile }) => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [breakpoints] = useState<any[]>([]);
  const [variables] = useState<any[]>([
    { name: 'count', value: '42', type: 'number' },
    { name: 'message', value: '"Hello World"', type: 'string' },
    { name: 'isActive', value: 'true', type: 'boolean' },
  ]);

  const startDebugging = () => {
    setIsDebugging(true);
  };

  const stopDebugging = () => {
    setIsDebugging(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bug size={18} className="text-primary" />
            <span className="font-semibold">Debug</span>
          </div>
          <div className="flex items-center space-x-1">
            {!isDebugging ? (
              <button
                onClick={startDebugging}
                className="p-1 hover:bg-accent rounded text-green-500"
                title="Start Debugging"
              >
                <Play size={14} />
              </button>
            ) : (
              <>
                <button
                  onClick={stopDebugging}
                  className="p-1 hover:bg-accent rounded text-red-500"
                  title="Stop Debugging"
                >
                  <Square size={14} />
                </button>
                <button
                  className="p-1 hover:bg-accent rounded"
                  title="Step Over"
                >
                  <Play size={14} />
                </button>
                <button
                  className="p-1 hover:bg-accent rounded"
                  title="Step Into"
                >
                  <Play size={14} />
                </button>
                <button
                  className="p-1 hover:bg-accent rounded"
                  title="Step Out"
                >
                  <Play size={14} />
                </button>
                <button
                  className="p-1 hover:bg-accent rounded"
                  title="Restart"
                >
                  <RotateCcw size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!currentFile ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bug size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Open a file to start debugging</p>
          </div>
        ) : !isDebugging ? (
          <div className="p-4 text-center text-muted-foreground">
            <Play size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click play to start debugging</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Variables */}
            <div className="p-3">
              <h3 className="text-sm font-semibold mb-2">Variables</h3>
              <div className="space-y-1">
                {variables.map((variable, index) => (
                  <div key={index} className="debug-variable">
                    <div className="name">{variable.name}</div>
                    <div className="value">{variable.value}</div>
                    <div className="type">{variable.type}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakpoints */}
            <div className="p-3 border-t border-border">
              <h3 className="text-sm font-semibold mb-2">Breakpoints</h3>
              {breakpoints.length === 0 ? (
                <p className="text-xs text-muted-foreground">No breakpoints set</p>
              ) : (
                <div className="space-y-1">
                  {breakpoints.map((bp, index) => (
                    <div key={index} className="flex items-center space-x-2 p-1">
                      <Circle size={8} className="text-red-500 fill-current" />
                      <span className="text-xs">{bp.file}:{bp.line}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;