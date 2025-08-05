import React from 'react';
import { 
  GitBranch, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Zap,
  Monitor,
  Sun,
  Moon,
  Wifi,
  WifiOff
} from 'lucide-react';
import { StatusBarProps } from '@/types';

interface StatusBarComponentProps extends StatusBarProps {
  onThemeToggle: () => void;
}

const StatusBar: React.FC<StatusBarComponentProps> = ({
  activeFile,
  projectInfo,
  diagnostics,
  cursorPosition,
  encoding,
  lineEnding,
  onThemeToggle,
}) => {
  // Count diagnostics by severity
  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
  const infoCount = diagnostics.filter(d => d.severity === 'info').length;

  // Format cursor position
  const formatCursorPosition = () => {
    if (!cursorPosition) return '';
    return `Ln ${cursorPosition.lineNumber}, Col ${cursorPosition.column}`;
  };

  // Get file size
  const getFileSize = () => {
    if (!activeFile) return '';
    const size = new Blob([activeFile.content]).size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get selection info
  const getSelectionInfo = () => {
    // This would be populated from the editor
    return '';
  };

  // Get language mode
  const getLanguageMode = () => {
    return activeFile?.language || '';
  };

  // Check if AI is connected
  const isAIConnected = true; // This would come from AI service

  return (
    <div className="status-bar">
      {/* Left Side */}
      <div className="flex items-center space-x-3">
        {/* Project Info */}
        {projectInfo && (
          <div className="status-item" title={projectInfo.path}>
            <GitBranch size={12} className="mr-1" />
            <span>{projectInfo.name}</span>
          </div>
        )}

        {/* Diagnostics */}
        {(errorCount > 0 || warningCount > 0 || infoCount > 0) && (
          <div className="flex items-center space-x-2">
            {errorCount > 0 && (
              <div className="status-item text-red-500" title={`${errorCount} error(s)`}>
                <AlertCircle size={12} className="mr-1" />
                <span>{errorCount}</span>
              </div>
            )}
            {warningCount > 0 && (
              <div className="status-item text-yellow-500" title={`${warningCount} warning(s)`}>
                <AlertTriangle size={12} className="mr-1" />
                <span>{warningCount}</span>
              </div>
            )}
            {infoCount > 0 && (
              <div className="status-item text-blue-500" title={`${infoCount} info message(s)`}>
                <Info size={12} className="mr-1" />
                <span>{infoCount}</span>
              </div>
            )}
          </div>
        )}

        {/* AI Status */}
        <div 
          className={`status-item ${isAIConnected ? 'text-green-500' : 'text-red-500'}`}
          title={isAIConnected ? 'AI Assistant Connected' : 'AI Assistant Disconnected'}
        >
          {isAIConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="ml-1">AI</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-3">
        {/* Selection Info */}
        {getSelectionInfo() && (
          <div className="status-item" title="Selection">
            <span>{getSelectionInfo()}</span>
          </div>
        )}

        {/* Cursor Position */}
        {cursorPosition && (
          <div className="status-item" title="Cursor position">
            <span>{formatCursorPosition()}</span>
          </div>
        )}

        {/* File Size */}
        {activeFile && (
          <div className="status-item" title="File size">
            <span>{getFileSize()}</span>
          </div>
        )}

        {/* Language Mode */}
        {activeFile && (
          <div 
            className="status-item cursor-pointer"
            title="Language mode"
            onClick={() => {
              // TODO: Open language selector
              console.log('Language selector');
            }}
          >
            <span>{getLanguageMode().toUpperCase()}</span>
          </div>
        )}

        {/* Encoding */}
        {encoding && (
          <div 
            className="status-item cursor-pointer"
            title="File encoding"
            onClick={() => {
              // TODO: Open encoding selector
              console.log('Encoding selector');
            }}
          >
            <span>{encoding}</span>
          </div>
        )}

        {/* Line Ending */}
        {lineEnding && (
          <div 
            className="status-item cursor-pointer"
            title="Line ending"
            onClick={() => {
              // TODO: Open line ending selector
              console.log('Line ending selector');
            }}
          >
            <span>{lineEnding}</span>
          </div>
        )}

        {/* Theme Toggle */}
        <div 
          className="status-item cursor-pointer"
          title="Toggle theme"
          onClick={onThemeToggle}
        >
          <Monitor size={12} />
        </div>

        {/* Performance Monitor */}
        <div 
          className="status-item cursor-pointer"
          title="Performance monitor"
          onClick={() => {
            // TODO: Open performance monitor
            console.log('Performance monitor');
          }}
        >
          <Zap size={12} />
        </div>
      </div>
    </div>
  );
};

export default StatusBar;