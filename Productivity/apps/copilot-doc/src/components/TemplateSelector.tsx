import React, { useState } from 'react';
import { X, FileText, Briefcase, GraduationCap, Mail, Calendar, Zap } from 'lucide-react';
import { DocumentTemplate } from '../types';

interface TemplateSelectorProps {
  onSelect: (title: string, template?: string) => void;
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelect,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customTitle, setCustomTitle] = useState('');

  const categories = [
    { id: 'all', label: 'All Templates', icon: FileText },
    { id: 'business', label: 'Business', icon: Briefcase },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'personal', label: 'Personal', icon: Mail },
    { id: 'planning', label: 'Planning', icon: Calendar },
  ];

  const templates: DocumentTemplate[] = [
    {
      id: 'blank',
      name: 'Blank Document',
      description: 'Start with a clean slate',
      category: 'all',
      content: '',
    },
    {
      id: 'letter',
      name: 'Business Letter',
      description: 'Professional correspondence template',
      category: 'business',
      content: 'letter',
    },
    {
      id: 'report',
      name: 'Business Report',
      description: 'Structured report with sections',
      category: 'business',
      content: 'report',
    },
    {
      id: 'memo',
      name: 'Memorandum',
      description: 'Internal company communication',
      category: 'business',
      content: 'memo',
    },
    {
      id: 'meeting_notes',
      name: 'Meeting Notes',
      description: 'Structured meeting documentation',
      category: 'planning',
      content: 'meeting_notes',
    },
    {
      id: 'essay',
      name: 'Academic Essay',
      description: 'Structured essay format',
      category: 'academic',
      content: 'essay',
    },
    {
      id: 'research_paper',
      name: 'Research Paper',
      description: 'Academic research paper structure',
      category: 'academic',
      content: 'research_paper',
    },
    {
      id: 'cover_letter',
      name: 'Cover Letter',
      description: 'Job application cover letter',
      category: 'personal',
      content: 'cover_letter',
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      description: 'Newsletter template with sections',
      category: 'business',
      content: 'newsletter',
    },
    {
      id: 'project_proposal',
      name: 'Project Proposal',
      description: 'Comprehensive project proposal',
      category: 'business',
      content: 'project_proposal',
    },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const handleTemplateSelect = (template: DocumentTemplate) => {
    const title = customTitle.trim() || `New ${template.name}`;
    onSelect(title, template.content || undefined);
  };

  const handleCreateBlank = () => {
    const title = customTitle.trim() || 'Untitled Document';
    onSelect(title);
  };

  const TemplateCard: React.FC<{ template: DocumentTemplate }> = ({ template }) => {
    const isBlank = template.id === 'blank';
    
    return (
      <button
        onClick={() => isBlank ? handleCreateBlank() : handleTemplateSelect(template)}
        className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70 transition-colors">
            <FileText size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {template.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {template.description}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Create New Document
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose a template to get started quickly
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Categories sidebar */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <category.icon size={16} />
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Templates grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Custom title input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Title (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter a custom title..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Templates grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>

            {/* Quick start section */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Quick Start
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={handleCreateBlank}
                  className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Blank Document
                    </div>
                    <div className="text-xs text-gray-500">
                      Start writing immediately
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    // This would open an AI-powered template generator
                    const title = customTitle.trim() || 'AI Generated Document';
                    onSelect(title, 'ai_generated');
                  }}
                  className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <Zap size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      AI Assistant
                    </div>
                    <div className="text-xs text-gray-500">
                      Let AI help you start
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="text-xs text-gray-500">
            {filteredTemplates.length} templates available
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBlank}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Blank Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};