import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BarChart3, 
  LineChart, 
  PieChart, 
  ScatterChart,
  TrendingUp,
  Settings,
  Palette,
  Type,
  Loader2,
  Download,
  Eye
} from 'lucide-react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import { ChartBuilderProps, ChartData } from '@/types';
import { SpreadsheetService } from '@/services/spreadsheet';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartTypeOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface ChartConfigPanelProps {
  chartData: ChartData | null;
  onUpdate: (data: Partial<ChartData>) => void;
}

function ChartConfigPanel({ chartData, onUpdate }: ChartConfigPanelProps) {
  if (!chartData) return null;

  const colorPresets = [
    ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
    ['#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'],
    ['#64748B', '#DC2626', '#059669', '#D97706', '#7C3AED'],
    ['#0891B2', '#BE185D', '#65A30D', '#EA580C', '#5B21B6']
  ];

  const updateColors = (colors: string[]) => {
    if (chartData.datasets.length > 0) {
      const updatedDatasets = chartData.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length]
      }));
      onUpdate({ datasets: updatedDatasets });
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chart Title
        </label>
        <input
          type="text"
          value={chartData.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter chart title"
        />
      </div>

      {/* Color Schemes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color Scheme
        </label>
        <div className="grid grid-cols-2 gap-2">
          {colorPresets.map((preset, index) => (
            <button
              key={index}
              onClick={() => updateColors(preset)}
              className="flex items-center space-x-1 p-2 border border-gray-200 rounded hover:border-gray-300 transition-colors"
            >
              {preset.slice(0, 5).map((color, colorIndex) => (
                <div
                  key={colorIndex}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
              ))}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Labels */}
      {chartData.datasets.map((dataset, index) => (
        <div key={index}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dataset {index + 1} Label
          </label>
          <input
            type="text"
            value={dataset.label}
            onChange={(e) => {
              const updatedDatasets = [...chartData.datasets];
              updatedDatasets[index] = { ...dataset, label: e.target.value };
              onUpdate({ datasets: updatedDatasets });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Dataset ${index + 1} label`}
          />
        </div>
      ))}
    </div>
  );
}

export function ChartBuilder({
  isOpen,
  onClose,
  selectedRange,
  spreadsheet,
  onChartCreate
}: ChartBuilderProps) {
  const [selectedChartType, setSelectedChartType] = useState<string>('bar');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'type' | 'config' | 'preview'>('type');

  const service = useMemo(() => SpreadsheetService.getInstance(), []);

  const chartTypes: ChartTypeOption[] = [
    {
      id: 'bar',
      label: 'Bar Chart',
      icon: <BarChart3 className="w-6 h-6" />,
      description: 'Compare values across categories'
    },
    {
      id: 'line',
      label: 'Line Chart',
      icon: <LineChart className="w-6 h-6" />,
      description: 'Show trends over time'
    },
    {
      id: 'pie',
      label: 'Pie Chart',
      icon: <PieChart className="w-6 h-6" />,
      description: 'Show parts of a whole'
    },
    {
      id: 'scatter',
      label: 'Scatter Plot',
      icon: <ScatterChart className="w-6 h-6" />,
      description: 'Show correlation between variables'
    }
  ];

  // Generate chart data when chart type or range changes
  useEffect(() => {
    if (!isOpen || !selectedRange || !spreadsheet) return;

    generateChartData();
  }, [isOpen, selectedChartType, selectedRange]);

  const generateChartData = async () => {
    if (!selectedRange || !spreadsheet) return;

    setIsLoading(true);
    setError(null);

    try {
      // Convert selected range to string format
      const rangeString = 'A1:C10'; // Simplified for demo
      
      // Get cell values from active sheet
      const activeSheet = spreadsheet.sheets.find(s => s.id === spreadsheet.activeSheet);
      if (!activeSheet) {
        throw new Error('No active sheet found');
      }

      const cellValues: Record<string, string> = {};
      // Extract cell values from the range (simplified)
      for (const [cellRef, cell] of Object.entries(activeSheet.cells)) {
        cellValues[cellRef] = cell.value;
      }

      // Generate chart data using the service
      const data = await service.generateChartData(
        cellValues,
        selectedChartType,
        rangeString
      );

      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate chart data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    if (!chartData) return null;

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: chartData.title,
        },
      },
    };

    switch (chartData.chartType) {
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      case 'scatter':
        // Convert data for scatter plot
        const scatterData = {
          ...chartData,
          datasets: chartData.datasets.map(dataset => ({
            ...dataset,
            data: dataset.data.map((value, index) => ({
              x: index,
              y: value
            }))
          }))
        };
        return <Scatter data={scatterData} options={options} />;
      default:
        return null;
    }
  };

  const handleCreateChart = () => {
    if (chartData) {
      onChartCreate(chartData);
    }
  };

  const handleExportChart = () => {
    if (chartData) {
      // Export chart as image (would require additional implementation)
      console.log('Exporting chart:', chartData);
    }
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
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Chart Builder</h2>
                <p className="text-sm text-gray-600">
                  Create beautiful charts from your data
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

          {/* Navigation */}
          <div className="flex border-b">
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'type'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('type')}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Chart Type
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('config')}
              disabled={!chartData}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configuration
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('preview')}
              disabled={!chartData}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Preview
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel */}
            <div className="w-80 border-r bg-gray-50 overflow-y-auto">
              <div className="p-6">
                {activeTab === 'type' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Select Chart Type</h3>
                    
                    {chartTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedChartType(type.id)}
                        className={`w-full p-4 border rounded-lg transition-colors text-left ${
                          selectedChartType === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`${
                            selectedChartType === type.id ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {type.icon}
                          </div>
                          <span className={`font-medium ${
                            selectedChartType === type.id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {type.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'config' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart Configuration</h3>
                    <ChartConfigPanel
                      chartData={chartData}
                      onUpdate={(updates) => {
                        if (chartData) {
                          setChartData({ ...chartData, ...updates });
                        }
                      }}
                    />
                  </div>
                )}

                {activeTab === 'preview' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart Actions</h3>
                    
                    <div className="space-y-3">
                      <button
                        onClick={handleCreateChart}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Insert Chart
                      </button>
                      
                      <button
                        onClick={handleExportChart}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Chart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Chart Preview */}
            <div className="flex-1 p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <X className="w-4 h-4" />
                    <span className="font-medium">Chart Generation Error</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Generating chart...</p>
                  </div>
                </div>
              )}

              {!isLoading && !error && chartData && (
                <div className="h-full">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Chart Preview</h3>
                    <p className="text-sm text-gray-600">
                      {chartTypes.find(t => t.id === selectedChartType)?.label} - {chartData.title}
                    </p>
                  </div>
                  
                  <div className="h-96 bg-white border border-gray-200 rounded-lg p-4">
                    {renderChart()}
                  </div>
                </div>
              )}

              {!isLoading && !error && !chartData && !selectedRange && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Select Data Range</h3>
                    <p>Choose a range of cells in your spreadsheet to create a chart.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}