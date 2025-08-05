import React, { useState, useRef } from 'react';
import { Plus, X, Edit3, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SheetTabsProps } from '@/types';

interface SheetContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  sheetId: string;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  canDelete: boolean;
}

function SheetContextMenu({ 
  isOpen, 
  position, 
  onClose, 
  onRename, 
  onDelete, 
  onDuplicate,
  canDelete 
}: SheetContextMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Menu */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="context-menu z-50"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y
        }}
      >
        <button
          className="context-menu-item"
          onClick={onRename}
        >
          <Edit3 className="w-4 h-4" />
          Rename
        </button>
        
        <button
          className="context-menu-item"
          onClick={onDuplicate}
        >
          <Plus className="w-4 h-4" />
          Duplicate
        </button>
        
        <div className="context-menu-separator" />
        
        <button
          className={`context-menu-item ${!canDelete ? 'disabled' : ''}`}
          onClick={canDelete ? onDelete : undefined}
          disabled={!canDelete}
        >
          <X className="w-4 h-4" />
          Delete
        </button>
      </motion.div>
    </>
  );
}

export function SheetTabs({
  sheets,
  activeSheet,
  onSheetChange,
  onSheetAdd,
  onSheetDelete,
  onSheetRename
}: SheetTabsProps) {
  const [renamingSheet, setRenamingSheet] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    sheetId: string;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    sheetId: ''
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSheetClick = (sheetId: string) => {
    if (renamingSheet === sheetId) return;
    onSheetChange(sheetId);
  };

  const handleSheetDoubleClick = (sheetId: string, sheetName: string) => {
    setRenamingSheet(sheetId);
    setNewName(sheetName);
  };

  const handleSheetRightClick = (e: React.MouseEvent, sheetId: string) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      sheetId
    });
  };

  const handleRenameSubmit = () => {
    if (renamingSheet && newName.trim()) {
      onSheetRename(renamingSheet, newName.trim());
    }
    setRenamingSheet(null);
    setNewName('');
  };

  const handleRenameCancel = () => {
    setRenamingSheet(null);
    setNewName('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  const handleContextMenuRename = () => {
    const sheet = sheets.find(s => s.id === contextMenu.sheetId);
    if (sheet) {
      handleSheetDoubleClick(contextMenu.sheetId, sheet.name);
    }
    closeContextMenu();
  };

  const handleContextMenuDelete = () => {
    if (sheets.length > 1) {
      onSheetDelete(contextMenu.sheetId);
    }
    closeContextMenu();
  };

  const handleContextMenuDuplicate = () => {
    const sheet = sheets.find(s => s.id === contextMenu.sheetId);
    if (sheet) {
      onSheetAdd(`${sheet.name} Copy`);
    }
    closeContextMenu();
  };

  const handleAddSheet = () => {
    const newSheetNumber = sheets.length + 1;
    onSheetAdd(`Sheet${newSheetNumber}`);
  };

  return (
    <>
      <div className="sheet-tabs">
        {/* Sheet Tab List */}
        <div className="flex items-center overflow-x-auto">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className={`
                sheet-tab
                ${activeSheet === sheet.id ? 'active' : ''}
              `}
              onClick={() => handleSheetClick(sheet.id)}
              onDoubleClick={() => handleSheetDoubleClick(sheet.id, sheet.name)}
              onContextMenu={(e) => handleSheetRightClick(e, sheet.id)}
            >
              {renamingSheet === sheet.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={handleRenameKeyDown}
                  className="bg-transparent border-none outline-none text-inherit w-20"
                  autoFocus
                />
              ) : (
                <span className="select-none">{sheet.name}</span>
              )}
            </div>
          ))}

          {/* Add Sheet Button */}
          <button
            className="sheet-tab-add"
            onClick={handleAddSheet}
            title="Add new sheet"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Sheet Controls */}
        <div className="flex items-center ml-auto gap-2">
          <div className="text-xs text-gray-500">
            {sheets.length} sheet{sheets.length !== 1 ? 's' : ''}
          </div>
          
          <button
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 transition-colors"
            title="Sheet options"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu.isOpen && (
          <SheetContextMenu
            isOpen={contextMenu.isOpen}
            position={contextMenu.position}
            sheetId={contextMenu.sheetId}
            onClose={closeContextMenu}
            onRename={handleContextMenuRename}
            onDelete={handleContextMenuDelete}
            onDuplicate={handleContextMenuDuplicate}
            canDelete={sheets.length > 1}
          />
        )}
      </AnimatePresence>
    </>
  );
}