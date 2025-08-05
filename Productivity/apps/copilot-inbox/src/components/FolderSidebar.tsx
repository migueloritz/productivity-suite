import React from 'react';
import { useEmail } from '../hooks/useEmail';
import { useAuth } from '../hooks/useAuth';
import {
  InboxIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface FolderSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const FolderSidebar: React.FC<FolderSidebarProps> = ({
  collapsed,
  onToggle,
}) => {
  const { folders, currentFolder, selectFolder } = useEmail();
  const { currentAccount } = useAuth();

  const getFolderIcon = (type: string) => {
    switch (type) {
      case 'inbox':
        return InboxIcon;
      case 'sent':
        return PaperAirplaneIcon;
      case 'drafts':
        return DocumentTextIcon;
      case 'trash':
        return TrashIcon;
      case 'spam':
        return ExclamationTriangleIcon;
      default:
        return FolderIcon;
    }
  };

  if (!currentAccount) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Folder List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {folders.map((folder) => {
            const Icon = getFolderIcon(folder.type);
            const isActive = currentFolder?.id === folder.id;

            return (
              <button
                key={folder.id}
                onClick={() => selectFolder(folder.id)}
                className={clsx(
                  'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{folder.name}</span>
                    {folder.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                        {folder.unreadCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Info */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentAccount.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentAccount.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentAccount.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};