import { useEffect } from 'react';

interface KeyboardShortcuts {
  [key: string]: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrlKey, shiftKey, altKey, metaKey, key } = event;
      
      // Build shortcut string
      let shortcut = '';
      if (ctrlKey || metaKey) shortcut += 'Ctrl+';
      if (shiftKey) shortcut += 'Shift+';
      if (altKey) shortcut += 'Alt+';
      
      // Handle special keys
      const keyMap: Record<string, string> = {
        ' ': 'Space',
        'Enter': 'Enter',
        'Escape': 'Escape',
        'Tab': 'Tab',
        'Backspace': 'Backspace',
        'Delete': 'Delete',
        'ArrowUp': 'ArrowUp',
        'ArrowDown': 'ArrowDown',
        'ArrowLeft': 'ArrowLeft',
        'ArrowRight': 'ArrowRight',
        'F1': 'F1',
        'F2': 'F2',
        'F3': 'F3',
        'F4': 'F4',
        'F5': 'F5',
        'F6': 'F6',
        'F7': 'F7',
        'F8': 'F8',
        'F9': 'F9',
        'F10': 'F10',
        'F11': 'F11',
        'F12': 'F12'
      };
      
      const mappedKey = keyMap[key] || key.toUpperCase();
      shortcut += mappedKey;
      
      // Check if this shortcut exists
      const handler = shortcuts[shortcut];
      if (handler) {
        event.preventDefault();
        event.stopPropagation();
        handler();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};

// Default shortcuts for the word processor
export const defaultShortcuts = {
  // File operations
  'Ctrl+N': () => console.log('New document'),
  'Ctrl+O': () => console.log('Open document'),
  'Ctrl+S': () => console.log('Save document'),
  'Ctrl+Shift+S': () => console.log('Save as'),
  'Ctrl+E': () => console.log('Export document'),
  'Ctrl+P': () => window.print(),
  'Ctrl+Q': () => console.log('Quit application'),

  // Edit operations
  'Ctrl+Z': () => console.log('Undo'),
  'Ctrl+Y': () => console.log('Redo'),
  'Ctrl+Shift+Z': () => console.log('Redo'),
  'Ctrl+X': () => console.log('Cut'),
  'Ctrl+C': () => console.log('Copy'),
  'Ctrl+V': () => console.log('Paste'),
  'Ctrl+A': () => console.log('Select all'),
  'Delete': () => console.log('Delete'),
  'Backspace': () => console.log('Backspace'),

  // Find and replace
  'Ctrl+F': () => console.log('Find'),
  'Ctrl+H': () => console.log('Find and replace'),
  'F3': () => console.log('Find next'),
  'Shift+F3': () => console.log('Find previous'),

  // Formatting
  'Ctrl+B': () => console.log('Bold'),
  'Ctrl+I': () => console.log('Italic'),
  'Ctrl+U': () => console.log('Underline'),
  'Ctrl+Shift+X': () => console.log('Strikethrough'),
  'Ctrl+Shift+C': () => console.log('Code'),

  // Text alignment
  'Ctrl+Shift+L': () => console.log('Align left'),
  'Ctrl+Shift+E': () => console.log('Align center'),
  'Ctrl+Shift+R': () => console.log('Align right'),
  'Ctrl+Shift+J': () => console.log('Justify'),

  // Lists
  'Ctrl+Shift+8': () => console.log('Bullet list'),
  'Ctrl+Shift+7': () => console.log('Numbered list'),
  'Ctrl+Shift+9': () => console.log('Task list'),

  // Headings
  'Ctrl+1': () => console.log('Heading 1'),
  'Ctrl+2': () => console.log('Heading 2'),
  'Ctrl+3': () => console.log('Heading 3'),
  'Ctrl+4': () => console.log('Heading 4'),
  'Ctrl+5': () => console.log('Heading 5'),
  'Ctrl+6': () => console.log('Heading 6'),
  'Ctrl+0': () => console.log('Normal text'),

  // Blocks
  'Ctrl+Shift+Q': () => console.log('Blockquote'),
  'Ctrl+Shift+P': () => console.log('Code block'),
  'Ctrl+Shift+M': () => console.log('Horizontal rule'),

  // Tables
  'Ctrl+Shift+T': () => console.log('Insert table'),
  'Tab': () => console.log('Next cell'),
  'Shift+Tab': () => console.log('Previous cell'),

  // AI features
  'Ctrl+Shift+A': () => console.log('Toggle AI assistant'),
  'F1': () => console.log('Show AI assistant'),
  'Ctrl+Shift+G': () => console.log('Grammar check'),
  'Ctrl+Shift+R': () => console.log('Rewrite text'),

  // View
  'Ctrl+Shift+S': () => console.log('Toggle sidebar'),
  'F11': () => console.log('Full screen'),
  'Ctrl+Plus': () => console.log('Zoom in'),
  'Ctrl+Minus': () => console.log('Zoom out'),
  'Ctrl+0': () => console.log('Reset zoom'),

  // Special
  'Escape': () => console.log('Close dialogs'),
  'Ctrl+/': () => console.log('Show shortcuts help'),
};