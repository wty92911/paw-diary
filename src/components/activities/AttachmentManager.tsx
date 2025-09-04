import { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ActivityAttachment } from '../../lib/types';
import {
  Upload,
  X,
  Image,
  FileText,
  Play,
  Trash2,
  Eye,
  Paperclip,
  AlertCircle,
} from 'lucide-react';

interface AttachmentManagerProps {
  attachments: ActivityAttachment[];
  onAttachmentsChange: (attachments: File[]) => void;
  onAttachmentDelete?: (attachmentId: number) => void;
  onAttachmentView?: (attachment: ActivityAttachment) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  isDisabled?: boolean;
  className?: string;
}

interface FileWithPreview {
  file: File;
  id: string;
  preview: string | null;
  type: 'photo' | 'document' | 'video';
  error?: string;
}

// File type detection
const getFileType = (file: File): 'photo' | 'document' | 'video' => {
  if (file.type.startsWith('image/')) return 'photo';
  if (file.type.startsWith('video/')) return 'video';
  return 'document';
};

// File type icons
const FILE_TYPE_ICONS = {
  photo: Image,
  document: FileText,
  video: Play,
} as const;

// Default allowed file types
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate file
const validateFile = (file: File, allowedTypes: string[], maxSize: number) => {
  const errors: string[] = [];

  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not supported');
  }

  if (file.size > maxSize) {
    errors.push(`File too large (max ${formatFileSize(maxSize)})`);
  }

  return errors;
};

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  attachments,
  onAttachmentsChange,
  onAttachmentDelete,
  onAttachmentView,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  isDisabled = false,
  className = '',
}) => {
  const [newFiles, setNewFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process files and create previews
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const processed: FileWithPreview[] = [];

      fileArray.forEach(file => {
        const id = `${Date.now()}-${Math.random()}`;
        const type = getFileType(file);
        const errors = validateFile(file, allowedTypes, maxFileSize);

        const fileWithPreview: FileWithPreview = {
          file,
          id,
          type,
          preview: null,
          error: errors.length > 0 ? errors.join(', ') : undefined,
        };

        // Create preview for images
        if (type === 'photo' && !fileWithPreview.error) {
          const reader = new FileReader();
          reader.onload = e => {
            setNewFiles(prev =>
              prev.map(f => (f.id === id ? { ...f, preview: e.target?.result as string } : f)),
            );
          };
          reader.readAsDataURL(file);
        }

        processed.push(fileWithPreview);
      });

      return processed;
    },
    [allowedTypes, maxFileSize],
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const totalFiles = attachments.length + newFiles.length + files.length;
      if (totalFiles > maxFiles) {
        alert(
          `Maximum ${maxFiles} files allowed. You can add ${maxFiles - attachments.length - newFiles.length} more files.`,
        );
        return;
      }

      const processed = processFiles(files);
      setNewFiles(prev => [...prev, ...processed]);

      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [attachments.length, newFiles.length, maxFiles, processFiles],
  );

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      const totalFiles = attachments.length + newFiles.length + files.length;
      if (totalFiles > maxFiles) {
        alert(
          `Maximum ${maxFiles} files allowed. You can add ${maxFiles - attachments.length - newFiles.length} more files.`,
        );
        return;
      }

      const processed = processFiles(files);
      setNewFiles(prev => [...prev, ...processed]);
    },
    [attachments.length, newFiles.length, maxFiles, processFiles],
  );

  // Remove new file
  const removeNewFile = useCallback((id: string) => {
    setNewFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Handle save (upload files)
  const handleSave = useCallback(() => {
    const validFiles = newFiles.filter(f => !f.error).map(f => f.file);
    if (validFiles.length === 0) return;

    setIsUploading(true);
    onAttachmentsChange(validFiles);

    // Clear new files after upload
    setNewFiles([]);
    setIsUploading(false);
  }, [newFiles, onAttachmentsChange]);

  // Total files count
  const totalFilesCount = attachments.length + newFiles.length;
  const canAddMore = totalFilesCount < maxFiles && !isDisabled;
  const hasChanges = newFiles.length > 0;
  const validNewFiles = newFiles.filter(f => !f.error);

  // Group files by type for display
  const filesByType = useMemo(() => {
    const existingByType: Record<'photo' | 'document' | 'video', ActivityAttachment[]> = {
      photo: [],
      document: [],
      video: [],
    };

    attachments.forEach(attachment => {
      existingByType[attachment.file_type].push(attachment);
    });

    const newByType: Record<'photo' | 'document' | 'video', FileWithPreview[]> = {
      photo: [],
      document: [],
      video: [],
    };

    newFiles.forEach(file => {
      newByType[file.type].push(file);
    });

    return { existing: existingByType, new: newByType };
  }, [attachments, newFiles]);

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-base">Attachments</CardTitle>
            <Badge variant="secondary">
              {totalFilesCount}/{maxFiles}
            </Badge>
          </div>

          {hasChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUploading || validNewFiles.length === 0}
            >
              {isUploading ? 'Saving...' : `Save ${validNewFiles.length} Files`}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Area */}
        {canAddMore && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !isDisabled && fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Drop files here or click to upload</p>
            <p className="text-xs text-gray-500">
              Images, videos, documents up to {formatFileSize(maxFileSize)}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedTypes.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isDisabled}
            />
          </div>
        )}

        {/* File Type Sections */}
        {(['photo', 'document', 'video'] as const).map(type => {
          const Icon = FILE_TYPE_ICONS[type];
          const existingFiles = filesByType.existing[type];
          const newFiles = filesByType.new[type];
          const allFiles = [...existingFiles, ...newFiles];

          if (allFiles.length === 0) return null;

          return (
            <div key={type} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-gray-600" />
                <h4 className="text-sm font-medium capitalize">
                  {type}s ({allFiles.length})
                </h4>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Existing attachments */}
                {existingFiles.map(attachment => (
                  <div
                    key={attachment.id}
                    className="relative group bg-gray-50 rounded-lg overflow-hidden"
                  >
                    {attachment.file_type === 'photo' && attachment.thumbnail_path ? (
                      <img
                        src={attachment.thumbnail_path}
                        alt="Attachment"
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {onAttachmentView && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onAttachmentView(attachment)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}

                      {onAttachmentDelete && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onAttachmentDelete(attachment.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* File name */}
                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-600 truncate">
                        {attachment.file_path.split('/').pop() || 'Attachment'}
                      </p>
                      {attachment.file_size && (
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.file_size)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* New files */}
                {newFiles.map(fileWithPreview => (
                  <div
                    key={fileWithPreview.id}
                    className={`relative group rounded-lg overflow-hidden border-2 ${
                      fileWithPreview.error
                        ? 'border-red-300 bg-red-50'
                        : 'border-blue-300 bg-blue-50'
                    }`}
                  >
                    {fileWithPreview.preview ? (
                      <img
                        src={fileWithPreview.preview}
                        alt="Preview"
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => removeNewFile(fileWithPreview.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>

                    {/* File info */}
                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-600 truncate">{fileWithPreview.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileWithPreview.file.size)}
                      </p>
                      {fileWithPreview.error && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <p className="text-xs text-red-600">{fileWithPreview.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {totalFilesCount === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Paperclip className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No attachments yet</p>
            <p className="text-xs">Upload photos, videos, or documents to get started</p>
          </div>
        )}

        {/* File limits info */}
        {totalFilesCount > 0 && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {maxFiles - totalFilesCount} more files can be added
              {totalFilesCount >= maxFiles && ' • Maximum reached'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
