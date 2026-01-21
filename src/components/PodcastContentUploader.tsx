import React, { useState, useRef } from 'react';
import { PodcastContentSource, MAX_PLAIN_TEXT_LENGTH, MAX_CONTENT_FILE_SIZE } from '../types/podcast';

interface PodcastContentUploaderProps {
  onContentChange: (source: PodcastContentSource | null) => void;
  disabled?: boolean;
}

type InputTab = 'text' | 'url' | 'file';

export function PodcastContentUploader({ onContentChange, disabled = false }: PodcastContentUploaderProps) {
  const [activeTab, setActiveTab] = useState<InputTab>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetContent = (source: PodcastContentSource | null) => {
    setError(null);

    if (!source) {
      onContentChange(null);
      return;
    }

    // Validate based on source type
    if (source.type === 'text' && source.text) {
      if (source.text.length > MAX_PLAIN_TEXT_LENGTH) {
        setError(`Text is too long. Maximum ${(MAX_PLAIN_TEXT_LENGTH / 1024 / 1024).toFixed(0)}MB allowed.`);
        return;
      }
    }

    if (source.type === 'file' && source.file) {
      if (source.file.size > MAX_CONTENT_FILE_SIZE) {
        setError(`File is too large. Maximum ${(MAX_CONTENT_FILE_SIZE / 1024 / 1024).toFixed(0)}MB allowed.`);
        return;
      }

      const fileName = source.file.name.toLowerCase();
      if (!fileName.endsWith('.pdf') && !fileName.endsWith('.txt')) {
        setError('Only PDF and TXT files are supported.');
        return;
      }
    }

    if (source.type === 'url' && source.url) {
      try {
        new URL(source.url);
      } catch {
        setError('Please enter a valid URL.');
        return;
      }
    }

    onContentChange(source);
  };

  const handleTextChange = (text: string) => {
    setTextInput(text);
    if (text.trim()) {
      validateAndSetContent({ type: 'text', text: text.trim() });
    } else {
      validateAndSetContent(null);
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    if (url.trim()) {
      validateAndSetContent({ type: 'url', url: url.trim() });
    } else {
      validateAndSetContent(null);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    validateAndSetContent({ type: 'file', file, fileName: file.name });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    validateAndSetContent(null);
  };

  const handleTabChange = (tab: InputTab) => {
    setActiveTab(tab);
    setError(null);

    // Clear content when switching tabs
    onContentChange(null);
  };

  const getContentPreview = () => {
    if (activeTab === 'text' && textInput) {
      const preview = textInput.substring(0, 200);
      return preview + (textInput.length > 200 ? '...' : '');
    }
    if (activeTab === 'url' && urlInput) {
      return urlInput;
    }
    if (activeTab === 'file' && selectedFile) {
      return `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`;
    }
    return null;
  };

  const preview = getContentPreview();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Content Source</label>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => handleTabChange('text')}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'text'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Text Input
        </button>
        <button
          onClick={() => handleTabChange('url')}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'url'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          URL
        </button>
        <button
          onClick={() => handleTabChange('file')}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'file'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          File Upload
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-3">
        {/* Text Input Tab */}
        {activeTab === 'text' && (
          <div>
            <textarea
              value={textInput}
              onChange={(e) => handleTextChange(e.target.value)}
              disabled={disabled}
              placeholder="Paste your text content here (up to 1MB)..."
              className="w-full h-48 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            />
            <div className="mt-1 text-xs text-gray-500">
              {textInput.length.toLocaleString()} / {MAX_PLAIN_TEXT_LENGTH.toLocaleString()} characters
            </div>
          </div>
        )}

        {/* URL Input Tab */}
        {activeTab === 'url' && (
          <div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={disabled}
              placeholder="https://example.com/document.pdf"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <div className="mt-2 text-xs text-gray-500">
              Enter a public URL to a PDF or HTML document
            </div>
          </div>
        )}

        {/* File Upload Tab */}
        {activeTab === 'file' && (
          <div>
            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs text-gray-500">PDF or TXT files up to 50MB</p>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{selectedFile.name}</div>
                      <div className="text-xs text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileInputChange}
              disabled={disabled}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Content Preview */}
      {preview && !error && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-xs text-blue-600 font-medium mb-1">Selected Content:</div>
          <div className="text-sm text-blue-800 break-all">{preview}</div>
        </div>
      )}
    </div>
  );
}
