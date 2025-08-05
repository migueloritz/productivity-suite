import React, { useState, useRef, useEffect } from 'react';
import { Check, X, AlertCircle, Calculator } from 'lucide-react';
import { FormulaBarProps } from '@/types';

export function FormulaBar({
  value,
  cellRef,
  onChange,
  onSubmit,
  onCancel,
  onEdit,
  isEditing = false,
  isValid = true,
  errorMessage
}: FormulaBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        onSubmit();
        e.preventDefault();
        break;
      case 'Escape':
        onCancel();
        e.preventDefault();
        break;
      case 'Tab':
        onSubmit();
        e.preventDefault();
        break;
    }
  };

  const handleCellRefClick = () => {
    if (cellRef && !isEditing) {
      onEdit(cellRef);
    }
  };

  const displayValue = value || '';
  const showError = !isValid && errorMessage;

  return (
    <div className="formula-bar">
      {/* Cell Reference */}
      <div 
        className={`
          formula-bar-cell-ref cursor-pointer
          ${cellRef ? 'hover:bg-gray-100' : 'opacity-50'}
        `}
        onClick={handleCellRefClick}
        title={cellRef ? `Click to edit ${cellRef}` : 'No cell selected'}
      >
        {cellRef || '—'}
      </div>

      {/* Function Button */}
      <button
        className="flex items-center justify-center w-8 h-8 border border-gray-300 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => {
          // Open function wizard or insert function
          if (cellRef) {
            onChange(value + 'SUM()');
            inputRef.current?.focus();
          }
        }}
        title="Insert Function"
        disabled={!cellRef}
      >
        <Calculator className="w-4 h-4 text-gray-600" />
      </button>

      {/* Formula Input */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            formula-bar-input w-full
            ${!isValid ? 'error' : ''}
            ${isEditing ? 'ring-2 ring-blue-500' : ''}
          `}
          placeholder={cellRef ? "Enter a value or formula (start with =)" : "Select a cell to edit"}
          disabled={!cellRef}
        />

        {/* Error Indicator */}
        {showError && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="w-4 h-4 text-red-500" title={errorMessage} />
          </div>
        )}
      </div>

      {/* Action Buttons (shown when editing) */}
      {isEditing && (
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onSubmit}
            className={`
              flex items-center justify-center w-8 h-8 rounded
              ${isValid 
                ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
              transition-colors
            `}
            title={isValid ? "Confirm (Enter)" : "Fix errors before confirming"}
            disabled={!isValid}
          >
            <Check className="w-4 h-4" />
          </button>
          
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-8 h-8 rounded bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
            title="Cancel (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formula Info */}
      {value.startsWith('=') && !isEditing && (
        <div className="flex items-center ml-2 text-xs text-gray-500">
          <Calculator className="w-3 h-3 mr-1" />
          Formula
        </div>
      )}

      {/* Error Message Tooltip */}
      {showError && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 p-2 bg-red-50 border border-red-200 rounded shadow-lg text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Formula Error</div>
              <div className="text-red-600">{errorMessage}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}