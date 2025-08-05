export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'imap' | 'exchange';
  imapServer: string;
  imapPort: number;
  smtpServer: string;
  smtpPort: number;
  username: string;
  encryptedPassword: string;
  isDefault: boolean;
  lastSync: Date | null;
  folders: EmailFolder[];
}

export interface EmailFolder {
  id: string;
  name: string;
  path: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'custom';
  parentId?: string;
  unreadCount: number;
  totalCount: number;
  lastSync: Date | null;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  contentId?: string;
  isInline: boolean;
  content?: Uint8Array;
  url?: string;
}

export interface Email {
  id: string;
  messageId: string;
  threadId?: string;
  accountId: string;
  folderId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  date: Date;
  receivedDate: Date;
  bodyText?: string;
  bodyHtml?: string;
  attachments: EmailAttachment[];
  flags: EmailFlags;
  labels: string[];
  priority: 'low' | 'normal' | 'high';
  importance: 'low' | 'normal' | 'high';
  aiSummary?: string;
  aiTone?: EmailTone;
  aiPriority?: number;
  aiCategory?: EmailCategory;
  extractedEvents?: CalendarEvent[];
  size: number;
}

export interface EmailFlags {
  seen: boolean;
  answered: boolean;
  flagged: boolean;
  deleted: boolean;
  draft: boolean;
  recent: boolean;
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: EmailAddress[];
  emails: Email[];
  lastActivity: Date;
  unreadCount: number;
  hasAttachments: boolean;
  labels: string[];
  aiSummary?: string;
}

export interface EmailTone {
  type: 'professional' | 'casual' | 'urgent' | 'friendly' | 'formal' | 'neutral';
  confidence: number;
  suggestions?: string[];
}

export interface EmailCategory {
  type: 'work' | 'personal' | 'finance' | 'travel' | 'shopping' | 'social' | 'promotions' | 'updates' | 'spam';
  confidence: number;
  reasoning?: string;
}

export interface ContactInfo {
  email: string;
  name?: string;
  frequency: number;
  lastContact: Date;
  organization?: string;
  avatarUrl?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  category: string;
  tags: string[];
  variables: TemplateVariable[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  placeholder: string;
  required: boolean;
  defaultValue?: string;
}

export interface EmailSignature {
  id: string;
  name: string;
  htmlContent: string;
  textContent: string;
  isDefault: boolean;
  accountId?: string;
}

export interface EmailRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isEnabled: boolean;
  priority: number;
}

export interface RuleCondition {
  field: 'from' | 'to' | 'subject' | 'body' | 'attachment' | 'size';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'greater' | 'less';
  value: string;
}

export interface RuleAction {
  type: 'move' | 'copy' | 'delete' | 'markRead' | 'markImportant' | 'addLabel' | 'forward' | 'reply';
  value?: string;
}

export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  description?: string;
  attendees?: EmailAddress[];
  confidence: number;
}

export interface SearchQuery {
  query: string;
  folder?: string;
  from?: string;
  to?: string;
  subject?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachment?: boolean;
  isUnread?: boolean;
  isFlagged?: boolean;
  labels?: string[];
  size?: {
    operator: 'greater' | 'less';
    value: number;
  };
}

export interface SearchResult {
  emails: Email[];
  total: number;
  query: SearchQuery;
  suggestions?: string[];
}

export interface ComposeEmail {
  id?: string;
  accountId: string;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: File[];
  priority: 'low' | 'normal' | 'high';
  requestReadReceipt?: boolean;
  scheduled?: Date;
  templateId?: string;
  signatureId?: string;
  replyToId?: string;
  forwardFromId?: string;
  isDraft: boolean;
}

export interface AIAssistanceRequest {
  type: 'summarize' | 'reply' | 'compose' | 'tone' | 'translate' | 'extract' | 'schedule';
  context: {
    email?: Email;
    thread?: EmailThread;
    prompt?: string;
    tone?: string;
    language?: string;
  };
}

export interface AIAssistanceResponse {
  type: AIAssistanceRequest['type'];
  content: string;
  suggestions?: string[];
  confidence: number;
  metadata?: Record<string, any>;
}

export interface EmailStats {
  totalEmails: number;
  unreadEmails: number;
  todayEmails: number;
  weekEmails: number;
  monthEmails: number;
  sentEmails: number;
  receivedEmails: number;
  avgResponseTime: number;
  topSenders: Array<{
    email: string;
    name?: string;
    count: number;
  }>;
  categoryBreakdown: Array<{
    category: EmailCategory['type'];
    count: number;
    percentage: number;
  }>;
}

export interface SyncStatus {
  accountId: string;
  isActive: boolean;
  lastSync: Date | null;
  progress: number;
  status: 'idle' | 'syncing' | 'error' | 'paused';
  error?: string;
  newEmails: number;
  updatedEmails: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';
  previewPane: 'right' | 'bottom' | 'hidden';
  autoMarkRead: boolean;
  autoMarkReadDelay: number;
  showAvatars: boolean;
  showPreview: boolean;
  syncInterval: number;
  offlineMode: boolean;
  enableNotifications: boolean;
  enableSounds: boolean;
  defaultSignature?: string;
  spamFiltering: boolean;
  phishingProtection: boolean;
  aiFeatures: {
    enableSummarization: boolean;
    enableSmartReply: boolean;
    enableToneDetection: boolean;
    enableCategorization: boolean;
    enableEventExtraction: boolean;
    enableSpamDetection: boolean;
  };
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  badge: boolean;
  accounts: Record<string, boolean>;
  folders: Record<string, boolean>;
  vipSenders: string[];
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    days: number[];
  };
}

// Error types
export interface EmailError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: EmailError;
}

// Store state types
export interface EmailStore {
  accounts: EmailAccount[];
  folders: Record<string, EmailFolder[]>;
  emails: Record<string, Email[]>;
  threads: Record<string, EmailThread[]>;
  currentAccount?: EmailAccount;
  currentFolder?: EmailFolder;
  selectedEmails: string[];
  searchQuery?: SearchQuery;
  searchResults?: SearchResult;
  syncStatus: Record<string, SyncStatus>;
  settings: AppSettings;
  isLoading: boolean;
  error?: EmailError;
}

export interface UIStore {
  sidebarCollapsed: boolean;
  previewPaneVisible: boolean;
  composeVisible: boolean;
  settingsVisible: boolean;
  searchVisible: boolean;
  currentView: 'list' | 'thread' | 'conversation';
  selectedEmailId?: string;
  selectedThreadId?: string;
}