import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { invoke } from '@tauri-apps/api/tauri';
import { Terminal as TerminalIcon, Plus, X, Settings, Search } from 'lucide-react';

interface TerminalProps {
  projectPath?: string;
}

interface TerminalSession {
  id: string;
  name: string;
  terminal: XTerm;
  fitAddon: FitAddon;
}

const Terminal: React.FC<TerminalProps> = ({ projectPath }) => {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Create new terminal session
  const createSession = async () => {
    setIsLoading(true);
    try {
      const sessionId = `terminal-${Date.now()}`;
      const sessionName = `Terminal ${sessions.length + 1}`;

      // Create terminal instance
      const terminal = new XTerm({
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          selection: '#264f78',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5',
        },
        fontSize: 13,
        fontFamily: "'Monaco', 'Cascadia Code', 'Roboto Mono', 'Courier New', monospace",
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 10000,
        tabStopWidth: 4,
        allowTransparency: true,
        convertEol: true,
      });

      // Add addons
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      const searchAddon = new SearchAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);
      terminal.loadAddon(searchAddon);

      // Create backend terminal
      await invoke('create_terminal', {
        terminalId: sessionId,
        name: sessionName,
        shell: null, // Use default shell
        cwd: projectPath || null,
        env: null,
      });

      const session: TerminalSession = {
        id: sessionId,
        name: sessionName,
        terminal,
        fitAddon,
      };

      setSessions(prev => [...prev, session]);
      setActiveSessionId(sessionId);

      // Setup terminal event handlers
      setupTerminalEventHandlers(session);

    } catch (error) {
      console.error('Failed to create terminal session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup terminal event handlers
  const setupTerminalEventHandlers = (session: TerminalSession) => {
    const { terminal, id } = session;

    // Handle terminal input
    terminal.onData(async (data) => {
      try {
        await invoke('send_terminal_input', {
          terminalId: id,
          input: data,
        });
      } catch (error) {
        console.error('Failed to send terminal input:', error);
      }
    });

    // Handle terminal resize
    terminal.onResize(async ({ cols, rows }) => {
      try {
        await invoke('resize_terminal', {
          terminalId: id,
          cols,
          rows,
        });
      } catch (error) {
        console.error('Failed to resize terminal:', error);
      }
    });

    // Mock terminal output (in real implementation, this would come from backend)
    const mockOutput = () => {
      const cwd = projectPath || '~';
      terminal.writeln(`Welcome to Mini Claude Code Terminal`);
      terminal.writeln(`Current directory: ${cwd}`);
      terminal.write(`$ `);
    };

    setTimeout(mockOutput, 100);

    // Mock command handling (in real implementation, this would be handled by backend)
    let currentInput = '';
    terminal.onData((data) => {
      if (data === '\r') {
        // Enter pressed
        terminal.writeln('');
        if (currentInput.trim()) {
          handleCommand(terminal, currentInput.trim());
        }
        currentInput = '';
        terminal.write('$ ');
      } else if (data === '\u007F') {
        // Backspace
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (data >= ' ') {
        // Printable character
        currentInput += data;
        terminal.write(data);
      }
    });
  };

  // Handle mock commands
  const handleCommand = (terminal: XTerm, command: string) => {
    const parts = command.split(' ');
    const cmd = parts[0];

    switch (cmd) {
      case 'clear':
        terminal.clear();
        break;
      case 'ls':
        terminal.writeln('📁 src/');
        terminal.writeln('📁 components/');
        terminal.writeln('📄 package.json');
        terminal.writeln('📄 README.md');
        break;
      case 'pwd':
        terminal.writeln(projectPath || '~');
        break;
      case 'echo':
        terminal.writeln(parts.slice(1).join(' '));
        break;
      case 'help':
        terminal.writeln('Available commands:');
        terminal.writeln('  clear    - Clear the terminal');
        terminal.writeln('  ls       - List directory contents');
        terminal.writeln('  pwd      - Print working directory');
        terminal.writeln('  echo     - Echo text');
        terminal.writeln('  help     - Show this help');
        break;
      default:
        terminal.writeln(`Command not found: ${cmd}`);
        terminal.writeln(`Type 'help' for available commands`);
        break;
    }
  };

  // Close terminal session
  const closeSession = async (sessionId: string) => {
    try {
      await invoke('destroy_terminal', { terminalId: sessionId });
      
      setSessions(prev => {
        const session = prev.find(s => s.id === sessionId);
        if (session) {
          session.terminal.dispose();
        }
        return prev.filter(s => s.id !== sessionId);
      });

      if (activeSessionId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
      }
    } catch (error) {
      console.error('Failed to close terminal session:', error);
    }
  };

  // Mount terminal to DOM
  useEffect(() => {
    if (!activeSessionId) return;

    const session = sessions.find(s => s.id === activeSessionId);
    const terminalRef = terminalRefs.current.get(activeSessionId);
    
    if (session && terminalRef) {
      session.terminal.open(terminalRef);
      session.fitAddon.fit();
      session.terminal.focus();
    }
  }, [activeSessionId, sessions]);

  // Resize terminals when container resizes
  useEffect(() => {
    const handleResize = () => {
      sessions.forEach(session => {
        if (session.fitAddon) {
          session.fitAddon.fit();
        }
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    const terminalContainer = document.querySelector('.terminal-container');
    if (terminalContainer) {
      resizeObserver.observe(terminalContainer);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [sessions]);

  // Create initial session
  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-black text-green-400">
      {/* Terminal Header */}
      {sessions.length > 0 && (
        <div className="h-10 bg-gray-900 border-b border-gray-700 flex items-center">
          {/* Terminal Tabs */}
          <div className="flex-1 flex overflow-x-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center px-3 py-2 text-sm border-r border-gray-700 cursor-pointer hover:bg-gray-800 ${
                  activeSessionId === session.id ? 'bg-gray-800 text-white' : 'text-gray-400'
                }`}
                onClick={() => setActiveSessionId(session.id)}
              >
                <TerminalIcon size={14} className="mr-2" />
                <span>{session.name}</span>
                {sessions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeSession(session.id);
                    }}
                    className="ml-2 p-0.5 hover:bg-gray-700 rounded"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Terminal Actions */}
          <div className="flex items-center px-2 space-x-1">
            <button
              onClick={createSession}
              disabled={isLoading}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              title="New Terminal"
            >
              <Plus size={14} />
            </button>
            <button
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              title="Search in Terminal"
              onClick={() => {
                // TODO: Implement terminal search
                console.log('Terminal search');
              }}
            >
              <Search size={14} />
            </button>
            <button
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              title="Terminal Settings"
              onClick={() => {
                // TODO: Implement terminal settings
                console.log('Terminal settings');
              }}
            >
              <Settings size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Terminal Content */}
      <div className="flex-1 terminal-container relative">
        {sessions.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <TerminalIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm mb-4">No terminal sessions</p>
              <button
                onClick={createSession}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-black rounded hover:bg-green-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Terminal'}
              </button>
            </div>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              ref={(el) => {
                if (el) {
                  terminalRefs.current.set(session.id, el);
                } else {
                  terminalRefs.current.delete(session.id);
                }
              }}
              className={`h-full ${activeSessionId === session.id ? 'block' : 'hidden'}`}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Terminal;