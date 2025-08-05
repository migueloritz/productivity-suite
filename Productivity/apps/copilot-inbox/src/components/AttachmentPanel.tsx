import React from 'react';
import { Email } from '../types';
import { PaperClipIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface AttachmentPanelProps {
  email: Email | null;
  onClose: () => void;
}

export const AttachmentPanel: React.FC<AttachmentPanelProps> = ({ email, onClose }) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (attachment: any) => {
    // Implementation would download the attachment
    console.log('Download attachment:', attachment.filename);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PaperClipIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Attachments</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!email ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <PaperClipIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select an email to view attachments</p>
            </div>
          </div>
        ) : email.attachments.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <PaperClipIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No attachments in this email</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {email.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span className="text-2xl">{getFileIcon(attachment.mimeType)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)} • {attachment.mimeType}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDownload(attachment)}
                  className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};