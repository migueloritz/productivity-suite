import React, { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, TrendingUp, HardDrive, Clock, FileType } from 'lucide-react';
import { AnalyticsPanelProps, FolderAnalytics, FileTypeDistribution, ActivityTimeline } from '@/types';
import { useFileSystem } from '@/hooks/useFileSystem';
import { analysisService } from '@/services/analysis';

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  path,
  analytics: initialAnalytics,
  onRefresh,
  className = '',
}) => {
  const [analytics, setAnalytics] = useState<FolderAnalytics | null>(initialAnalytics || null);
  const [fileTypes, setFileTypes] = useState<FileTypeDistribution>({});
  const [timeline, setTimeline] = useState<ActivityTimeline | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { currentPath } = useFileSystem();
  const targetPath = path || currentPath;

  useEffect(() => {
    if (targetPath) {
      loadAnalytics();
    }
  }, [targetPath]);

  const loadAnalytics = async () => {
    if (!targetPath) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [analyticsData, fileTypesData, timelineData] = await Promise.all([
        analysisService.analyzeFolderStructure(targetPath),
        analysisService.getFileTypeDistribution(targetPath),
        analysisService.getActivityTimeline(targetPath, 30),
      ]);
      
      setAnalytics(analyticsData);
      setFileTypes(fileTypesData);
      setTimeline(timelineData);
      
      onRefresh?.();
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Analytics loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTopFileTypes = () => {
    return Object.entries(fileTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  };

  const getTotalFiles = () => {
    return Object.values(fileTypes).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
          </div>
          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {targetPath && (
          <p className="text-sm text-gray-600 mt-1 truncate">{targetPath}</p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-50">
            {error}
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Overview Stats */}
            {analytics && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <HardDrive className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-blue-700">Total Size</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {formatBytes(analytics.totalSize)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <FileType className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-green-700">Total Files</p>
                      <p className="text-lg font-semibold text-green-900">
                        {analytics.totalFiles.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* File Type Distribution */}
            {Object.keys(fileTypes).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <FileType className="w-4 h-4 mr-1" />
                  File Type Distribution
                </h3>
                <div className="space-y-2">
                  {getTopFileTypes().map(([type, count]) => {
                    const percentage = (count / getTotalFiles()) * 100;
                    return (
                      <div key={type} className="flex items-center">
                        <div className="w-12 text-xs text-gray-600 uppercase">
                          {type || 'none'}
                        </div>
                        <div className="flex-1 mx-3">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 w-16 text-right">
                          {count} ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            {timeline && Object.keys(timeline.timeline).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Recent Activity (Last {timeline.periodDays} days)
                </h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {Object.entries(timeline.timeline)
                      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                      .slice(-14) // Show last 14 days
                      .map(([date, count]) => {
                        const maxCount = Math.max(...Object.values(timeline.timeline));
                        const intensity = count / maxCount;
                        return (
                          <div
                            key={date}
                            className="aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.8})`,
                              color: intensity > 0.5 ? 'white' : '#374151',
                            }}
                            title={`${date}: ${count} files modified`}
                          >
                            {count}
                          </div>
                        );
                      })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Total modifications: {Object.values(timeline.timeline).reduce((sum, count) => sum + count, 0)}
                  </p>
                </div>
              </div>
            )}

            {/* Largest Files */}
            {analytics?.largestFiles && analytics.largestFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Largest Files
                </h3>
                <div className="space-y-2">
                  {analytics.largestFiles.slice(0, 5).map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.fileType.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatBytes(file.size)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {analytics && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            Last updated: {new Date(analytics.analyzedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};