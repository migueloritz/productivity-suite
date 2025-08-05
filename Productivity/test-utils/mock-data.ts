// Mock data for testing various components

export const mockDocuments = [
  {
    id: '1',
    title: 'Project Proposal',
    content: '# Project Proposal\n\nThis is a sample document content...',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:45:00Z',
    wordCount: 450,
    path: '/documents/project-proposal.md',
    template: 'report',
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: '## Team Meeting - Jan 16\n\n### Attendees\n- John Doe\n- Jane Smith',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T10:30:00Z',
    wordCount: 125,
    path: '/documents/meeting-notes-jan16.md',
    template: 'meeting_notes',
  },
  {
    id: '3',
    title: 'Cover Letter',
    content: 'Dear Hiring Manager,\n\nI am writing to express my interest...',
    createdAt: '2024-01-10T08:15:00Z',
    updatedAt: '2024-01-12T16:20:00Z',
    wordCount: 320,
    path: '/documents/cover-letter.md',
    template: 'letter',
  },
];

export const mockSpreadsheetData = {
  sheets: [
    {
      id: 'sheet1',
      name: 'Budget 2024',
      cells: {
        'A1': { value: 'Category', formula: '', type: 'string' },
        'B1': { value: 'Q1', formula: '', type: 'string' },
        'C1': { value: 'Q2', formula: '', type: 'string' },
        'D1': { value: 'Q3', formula: '', type: 'string' },
        'E1': { value: 'Q4', formula: '', type: 'string' },
        'F1': { value: 'Total', formula: '=SUM(B1:E1)', type: 'number' },
        'A2': { value: 'Marketing', formula: '', type: 'string' },
        'B2': { value: 25000, formula: '', type: 'number' },
        'C2': { value: 30000, formula: '', type: 'number' },
        'D2': { value: 28000, formula: '', type: 'number' },
        'E2': { value: 32000, formula: '', type: 'number' },
        'F2': { value: 115000, formula: '=SUM(B2:E2)', type: 'number' },
        'A3': { value: 'Development', formula: '', type: 'string' },
        'B3': { value: 80000, formula: '', type: 'number' },
        'C3': { value: 85000, formula: '', type: 'number' },
        'D3': { value: 90000, formula: '', type: 'number' },
        'E3': { value: 95000, formula: '', type: 'number' },
        'F3': { value: 350000, formula: '=SUM(B3:E3)', type: 'number' },
      },
      rowCount: 100,
      columnCount: 26,
    },
    {
      id: 'sheet2',
      name: 'Sales Data',
      cells: {
        'A1': { value: 'Month', formula: '', type: 'string' },
        'B1': { value: 'Sales', formula: '', type: 'string' },
        'C1': { value: 'Target', formula: '', type: 'string' },
        'D1': { value: 'Variance', formula: '', type: 'string' },
        'A2': { value: 'January', formula: '', type: 'string' },
        'B2': { value: 45000, formula: '', type: 'number' },
        'C2': { value: 50000, formula: '', type: 'number' },
        'D2': { value: -5000, formula: '=B2-C2', type: 'number' },
      },
      rowCount: 100,
      columnCount: 26,
    },
  ],
  activeSheet: 'sheet1',
};

