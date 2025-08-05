import React, { useCallback, useState, useRef } from 'react';
import { X, Circle, MoreHorizontal } from 'lucide-react';
import { TabBarProps } from '@/types';

const TabBar: React.FC<TabBarProps> = ({
  files,
  activeFileId,
  onTabSelect,
  onTabClose,
  onTabMove,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Handle tab click
  const handleTabClick = useCallback((fileId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.button === 1) {
      // Middle click - close tab
      onTabClose(fileId);
    } else if (e.button === 0) {
      // Left click - select tab
      onTabSelect(fileId);
    }
  }, [onTabSelect, onTabClose]);

  // Handle close button click
  const handleCloseClick = useCallback((fileId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTabClose(fileId);
  }, [onTabClose]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onTabMove(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, onTabMove]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Get file icon based on extension
  const getFileIcon = useCallback((fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return '🟨';
      case 'ts':
      case 'tsx':
        return '🔷';
      case 'py':
        return '🐍';
      case 'rs':
        return '🦀';
      case 'java':
        return '☕';
      case 'cpp':
      case 'c':
        return '⚙️';
      case 'html':
        return '🌐';
      case 'css':
        return '🎨';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      case 'xml':
        return '📄';
      case 'yaml':
      case 'yml':
        return '🔧';
      default:
        return '📄';
    }
  }, []);

  // Scroll tabs if needed
  const scrollToActiveTab = useCallback(() => {
    if (!tabBarRef.current || !activeFileId) return;

    const activeTabElement = tabBarRef.current.querySelector(`[data-file-id="${activeFileId}"]`);
    if (activeTabElement) {
      activeTabElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeFileId]);

  React.useEffect(() => {
    scrollToActiveTab();
  }, [activeFileId, scrollToActiveTab]);

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="h-10 bg-secondary border-b border-border flex items-center">
      <div
        ref={tabBarRef}
        className="flex-1 flex overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }}
      >
        {files.map((file, index) => {
          const isActive = file.id === activeFileId;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          
          return (
            <div
              key={file.id}
              data-file-id={file.id}
              className={`tab-item ${isActive ? 'active' : ''} ${
                isDragging ? 'opacity-50' : ''
              } ${isDragOver ? 'border-l-2 border-l-primary' : ''}`}
              onMouseDown={(e) => handleTabClick(file.id, e)}
              onAuxClick={(e) => handleTabClick(file.id, e)}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* File Icon */}
              <span className="text-sm mr-2" role="img" aria-label="file icon">
                {getFileIcon(file.name)}
              </span>
              
              {/* File Name */}
              <span className="text-sm truncate flex-1 min-w-0">
                {file.name}
              </span>
              
              {/* Dirty Indicator */}
              {file.isDirty && (
                <Circle
                  size={8}
                  className="ml-2 text-yellow-500 fill-current"
                  title="Unsaved changes"
                />
              )}
              
              {/* Close Button */}
              <button
                className="tab-close ml-2 p-0.5 hover:bg-muted rounded opacity-60 hover:opacity-100"
                onClick={(e) => handleCloseClick(file.id, e)}
                title={`Close ${file.name}`}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Tab Actions */}
      {files.length > 1 && (
        <div className="flex items-center px-2 border-l border-border">
          <button
            className="p-1 hover:bg-accent rounded"
            title="Tab actions"
            onClick={() => {
              // TODO: Implement tab actions menu
              console.log('Tab actions');
            }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TabBar;