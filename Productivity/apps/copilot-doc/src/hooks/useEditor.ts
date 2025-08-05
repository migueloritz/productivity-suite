import { useState, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';

export const useEditor = () => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const editorRef = useRef<any>(null);

  const initializeEditor = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
    setIsInitialized(true);
  }, []);

  const getContent = useCallback(() => {
    return editor?.getHTML() || '';
  }, [editor]);

  const getTextContent = useCallback(() => {
    return editor?.getText() || '';
  }, [editor]);

  const setContent = useCallback((content: string) => {
    if (editor) {
      editor.commands.setContent(content, false);
    }
  }, [editor]);

  const insertContent = useCallback((content: string) => {
    if (editor) {
      editor.commands.insertContent(content);
    }
  }, [editor]);

  const replaceSelection = useCallback((content: string) => {
    if (editor) {
      editor.commands.insertContent(content);
    }
  }, [editor]);

  const getSelection = useCallback(() => {
    if (!editor) return { from: 0, to: 0, text: '' };
    
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    
    return { from, to, text };
  }, [editor]);

  const selectAll = useCallback(() => {
    if (editor) {
      editor.commands.selectAll();
    }
  }, [editor]);

  const focus = useCallback(() => {
    if (editor) {
      editor.commands.focus();
    }
  }, [editor]);

  const blur = useCallback(() => {
    if (editor) {
      editor.commands.blur();
    }
  }, [editor]);

  // Formatting commands
  const toggleBold = useCallback(() => {
    if (editor) {
      editor.commands.toggleBold();
    }
  }, [editor]);

  const toggleItalic = useCallback(() => {
    if (editor) {
      editor.commands.toggleItalic();
    }
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    if (editor) {
      editor.commands.toggleUnderline();
    }
  }, [editor]);

  const toggleStrike = useCallback(() => {
    if (editor) {
      editor.commands.toggleStrike();
    }
  }, [editor]);

  const toggleCode = useCallback(() => {
    if (editor) {
      editor.commands.toggleCode();
    }
  }, [editor]);

  const toggleHighlight = useCallback((color?: string) => {
    if (editor) {
      if (color) {
        editor.commands.toggleHighlight({ color });
      } else {
        editor.commands.toggleHighlight();
      }
    }
  }, [editor]);

  const setTextColor = useCallback((color: string) => {
    if (editor) {
      editor.commands.setColor(color);
    }
  }, [editor]);

  const unsetTextColor = useCallback(() => {
    if (editor) {
      editor.commands.unsetColor();
    }
  }, [editor]);

  // Block formatting
  const setHeading = useCallback((level: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (editor) {
      editor.commands.setHeading({ level });
    }
  }, [editor]);

  const setParagraph = useCallback(() => {
    if (editor) {
      editor.commands.setParagraph();
    }
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    if (editor) {
      editor.commands.toggleBulletList();
    }
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    if (editor) {
      editor.commands.toggleOrderedList();
    }
  }, [editor]);

  const toggleTaskList = useCallback(() => {
    if (editor) {
      editor.commands.toggleTaskList();
    }
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    if (editor) {
      editor.commands.toggleBlockquote();
    }
  }, [editor]);

  const toggleCodeBlock = useCallback(() => {
    if (editor) {
      editor.commands.toggleCodeBlock();
    }
  }, [editor]);

  const insertHorizontalRule = useCallback(() => {
    if (editor) {
      editor.commands.setHorizontalRule();
    }
  }, [editor]);

  const insertPageBreak = useCallback(() => {
    if (editor) {
      editor.commands.setHardBreak();
    }
  }, [editor]);

  // Text alignment
  const setTextAlign = useCallback((alignment: 'left' | 'center' | 'right' | 'justify') => {
    if (editor) {
      editor.commands.setTextAlign(alignment);
    }
  }, [editor]);

  // History
  const undo = useCallback(() => {
    if (editor) {
      editor.commands.undo();
    }
  }, [editor]);

  const redo = useCallback(() => {
    if (editor) {
      editor.commands.redo();
    }
  }, [editor]);

  const canUndo = useCallback(() => {
    return editor?.can().undo() || false;
  }, [editor]);

  const canRedo = useCallback(() => {
    return editor?.can().redo() || false;
  }, [editor]);

  // Tables
  const insertTable = useCallback((rows: number = 3, cols: number = 3, withHeaderRow: boolean = true) => {
    if (editor) {
      editor.commands.insertTable({ rows, cols, withHeaderRow });
    }
  }, [editor]);

  const deleteTable = useCallback(() => {
    if (editor) {
      editor.commands.deleteTable();
    }
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    if (editor) {
      editor.commands.addColumnBefore();
    }
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    if (editor) {
      editor.commands.addColumnAfter();
    }
  }, [editor]);

  const deleteColumn = useCallback(() => {
    if (editor) {
      editor.commands.deleteColumn();
    }
  }, [editor]);

  const addRowBefore = useCallback(() => {
    if (editor) {
      editor.commands.addRowBefore();
    }
  }, [editor]);

  const addRowAfter = useCallback(() => {
    if (editor) {
      editor.commands.addRowAfter();
    }
  }, [editor]);

  const deleteRow = useCallback(() => {
    if (editor) {
      editor.commands.deleteRow();
    }
  }, [editor]);

  const mergeCells = useCallback(() => {
    if (editor) {
      editor.commands.mergeCells();
    }
  }, [editor]);

  const splitCell = useCallback(() => {
    if (editor) {
      editor.commands.splitCell();
    }
  }, [editor]);

  const toggleHeaderColumn = useCallback(() => {
    if (editor) {
      editor.commands.toggleHeaderColumn();
    }
  }, [editor]);

  const toggleHeaderRow = useCallback(() => {
    if (editor) {
      editor.commands.toggleHeaderRow();
    }
  }, [editor]);

  const toggleHeaderCell = useCallback(() => {
    if (editor) {
      editor.commands.toggleHeaderCell();
    }
  }, [editor]);

  // Links
  const setLink = useCallback((href: string, target?: string) => {
    if (editor) {
      editor.commands.setLink({ href, target });
    }
  }, [editor]);

  const unsetLink = useCallback(() => {
    if (editor) {
      editor.commands.unsetLink();
    }
  }, [editor]);

  // Images
  const insertImage = useCallback((src: string, alt?: string, title?: string) => {
    if (editor) {
      editor.commands.setImage({ src, alt, title });
    }
  }, [editor]);

  // Find and replace
  const findAndReplace = useCallback((find: string, replace: string, options: any = {}) => {
    if (!editor) return 0;

    const { matchCase = false, wholeWord = false, replaceAll = false } = options;
    const content = editor.getHTML();
    
    let flags = 'g';
    if (!matchCase) flags += 'i';
    
    let pattern = find;
    if (wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    
    try {
      const regex = new RegExp(pattern, flags);
      const matches = content.match(regex);
      const count = matches ? matches.length : 0;
      
      if (count > 0) {
        const newContent = replaceAll 
          ? content.replace(regex, replace)
          : content.replace(regex, replace);
        
        editor.commands.setContent(newContent);
        return replaceAll ? count : 1;
      }
      
      return 0;
    } catch (error) {
      console.error('Find and replace error:', error);
      return 0;
    }
  }, [editor]);

  // Word count and statistics
  const getWordCount = useCallback(() => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }, [editor]);

  const getCharacterCount = useCallback(() => {
    if (!editor) return 0;
    return editor.storage.characterCount?.characters() || 0;
  }, [editor]);

  const getCharacterCountNoSpaces = useCallback(() => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.replace(/\s/g, '').length;
  }, [editor]);

  const getParagraphCount = useCallback(() => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  }, [editor]);

  // State checks
  const isActive = useCallback((name: string, attributes?: Record<string, any>) => {
    return editor?.isActive(name, attributes) || false;
  }, [editor]);

  const can = useCallback((name: string, attributes?: Record<string, any>) => {
    return editor?.can().chain().focus()[name](attributes).run() || false;
  }, [editor]);

  const isEmpty = useCallback(() => {
    return editor?.isEmpty || true;
  }, [editor]);

  const isFocused = useCallback(() => {
    return editor?.isFocused || false;
  }, [editor]);

  return {
    // State
    editor,
    selectedText,
    isInitialized,
    editorRef,

    // Initialization
    initializeEditor,

    // Content
    getContent,
    getTextContent,
    setContent,
    insertContent,
    replaceSelection,

    // Selection
    getSelection,
    selectAll,
    setSelectedText,

    // Focus
    focus,
    blur,

    // Text formatting
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrike,
    toggleCode,
    toggleHighlight,
    setTextColor,
    unsetTextColor,

    // Block formatting
    setHeading,
    setParagraph,
    toggleBulletList,
    toggleOrderedList,
    toggleTaskList,
    toggleBlockquote,
    toggleCodeBlock,
    insertHorizontalRule,
    insertPageBreak,

    // Text alignment
    setTextAlign,

    // History
    undo,
    redo,
    canUndo,
    canRedo,

    // Tables
    insertTable,
    deleteTable,
    addColumnBefore,
    addColumnAfter,
    deleteColumn,
    addRowBefore,
    addRowAfter,
    deleteRow,
    mergeCells,
    splitCell,
    toggleHeaderColumn,
    toggleHeaderRow,
    toggleHeaderCell,

    // Links
    setLink,
    unsetLink,

    // Images
    insertImage,

    // Find and replace
    findAndReplace,

    // Statistics
    getWordCount,
    getCharacterCount,
    getCharacterCountNoSpaces,
    getParagraphCount,

    // State checks
    isActive,
    can,
    isEmpty,
    isFocused,
  };
};