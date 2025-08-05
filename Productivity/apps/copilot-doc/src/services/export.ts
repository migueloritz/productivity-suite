import { invoke } from '@tauri-apps/api/tauri';
import { save } from '@tauri-apps/api/dialog';
import { ExportFormat, ExportResult } from '../types';

export class ExportService {
  async getExportFormats(): Promise<ExportFormat[]> {
    return await invoke('get_export_formats');
  }

  async exportDocument(
    content: string,
    format: string,
    title?: string,
    customPath?: string
  ): Promise<ExportResult> {
    let outputPath = customPath;
    
    if (!outputPath) {
      // Show save dialog
      const selectedPath = await save({
        title: 'Export Document',
        filters: [{
          name: this.getFormatName(format),
          extensions: [format]
        }],
        defaultPath: title ? `${title}.${format}` : `document.${format}`
      });
      
      if (!selectedPath) {
        return { success: false, error: 'Export cancelled' };
      }
      
      outputPath = selectedPath;
    }

    try {
      return await invoke('export_to_format', {
        content,
        format,
        outputPath,
        title
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  async exportToPDF(content: string, title?: string): Promise<ExportResult> {
    return this.exportDocument(content, 'pdf', title);
  }

  async exportToWord(content: string, title?: string): Promise<ExportResult> {
    return this.exportDocument(content, 'docx', title);
  }

  async exportToMarkdown(content: string, title?: string): Promise<ExportResult> {
    return this.exportDocument(content, 'md', title);
  }

  async exportToPlainText(content: string, title?: string): Promise<ExportResult> {
    return this.exportDocument(content, 'txt', title);
  }

  async exportToHTML(content: string, title?: string): Promise<ExportResult> {
    return this.exportDocument(content, 'html', title);
  }

  async exportToRTF(content: string, title?: string): Promise<ExportResult> {
    return this.exportDocument(content, 'rtf', title);
  }

  // Client-side export methods for formats that can be handled in the browser
  async exportToJSONLocal(content: string, title: string): Promise<void> {
    const data = {
      title,
      content,
      exported_at: new Date().toISOString(),
      format: 'copilot-doc-json',
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    this.downloadBlob(blob, `${title}.json`);
  }

  async copyToClipboard(content: string, format: 'html' | 'text' = 'html'): Promise<boolean> {
    try {
      if (format === 'html') {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([content], { type: 'text/html' }),
          'text/plain': new Blob([this.htmlToText(content)], { type: 'text/plain' })
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(this.htmlToText(content));
      }
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private htmlToText(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  private getFormatName(extension: string): string {
    const formatNames: Record<string, string> = {
      'pdf': 'PDF Document',
      'docx': 'Word Document',
      'md': 'Markdown',
      'txt': 'Plain Text',
      'html': 'HTML Document',
      'rtf': 'Rich Text Format',
      'json': 'JSON Document'
    };
    
    return formatNames[extension] || extension.toUpperCase();
  }

  getExportOptions(format: string): Record<string, any> {
    switch (format) {
      case 'pdf':
        return {
          pageSize: 'A4',
          margins: { top: 72, right: 72, bottom: 72, left: 72 },
          includeHeaders: true,
          includeFooters: true
        };
      case 'docx':
        return {
          includeStyles: true,
          preserveFormatting: true,
          embedImages: true
        };
      case 'html':
        return {
          includeCSS: true,
          standalone: true,
          responsive: true
        };
      default:
        return {};
    }
  }

  validateExportOptions(format: string, options: Record<string, any>): { isValid: boolean; error?: string } {
    switch (format) {
      case 'pdf':
        if (options.margins) {
          const { top, right, bottom, left } = options.margins;
          if (top < 0 || right < 0 || bottom < 0 || left < 0) {
            return { isValid: false, error: 'Margins cannot be negative' };
          }
        }
        break;
      case 'docx':
        // Add DOCX-specific validation
        break;
      default:
        break;
    }
    
    return { isValid: true };
  }

  async estimateExportSize(content: string, format: string): Promise<number> {
    // Rough estimates in bytes
    const baseSize = content.length;
    
    switch (format) {
      case 'txt':
        return baseSize * 0.5; // Text compression
      case 'md':
        return baseSize * 0.7; // Markdown is slightly larger than plain text
      case 'html':
        return baseSize * 1.5; // HTML with tags
      case 'pdf':
        return baseSize * 3; // PDF overhead
      case 'docx':
        return baseSize * 2.5; // DOCX compression
      case 'rtf':
        return baseSize * 2; // RTF formatting
      default:
        return baseSize;
    }
  }

  async batchExport(
    documents: Array<{ id: string; title: string; content: string }>,
    format: string,
    outputDir?: string
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    
    for (const doc of documents) {
      const outputPath = outputDir 
        ? `${outputDir}/${doc.title}.${format}`
        : undefined;
        
      const result = await this.exportDocument(
        doc.content,
        format,
        doc.title,
        outputPath
      );
      
      results.push(result);
    }
    
    return results;
  }
}