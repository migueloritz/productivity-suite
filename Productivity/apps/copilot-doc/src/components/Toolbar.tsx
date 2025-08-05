import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  CodeSquare,
  Minus,
  Table,
  Link,
  Image,
  Undo2,
  Redo2,
  FileText,
  FolderOpen,
  Save,
  Download,
  Search,
  Bot,
  Sidebar,
  Palette,
  Type,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';

import { Document } from '../types';

interface ToolbarProps {
  document: Document | null;
  editor: Editor | null;
  onNewDocument: () => void;
  onOpenDocument: () => void;
  onSaveDocument: () => void;
  onExport: () => void;
  onFindReplace: () => void;
  onToggleAI: () => void;
  onToggleSidebar: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  document,
  editor,
  onNewDocument,
  onOpenDocument,
  onSaveDocument,
  onExport,
  onFindReplace,
  onToggleAI,
  onToggleSidebar,
}) => {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);

  const colors = [
    '#000000', '#374151', '#6b7280', '#ef4444', '#f97316', 
    '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  const highlightColors = [
    '#fef3c7', '#fecaca', '#fed7d7', '#d1fae5', '#ddd6fe', '#e0e7ff'
  ];

  const fontSizes = [
    { label: 'Small', value: 'text-sm' },
    { label: 'Normal', value: 'text-base' },
    { label: 'Large', value: 'text-lg' },
    { label: 'Extra Large', value: 'text-xl' },
  ];

  const headingOptions = [
    { label: 'Paragraph', value: 'paragraph', level: null },
    { label: 'Heading 1', value: 'heading', level: 1 },
    { label: 'Heading 2', value: 'heading', level: 2 },
    { label: 'Heading 3', value: 'heading', level: 3 },
    { label: 'Heading 4', value: 'heading', level: 4 },
    { label: 'Heading 5', value: 'heading', level: 5 },
    { label: 'Heading 6', value: 'heading', level: 6 },
  ];

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title?: string;
    children: React.ReactNode;
  }> = ({ onClick, isActive = false, disabled = false, title, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        toolbar-button
        ${isActive ? 'active' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </button>
  );

  const ToolbarSeparator: React.FC = () => (
    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
  );

  const ToolbarGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="toolbar-group">
      {children}
    </div>
  );

  const ColorPicker: React.FC<{
    colors: string[];
    onSelect: (color: string) => void;
    isOpen: boolean;
    onClose: () => void;
  }> = ({ colors, onSelect, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
        <div className="grid grid-cols-6 gap-1">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => {
                onSelect(color);
                onClose();
              }}
              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    );
  };

  const Dropdown: React.FC<{
    options: any[];
    onSelect: (option: any) => void;
    isOpen: boolean;
    onClose: () => void;
    renderOption: (option: any) => React.ReactNode;
  }> = ({ options, onSelect, isOpen, onClose, renderOption }) => {
    if (!isOpen) return null;

    return (
      <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[150px]">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => {
              onSelect(option);
              onClose();
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {renderOption(option)}
          </button>
        ))}
      </div>
    );
  };

  const handleHeadingSelect = (option: any) => {
    if (!editor) return;
    
    if (option.value === 'paragraph') {
      editor.commands.setParagraph();
    } else {
      editor.commands.setHeading({ level: option.level });
    }
  };

  const handleInsertTable = () => {
    if (editor) {
      editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
    }
  };

  const handleInsertLink = () => {
    if (!editor) return;
    
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.commands.setLink({ href: url });
    }
  };

  const handleInsertImage = () => {
    if (!editor) return;
    
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.commands.setImage({ src: url });
    }
  };

  if (!editor) {
    return (
      <div className="toolbar">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-full rounded"></div>
      </div>
    );
  }

  return (
    <div className="toolbar">
      {/* File Operations */}
      <ToolbarGroup>
        <ToolbarButton onClick={onNewDocument} title="New Document (Ctrl+N)">
          <FileText size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={onOpenDocument} title="Open Document (Ctrl+O)">
          <FolderOpen size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={onSaveDocument} 
          disabled={!document}
          title="Save Document (Ctrl+S)"
        >
          <Save size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={onExport} 
          disabled={!document}
          title="Export Document (Ctrl+E)"
        >
          <Download size={16} />
        </ToolbarButton>
      </ToolbarGroup>

      {/* History */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.commands.undo()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.commands.redo()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </ToolbarButton>
      </ToolbarGroup>

      {/* Text Formatting */}
      <ToolbarGroup>
        <div className="relative">
          <ToolbarButton
            onClick={() => setHeadingDropdownOpen(!headingDropdownOpen)}
            title="Text Style"
          >
            <Type size={16} />
            <ChevronDown size={12} />
          </ToolbarButton>
          <Dropdown
            options={headingOptions}
            onSelect={handleHeadingSelect}
            isOpen={headingDropdownOpen}
            onClose={() => setHeadingDropdownOpen(false)}
            renderOption={(option) => (
              <span className={option.level ? `text-${6-option.level + 1}xl font-semibold` : ''}>
                {option.label}
              </span>
            )}
          />
        </div>
        
        <ToolbarButton
          onClick={() => editor.commands.toggleBold()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.commands.toggleItalic()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.commands.toggleUnderline()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.commands.toggleStrike()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.commands.toggleCode()}
          isActive={editor.isActive('code')}
          title="Code"
        >
          <Code size={16} />
        </ToolbarButton>
      </ToolbarGroup>

      {/* Colors */}
      <ToolbarGroup>
        <div className="relative">
          <ToolbarButton
            onClick={() => setColorPickerOpen(!colorPickerOpen)}
            title="Text Color"
          >
            <Palette size={16} />
          </ToolbarButton>
          <ColorPicker
            colors={colors}
            onSelect={(color) => editor.commands.setColor(color)}
            isOpen={colorPickerOpen}
            onClose={() => setColorPickerOpen(false)}
          />
        </div>
        
        <div className="relative">
          <ToolbarButton
            onClick={() => setHighlightPickerOpen(!highlightPickerOpen)}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <Highlighter size={16} />
          </ToolbarButton>
          <ColorPicker
            colors={highlightColors}
            onSelect={(color) => editor.commands.toggleHighlight({ color })}
            isOpen={highlightPickerOpen}
            onClose={() => setHighlightPickerOpen(false)}
          />
        </div>
      </ToolbarGroup>

      {/* Alignment */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.commands.setTextAlign('left')}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.commands.setTextAlign('center')}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.commands.setTextAlign('right')}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.commands.setTextAlign('justify')}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify size={16} />
        </ToolbarButton>
      </ToolbarGroup>

      {/* Lists */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.commands.toggleBulletList()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.commands.toggleOrderedList()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.commands.toggleTaskList()}
          isActive={editor.isActive('taskList')}
          title="Task List"
        >
          <CheckSquare size={16} />
        </ToolbarButton>
      </ToolbarGroup>

      {/* Blocks */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.commands.toggleBlockquote()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.commands.toggleCodeBlock()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <CodeSquare size={16} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.commands.setHorizontalRule()}
          title="Horizontal Rule"
        >
          <Minus size={16} />
        </ToolbarButton>
      </ToolbarGroup>

      {/* Insert */}
      <ToolbarGroup>
        <ToolbarButton onClick={handleInsertTable} title="Insert Table">
          <Table size={16} />
        </ToolbarButton>
        
        <ToolbarButton onClick={handleInsertLink} title="Insert Link">
          <Link size={16} />
        </ToolbarButton>
        
        <ToolbarButton onClick={handleInsertImage} title="Insert Image">
          <Image size={16} />
        </ToolbarButton>
      </ToolbarGroup>

      {/* Tools */}
      <ToolbarGroup>
        <ToolbarButton onClick={onFindReplace} title="Find & Replace (Ctrl+F)">
          <Search size={16} />
        </ToolbarButton>
        
        <ToolbarButton onClick={onToggleAI} title="AI Assistant (Ctrl+Shift+A)">
          <Bot size={16} />
        </ToolbarButton>
        
        <ToolbarButton onClick={onToggleSidebar} title="Toggle Sidebar">
          <Sidebar size={16} />
        </ToolbarButton>
      </ToolbarGroup>
    </div>
  );
};