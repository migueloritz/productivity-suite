import React from 'react';
import { Clock, FileText, Type, Save, Wifi, WifiOff } from 'lucide-react';
import { Document, WordCountResult } from '../types';

interface StatusBarProps {
  document: Document | null;
  wordCount: WordCountResult;
  readingTime: number;
  isDirty: boolean;
  isOnline?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  document,
  wordCount,
  readingTime,
  isDirty,
  isOnline = true,
}) => {
  const formatReadingTime = (minutes: number): string => {
    if (minutes < 1) return '< 1 min read';
    if (minutes === 1) return '1 min read';
    return `${Math.round(minutes)} min read`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="status-bar">
      <div className="flex items-center space-x-4 text-sm">
        {/* Document info */}
        {document && (
          <>
            <div className="flex items-center space-x-1">
              <FileText size={14} />
              <span>{document.title}</span>
              {isDirty && <span className="text-amber-600">•</span>}
            </div>
            
            <div className="flex items-center space-x-1">
              <Save size={14} />
              <span>Saved {formatDate(document.updated_at)}</span>
            </div>
          </>
        )}

        {!document && (
          <div className="flex items-center space-x-1">
            <FileText size={14} />
            <span>No document open</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4 text-sm">
        {/* Word count and reading time */}
        <div className="flex items-center space-x-1">
          <Type size={14} />
          <span>
            {wordCount.words} words, {wordCount.characters} chars
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <Clock size={14} />
          <span>{formatReadingTime(readingTime)}</span>
        </div>

        {/* Paragraph count */}
        <div className="text-gray-500">
          {wordCount.paragraphs} paragraphs
        </div>

        {/* Connection status */}
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <>
              <Wifi size={14} className="text-green-600" />
              <span className="text-green-600">Online</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-red-600" />
              <span className="text-red-600">Offline</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};