export const mockEmails = [
  {
    id: '1',
    subject: 'Project Update Required',
    from: { name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
    to: [{ name: 'John Doe', email: 'john.doe@company.com' }],
    cc: [],
    bcc: [],
    date: '2024-01-16T14:30:00Z',
    body: 'Hi John,\n\nCould you please provide an update on the current project status?\n\nThanks,\nSarah',
    htmlBody: '<p>Hi John,</p><p>Could you please provide an update on the current project status?</p><p>Thanks,<br>Sarah</p>',
    isRead: false,
    isStarred: false,
    folder: 'INBOX',
    attachments: [],
    priority: 'normal',
  },
  {
    id: '2',
    subject: 'Weekly Team Meeting',
    from: { name: 'Mike Wilson', email: 'mike.wilson@company.com' },
    to: [
      { name: 'John Doe', email: 'john.doe@company.com' },
      { name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
    ],
    cc: [],
    bcc: [],
    date: '2024-01-15T09:00:00Z',
    body: 'Team,\n\nOur weekly meeting is scheduled for Thursday at 2 PM.\n\nAgenda:\n1. Project updates\n2. New assignments\n3. Q&A\n\nBest,\nMike',
    htmlBody: '<p>Team,</p><p>Our weekly meeting is scheduled for Thursday at 2 PM.</p><p>Agenda:</p><ol><li>Project updates</li><li>New assignments</li><li>Q&A</li></ol><p>Best,<br>Mike</p>',
    isRead: true,
    isStarred: true,
    folder: 'INBOX',
    attachments: [
      {
        id: 'att1',
        filename: 'agenda.pdf',
        size: 145280,
        contentType: 'application/pdf',
      },
    ],
    priority: 'high',
  },
  {
    id: '3',
    subject: 'Lunch invitation',
    from: { name: 'Emma Davis', email: 'emma.davis@company.com' },
    to: [{ name: 'John Doe', email: 'john.doe@company.com' }],
    cc: [],
    bcc: [],
    date: '2024-01-14T12:15:00Z',
    body: 'Hey John!\n\nWant to grab lunch tomorrow? The new Italian place downtown?\n\nLet me know!\nEmma',
    htmlBody: '<p>Hey John!</p><p>Want to grab lunch tomorrow? The new Italian place downtown?</p><p>Let me know!<br>Emma</p>',
    isRead: true,
    isStarred: false,
    folder: 'INBOX',
    attachments: [],
    priority: 'low',
  },
];

export const mockCodeFiles = [
  {
    id: '1',
    name: 'App.tsx',
    path: '/src/App.tsx',
    content: `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`,
    language: 'typescript',
    size: 425,
    lastModified: '2024-01-16T10:30:00Z',
    isModified: false,
  },
  {
    id: '2',
    name: 'utils.ts',
    path: '/src/utils/utils.ts',
    content: `export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}`,
    language: 'typescript',
    size: 598,
    lastModified: '2024-01-15T16:45:00Z',
    isModified: true,
  },
  {
    id: '3',
    name: 'package.json',
    path: '/package.json',
    content: `{
  "name": "my-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^4.9.0"
  }
}`,
    language: 'json',
    size: 512,
    lastModified: '2024-01-10T14:20:00Z',
    isModified: false,
  },
];

export const mockAIResponses = {
  documentSuggestion: {
    suggestions: [
      'Consider adding a conclusion section to summarize key points',
      'The introduction could benefit from a stronger thesis statement',
      'Add supporting evidence for the claims in paragraph 3',
    ],
    tone: 'formal',
    readabilityScore: 78,
    wordCount: 456,
  },
  codeReview: {
    suggestions: [
      'Consider using TypeScript interfaces for better type safety',
      'Add error handling for the API calls',
      'Extract the magic numbers into constants',
    ],
    issues: [
      {
        line: 15,
        message: 'Potential null pointer exception',
        severity: 'warning',
      },
      {
        line: 23,
        message: 'Unused variable detected',
        severity: 'info',
      },
    ],
    complexity: 'medium',
  },
  emailDraft: {
    subject: 'Re: Project Update Required',
    body: `Hi Sarah,

Thank you for reaching out. Here's the current status of the project:

1. **Phase 1**: Completed (100%)
2. **Phase 2**: In progress (75%)
3. **Phase 3**: Not started (0%)

We're on track to meet the deadline, with Phase 2 expected to complete by Friday.

Please let me know if you need any additional details.

Best regards,
John`,
    tone: 'professional',
    confidence: 0.92,
  },
  spreadsheetAnalysis: {
    insights: [
      'Marketing spend increased by 28% in Q4',
      'Development costs are trending upward',
      'Total budget utilization is at 87%',
    ],
    trends: [
      { metric: 'Marketing', direction: 'up', percentage: 28 },
      { metric: 'Development', direction: 'up', percentage: 19 },
      { metric: 'Sales', direction: 'down', percentage: 10 },
    ],
    recommendations: [
      'Consider optimizing marketing spend allocation',
      'Review development budget for next quarter',
      'Investigate sales performance decline',
    ],
  },
};

export const mockSearchResults = [
  {
    id: '1',
    title: 'Project Proposal.md',
    path: '/documents/project-proposal.md',
    type: 'document',
    excerpt: '...innovative solution that will revolutionize the way we...',
    lastModified: '2024-01-15T10:30:00Z',
    size: 2048,
  },
  {
    id: '2',
    title: 'budget-2024.xlsx',
    path: '/spreadsheets/budget-2024.xlsx',
    type: 'spreadsheet',
    excerpt: '...quarterly projections and expense allocations...',
    lastModified: '2024-01-12T14:20:00Z',
    size: 15360,
  },
  {
    id: '3',
    title: 'App.tsx',
    path: '/projects/my-app/src/App.tsx',
    type: 'code',
    excerpt: '...main application component with routing setup...',
    lastModified: '2024-01-16T10:30:00Z',
    size: 1024,
  },
];

export const mockFileSystem = {
  folders: [
    {
      id: '1',
      name: 'Documents',
      path: '/documents',
      children: ['2', '3'],
      type: 'folder',
    },
    {
      id: '2',
      name: 'Reports',
      path: '/documents/reports',
      children: ['4'],
      type: 'folder',
      parent: '1',
    },
    {
      id: '3',
      name: 'Letters',
      path: '/documents/letters',
      children: ['5'],
      type: 'folder',
      parent: '1',
    },
  ],
  files: [
    {
      id: '4',
      name: 'Q4-Report.md',
      path: '/documents/reports/Q4-Report.md',
      type: 'file',
      parent: '2',
      size: 3072,
      lastModified: '2024-01-15T10:30:00Z',
    },
    {
      id: '5',
      name: 'cover-letter.md',
      path: '/documents/letters/cover-letter.md',
      type: 'file',
      parent: '3',
      size: 1536,
      lastModified: '2024-01-10T08:15:00Z',
    },
  ],
};