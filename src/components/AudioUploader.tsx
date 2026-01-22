import React, { useRef, useState, useCallback, useEffect } from 'react';

interface AudioUploaderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

const ACCEPTED_FORMATS = [
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/flac',
  'audio/x-flac',
  'audio/webm',
  'video/mp4',
  'video/webm',
  'video/x-m4v',
  'video/quicktime',
  'video/x-msvideo',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export function AudioUploader({ file, onFileChange, disabled }: AudioUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);

  // Create blob URL when file changes
  useEffect(() => {
    if (file) {
      // Clean up previous URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = URL.createObjectURL(file);
    } else {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [file]);

  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (!blobUrlRef.current || !file) return;

    if (!audioRef.current) {
      // Use Audio for both audio and video files (just play the audio track)
      audioRef.current = new Audio(blobUrlRef.current);
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, file]);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ACCEPTED_FORMATS.includes(file.type) && !file.name.match(/\.(wav|mp3|ogg|flac|webm|mp4|m4v|mov|avi)$/i)) {
      return 'Unsupported file format. Please use WAV, MP3, OGG, FLAC, WebM, MP4, MOV, or AVI.';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than 100 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`;
    }

    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        onFileChange(null);
        return;
      }

      setError('');
      onFileChange(file);
    },
    [validateFile, onFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback(() => {
    onFileChange(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/') || file.name.match(/\.(mp4|m4v|mov|avi|webm)$/i) !== null;
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".wav,.mp3,.ogg,.flac,.webm,.mp4,.m4v,.mov,.avi,audio/*,video/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        }`}
        onClick={disabled ? undefined : handleBrowseClick}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            {isVideoFile(file) ? (
              <svg className="w-8 h-8 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            )}
            <div className="text-left flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
            </div>
            <button
              onClick={handlePlayPause}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
              title={isPlaying ? 'Pause' : 'Play source audio'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
              title="Remove file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div>
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-600 mb-1">
              <span className="font-medium text-blue-600">Click to browse</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500">WAV, MP3, OGG, FLAC, WebM, MP4, MOV, AVI (max 100 MB)</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</div>
      )}
    </div>
  );
}
