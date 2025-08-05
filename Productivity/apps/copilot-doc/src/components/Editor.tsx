import React, { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import History from '@tiptap/extension-history';

import { Document } from '../types';

interface EditorProps {
  document: Document | null;
  onContentChange: (content: string) => void;
  onSelectionChange: (text: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export const Editor: React.FC<EditorProps> = ({
  document,
  onContentChange,
  onSelectionChange,
  placeholder = "Start writing your document...",
  readOnly = false,
  className = ""
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // We'll use our own history extension
      }),
      History.configure({
        depth: 100,
        newGroupDelay: 500,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse w-full my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-50 font-semibold',
        },
      }),
      TableCell,
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start',
        },
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
        showOnlyWhenEditable: true,
      }),
    ],
    content: document?.content || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange(html);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      onSelectionChange(selectedText);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
        spellcheck: 'true',
      },
    },
  });

  // Update editor content when document changes
  useEffect(() => {
    if (editor && document) {
      const currentContent = editor.getHTML();
      if (currentContent !== document.content) {
        editor.commands.setContent(document.content, false);
      }
    }
  }, [editor, document]);

  // Focus editor when it mounts
  useEffect(() => {
    if (editor && !readOnly) {
      editor.commands.focus();
    }
  }, [editor, readOnly]);

  const insertContent = useCallback((content: string) => {
    if (editor) {
      editor.commands.insertContent(content);
    }
  }, [editor]);

  const setContent = useCallback((content: string) => {
    if (editor) {
      editor.commands.setContent(content);
    }
  }, [editor]);

  const getContent = useCallback(() => {
    return editor?.getHTML() || '';
  }, [editor]);

  const getTextContent = useCallback(() => {
    return editor?.getText() || '';
  }, [editor]);

  const getWordCount = useCallback(() => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }, [editor]);

  const getCharacterCount = useCallback(() => {
    return editor?.storage.characterCount?.characters() || 0;
  }, [editor]);

  const canUndo = useCallback(() => {
    return editor?.can().undo() || false;
  }, [editor]);

  const canRedo = useCallback(() => {
    return editor?.can().redo() || false;
  }, [editor]);

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

  const setTextAlign = useCallback((alignment: 'left' | 'center' | 'right' | 'justify') => {
    if (editor) {
      editor.commands.setTextAlign(alignment);
    }
  }, [editor]);

  const insertTable = useCallback((rows: number = 3, cols: number = 3) => {
    if (editor) {
      editor.commands.insertTable({ 
        rows, 
        cols, 
        withHeaderRow: true 
      });
    }
  }, [editor]);

  const insertImage = useCallback((src: string, alt?: string) => {
    if (editor) {
      editor.commands.setImage({ src, alt });
    }
  }, [editor]);

  const setLink = useCallback((href: string) => {
    if (editor) {
      editor.commands.setLink({ href });
    }
  }, [editor]);

  const unsetLink = useCallback(() => {
    if (editor) {
      editor.commands.unsetLink();
    }
  }, [editor]);

  const findAndReplace = useCallback((find: string, replace: string, replaceAll: boolean = false) => {
    if (!editor) return 0;

    const content = editor.getHTML();
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), replaceAll ? 'gi' : 'i');
    const newContent = replaceAll 
      ? content.replace(regex, replace)
      : content.replace(regex, replace);
    
    const matches = content.match(regex);
    const replacedCount = matches ? matches.length : 0;
    
    if (replacedCount > 0) {
      editor.commands.setContent(newContent);
    }
    
    return replacedCount;
  }, [editor]);

  // Expose editor methods to parent component
  React.useImperativeHandle(React.forwardRef(() => ({})).current, () => ({
    editor,
    insertContent,
    setContent,
    getContent,
    getTextContent,
    getWordCount,
    getCharacterCount,
    canUndo,
    canRedo,
    undo,
    redo,
    toggleBold,
    toggleItalic,
    toggleStrike,
    toggleCode,
    toggleHighlight,
    setTextColor,
    setHeading,
    setParagraph,
    toggleBulletList,
    toggleOrderedList,
    toggleTaskList,
    toggleBlockquote,
    toggleCodeBlock,
    setTextAlign,
    insertTable,
    insertImage,
    setLink,
    unsetLink,
    findAndReplace,
  }), [
    editor,
    insertContent,
    setContent,
    getContent,
    getTextContent,
    getWordCount,
    getCharacterCount,
    canUndo,
    canRedo,
    undo,
    redo,
    toggleBold,
    toggleItalic,
    toggleStrike,
    toggleCode,
    toggleHighlight,
    setTextColor,
    setHeading,
    setParagraph,
    toggleBulletList,
    toggleOrderedList,
    toggleTaskList,
    toggleBlockquote,
    toggleCodeBlock,
    setTextAlign,
    insertTable,
    insertImage,
    setLink,
    unsetLink,
    findAndReplace,
  ]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`editor-container h-full overflow-y-auto ${className}`}>
      <EditorContent 
        editor={editor} 
        className="h-full min-h-full"
      />
    </div>
  );
};