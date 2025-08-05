import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Star, 
  TrendingUp, 
  Calculator,
  Calendar,
  DollarSign,
  Users,
  FileText,
  BarChart3,
  Clock,
  CheckCircle,
  Target,
  Briefcase
} from 'lucide-react';
import { Template, TemplateCategory } from '@/types';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}

// Mock template data - in a real app, this would come from a service
const templateCategories: TemplateCategory[] = [
  {
    id: 'budget',
    name: 'Budget & Finance',
    description: 'Track expenses, create budgets, and manage finances',
    templates: [
      {
        id: 'personal-budget',
        name: 'Personal Budget Tracker',
        description: 'Track your monthly income and expenses with automatic calculations',
        category: 'budget',
        thumbnail: '/templates/personal-budget.png',
        data: {} as any // Mock data
      },
      {
        id: 'expense-report',
        name: 'Business Expense Report',
        description: 'Professional expense report with receipt tracking',
        category: 'budget',
        thumbnail: '/templates/expense-report.png',
        data: {} as any
      },
      {
        id: 'investment-tracker',
        name: 'Investment Portfolio Tracker',
        description: 'Monitor your investments with real-time calculations',
        category: 'budget',
        thumbnail: '/templates/investment-tracker.png',
        data: {} as any
      }
    ]
  },
  {
    id: 'planning',
    name: 'Planning & Scheduling',
    description: 'Organize tasks, events, and projects',
    templates: [
      {
        id: 'project-planner',
        name: 'Project Planning Template',
        description: 'Plan and track project milestones with Gantt-style layout',
        category: 'planning',
        thumbnail: '/templates/project-planner.png',
        data: {} as any
      },
      {
        id: 'content-calendar',
        name: 'Content Calendar',
        description: 'Plan and schedule content across multiple channels',
        category: 'planning',
        thumbnail: '/templates/content-calendar.png',
        data: {} as any
      },
      {
        id: 'meal-planner',
        name: 'Weekly Meal Planner',
        description: 'Plan meals and generate shopping lists automatically',
        category: 'planning',
        thumbnail: '/templates/meal-planner.png',
        data: {} as any
      }
    ]
  },
  {
    id: 'tracking',
    name: 'Data Tracking',
    description: 'Monitor progress and analyze trends',
    templates: [
      {
        id: 'fitness-tracker',
        name: 'Fitness Progress Tracker',
        description: 'Track workouts, measurements, and fitness goals',
        category: 'tracking',
        thumbnail: '/templates/fitness-tracker.png',
        data: {} as any
      },
      {
        id: 'habit-tracker',
        name: 'Daily Habit Tracker',
        description: 'Build good habits with visual progress tracking',
        category: 'tracking',
        thumbnail: '/templates/habit-tracker.png',
        data: {} as any
      },
      {
        id: 'sales-dashboard',
        name: 'Sales Performance Dashboard',
        description: 'Track sales metrics with dynamic charts and KPIs',
        category: 'tracking',
        thumbnail: '/templates/sales-dashboard.png',
        data: {} as any
      }
    ]
  },
  {
    id: 'business',
    name: 'Business & Professional',
    description: 'Templates for business operations and analysis',
    templates: [
      {
        id: 'invoice-template',
        name: 'Professional Invoice',
        description: 'Create professional invoices with automatic calculations',
        category: 'business',
        thumbnail: '/templates/invoice-template.png',
        data: {} as any
      },
      {
        id: 'employee-timesheet',
        name: 'Employee Timesheet',
        description: 'Track employee hours and calculate payroll',
        category: 'business',
        thumbnail: '/templates/employee-timesheet.png',
        data: {} as any
      },
      {
        id: 'business-plan',
        name: 'Business Plan Financial Model',
        description: 'Comprehensive financial projections for business planning',
        category: 'business',
        thumbnail: '/templates/business-plan.png',
        data: {} as any
      }
    ]
  }
];

const categoryIcons: Record<string, React.ReactNode> = {
  budget: <DollarSign className="w-5 h-5" />,
  planning: <Calendar className="w-5 h-5" />,
  tracking: <TrendingUp className="w-5 h-5" />,
  business: <Briefcase className="w-5 h-5" />
};

interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={onSelect}
    >
      {/* Template Preview */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {!imageError ? (
          <img
            src={template.thumbnail || '/placeholder-template.png'}
            alt={template.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-600">{template.name}</div>
            </div>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <div className="transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium shadow-lg hover:bg-gray-50 transition-colors">
              Use Template
            </button>
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
          {template.name}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {template.description}
        </p>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center text-xs text-gray-500">
            {categoryIcons[template.category]}
            <span className="ml-1 capitalize">{template.category}</span>
          </div>
          
          <div className="flex items-center text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-xs text-gray-600 ml-1">4.5</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface CategoryTabProps {
  category: TemplateCategory;
  isActive: boolean;
  onClick: () => void;
}

function CategoryTab({ category, isActive, onClick }: CategoryTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
        isActive
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {categoryIcons[category.id]}
      <span className="font-medium">{category.name}</span>
      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
        {category.templates.length}
      </span>
    </button>
  );
}

export function TemplateGallery({
  isOpen,
  onClose,
  onSelectTemplate
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter templates based on category and search
  const filteredTemplates = useMemo(() => {
    let templates = templateCategories.flatMap(cat => cat.templates);
    
    if (selectedCategory !== 'all') {
      templates = templates.filter(template => template.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      );
    }
    
    return templates;
  }, [selectedCategory, searchQuery]);

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="dialog-overlay"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="dialog-content w-full max-w-6xl h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Template Gallery</h2>
                <p className="text-sm text-gray-600">
                  Choose from professionally designed spreadsheet templates
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex items-center gap-4 mb-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Results count */}
              <div className="text-sm text-gray-600">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Star className="w-4 h-4" />
                <span className="font-medium">All Templates</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {templateCategories.reduce((total, cat) => total + cat.templates.length, 0)}
                </span>
              </button>

              {templateCategories.map((category) => (
                <CategoryTab
                  key={category.id}
                  category={category}
                  isActive={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                />
              ))}
            </div>
          </div>

          {/* Template Grid */}
          <div className="flex-1 overflow-auto p-6">
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => handleSelectTemplate(template)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No templates found</h3>
                  <p>
                    {searchQuery 
                      ? `No templates match your search "${searchQuery}"`
                      : 'No templates available in this category'
                    }
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Can't find what you're looking for?{' '}
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Request a template
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => {
                    // Create blank spreadsheet
                    onSelectTemplate({
                      id: 'blank',
                      name: 'Blank Spreadsheet',
                      description: 'Start with a blank spreadsheet',
                      category: 'blank',
                      data: {} as any
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Blank
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}