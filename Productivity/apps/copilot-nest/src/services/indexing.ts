import { invoke } from '@tauri-apps/api/tauri';
import { IndexingStatus } from '@/types';

export class IndexingService {
  private static instance: IndexingService;

  static getInstance(): IndexingService {
    if (!IndexingService.instance) {
      IndexingService.instance = new IndexingService();
    }
    return IndexingService.instance;
  }

  async indexDirectory(path: string, recursive = false): Promise<void> {
    return await invoke('index_directory', { path, recursive });
  }

  async indexFile(path: string): Promise<void> {
    return await invoke('index_file', { path });
  }

  async getStatus(): Promise<IndexingStatus> {
    return await invoke('get_indexing_status');
  }

  async rebuildIndex(): Promise<void> {
    return await invoke('rebuild_index');
  }

  async startBackgroundIndexing(directories: string[]): Promise<void> {
    for (const dir of directories) {
      try {
        await this.indexDirectory(dir, true);
      } catch (error) {
        console.warn(`Failed to index directory ${dir}:`, error);
      }
    }
  }
}

export const indexingService = IndexingService.getInstance();