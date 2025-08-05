import { invoke } from '@tauri-apps/api/tauri';
import { FileItem, FolderAnalytics, FileTypeDistribution, ActivityTimeline } from '@/types';

export class AnalysisService {
  private static instance: AnalysisService;

  static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  async analyzeFolderStructure(path: string): Promise<FolderAnalytics> {
    return await invoke('get_folder_analytics', { path });
  }

  async getFileTypeDistribution(path: string): Promise<FileTypeDistribution> {
    return await invoke('get_file_type_distribution', { path });
  }

  async getActivityTimeline(path: string, days = 30): Promise<ActivityTimeline> {
    return await invoke('get_activity_timeline', { path, days });
  }

  analyzeFilePatterns(files: FileItem[]): {
    commonExtensions: string[];
    sizeTrends: { small: number; medium: number; large: number };
    modificationPattern: 'recent' | 'old' | 'mixed';
  } {
    const extensions = files.map(f => f.fileType.toLowerCase());
    const extensionCounts = extensions.reduce((acc, ext) => {
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonExtensions = Object.entries(extensionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ext]) => ext);

    const sizes = files.map(f => f.size);
    const sizeTrends = {
      small: sizes.filter(s => s < 1024 * 1024).length, // < 1MB
      medium: sizes.filter(s => s >= 1024 * 1024 && s < 10 * 1024 * 1024).length, // 1-10MB
      large: sizes.filter(s => s >= 10 * 1024 * 1024).length, // > 10MB
    };

    const now = new Date();
    const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
    const recentFiles = files.filter(f => f.modifiedAt > recentThreshold).length;
    const totalFiles = files.length;

    let modificationPattern: 'recent' | 'old' | 'mixed';
    if (recentFiles / totalFiles > 0.7) {
      modificationPattern = 'recent';
    } else if (recentFiles / totalFiles < 0.3) {
      modificationPattern = 'old';
    } else {
      modificationPattern = 'mixed';
    }

    return {
      commonExtensions,
      sizeTrends,
      modificationPattern,
    };
  }

  generateInsights(analytics: FolderAnalytics, patterns: ReturnType<typeof this.analyzeFilePatterns>): string[] {
    const insights: string[] = [];

    if (analytics.totalFiles > 1000) {
      insights.push('This is a large directory with many files. Consider organizing into subdirectories.');
    }

    if (patterns.sizeTrends.large > patterns.sizeTrends.small) {
      insights.push('Most files are large. Consider archiving or compressing old files.');
    }

    if (patterns.modificationPattern === 'old') {
      insights.push('Most files haven\'t been modified recently. Consider archiving inactive files.');
    }

    const topExtension = patterns.commonExtensions[0];
    if (topExtension) {
      insights.push(`Most files are ${topExtension} files. Consider specialized tools for this file type.`);
    }

    return insights;
  }
}

export const analysisService = AnalysisService.getInstance();