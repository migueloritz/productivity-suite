import React, { useMemo, useCallback } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Email, EmailThread } from '../types';
import { useEmail } from '../hooks/useEmail';
import {
  PaperClipIcon,
  StarIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import clsx from 'clsx';

interface EmailListProps {
  emails: Email[];
  threads: EmailThread[];
  selectedEmails: string[];
  selectedEmailId: string | null;
  onSelectEmail: (emailId: string) => void;
  view: 'list' | 'conversation';
  isLoading: boolean;
}

interface EmailItemProps {
  email: Email;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: (emailId: string) => void;
  onToggleCheck: (emailId: string) => void;
  onToggleStar: (emailId: string) => void;
}

interface ThreadItemProps {
  thread: EmailThread;
  isSelected: boolean;
  onSelect: (emailId: string) => void;
}

const EmailItem: React.FC<EmailItemProps> = ({
  email,
  isSelected,
  isChecked,
  onSelect,
  onToggleCheck,
  onToggleStar,
}) => {
  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const getPreviewText = (email: Email) => {
    const text = email.bodyText || email.bodyHtml || '';
    return text.replace(/<[^>]*>/g, '').substring(0, 100);
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') {
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  return (
    <div
      className={clsx(
        'flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors',
        isSelected && 'bg-blue-50 border-blue-200',
        !email.flags.seen && 'bg-blue-25',
        email.priority === 'high' && 'border-l-4 border-red-400'
      )}
      onClick={() => onSelect(email.id)}
    >
      {/* Checkbox */}
      <div className="mr-3">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => {
            e.stopPropagation();
            onToggleCheck(email.id);
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* Star */}
      <div className="mr-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(email.id);
          }}
          className="text-gray-400 hover:text-yellow-500 transition-colors"
        >
          {email.flags.flagged ? (
            <StarIconSolid className="w-5 h-5 text-yellow-500" />
          ) : (
            <StarIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className={clsx(
              'text-sm',
              !email.flags.seen ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            )}>
              {email.from.name || email.from.address}
            </span>
            
            {getPriorityIcon(email.priority)}
            
            {email.attachments.length > 0 && (
              <PaperClipIcon className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatDate(email.date)}
          </span>
        </div>

        <div className="mb-1">
          <span className={clsx(
            'text-sm',
            !email.flags.seen ? 'font-medium text-gray-900' : 'text-gray-700'
          )}>
            {email.subject || '(no subject)'}
          </span>
        </div>

        <div className="text-xs text-gray-500 email-preview">
          {getPreviewText(email)}
        </div>

        {/* Labels */}
        {email.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {email.labels.slice(0, 3).map((label) => (
              <span
                key={label}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {label}
              </span>
            ))}
            {email.labels.length > 3 && (
              <span className="text-xs text-gray-500">
                +{email.labels.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ThreadItem: React.FC<ThreadItemProps> = ({
  thread,
  isSelected,
  onSelect,
}) => {
  const latestEmail = thread.emails[thread.emails.length - 1];
  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const getParticipantNames = () => {
    return thread.participants
      .slice(0, 3)
      .map(p => p.name || p.address.split('@')[0])
      .join(', ');
  };

  return (
    <div
      className={clsx(
        'flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors',
        isSelected && 'bg-blue-50 border-blue-200',
        thread.unreadCount > 0 && 'bg-blue-25'
      )}
      onClick={() => onSelect(latestEmail.id)}
    >
      {/* Thread indicator */}
      <div className="mr-3">
        <div className="flex items-center space-x-1">
          <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-blue-600 font-medium">
            {thread.emails.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className={clsx(
              'text-sm',
              thread.unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            )}>
              {getParticipantNames()}
            </span>
            
            {thread.unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {thread.unreadCount} new
              </span>
            )}
            
            {thread.hasAttachments && (
              <PaperClipIcon className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatDate(thread.lastActivity)}
          </span>
        </div>

        <div className="mb-1">
          <span className={clsx(
            'text-sm',
            thread.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-700'
          )}>
            {thread.subject || '(no subject)'}
          </span>
        </div>

        <div className="text-xs text-gray-500 email-preview">
          {thread.aiSummary || latestEmail.bodyText?.substring(0, 100) || ''}
        </div>

        {/* Labels */}
        {thread.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {thread.labels.slice(0, 3).map((label) => (
              <span
                key={label}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {label}
              </span>
            ))}
            {thread.labels.length > 3 && (
              <span className="text-xs text-gray-500">
                +{thread.labels.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-1">
    {Array.from({ length: 10 }).map((_, index) => (
      <div key={index} className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-gray-200 rounded loading-shimmer"></div>
          <div className="w-5 h-5 bg-gray-200 rounded loading-shimmer"></div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="w-32 h-4 bg-gray-200 rounded loading-shimmer"></div>
              <div className="w-12 h-3 bg-gray-200 rounded loading-shimmer"></div>
            </div>
            <div className="w-48 h-4 bg-gray-200 rounded loading-shimmer"></div>
            <div className="w-full h-3 bg-gray-200 rounded loading-shimmer"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  threads,
  selectedEmails,
  selectedEmailId,
  onSelectEmail,
  view,
  isLoading,
}) => {
  const { toggleEmailSelection, markAsFlagged } = useEmail();

  const handleToggleCheck = useCallback((emailId: string) => {
    toggleEmailSelection(emailId);
  }, [toggleEmailSelection]);

  const handleToggleStar = useCallback(async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (email) {
      await markAsFlagged([emailId], !email.flags.flagged);
    }
  }, [emails, markAsFlagged]);

  const sortedEmails = useMemo(() => {
    return [...emails].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [emails]);

  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }, [threads]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (view === 'conversation') {
    if (sortedThreads.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500 p-8">
          <div className="text-center">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No conversations</p>
            <p className="text-sm">Your email conversations will appear here</p>
          </div>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {sortedThreads.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={thread}
            isSelected={selectedEmailId === thread.emails[thread.emails.length - 1].id}
            onSelect={onSelectEmail}
          />
        ))}
      </div>
    );
  }

  if (sortedEmails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📬</div>
          <p className="text-lg mb-2">No emails</p>
          <p className="text-sm">Your emails will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {sortedEmails.map((email) => (
        <EmailItem
          key={email.id}
          email={email}
          isSelected={selectedEmailId === email.id}
          isChecked={selectedEmails.includes(email.id)}
          onSelect={onSelectEmail}
          onToggleCheck={handleToggleCheck}
          onToggleStar={handleToggleStar}
        />
      ))}
    </div>
  );
};