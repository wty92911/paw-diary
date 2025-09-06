import React from 'react';
import { Control, FieldError } from 'react-hook-form';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { LoadingSpinner } from '../../ui/loading-spinner';
import { 
  Upload, 
  X, 
  FileImage, 
  FileVideo, 
  File,
  Camera,
  AlertCircle,
  Download,
  Eye
} from 'lucide-react';
import { ActivityFormData, ActivityBlockDef } from '../../../lib/types/activities';
import { Field } from './Field';
import { useFormContext } from './FormContext';

// Attachment value interface
interface AttachmentValue {
  id: string;
  name: string;
  type: string; // MIME type
  size: number; // File size in bytes
  url: string; // File URL or photos:// protocol
  thumbnail?: string; // Thumbnail URL for images/videos
  uploadStatus: 'uploading' | 'completed' | 'error';
  uploadProgress?: number; // 0-100
  error?: string;
}

// Supported file types and limits
const SUPPORTED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  videos: ['video/mp4', 'video/webm', 'video/quicktime'],
  documents: ['application/pdf', 'text/plain'],
} as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 5;

// Attachment block specific props
interface AttachmentBlockProps {
  block: ActivityBlockDef & { type: 'attachment' };
  control?: Control<ActivityFormData>;
  error?: FieldError;
}

// AttachmentBlock component for file upload with drag-and-drop and thumbnails
const AttachmentBlock: React.FC<AttachmentBlockProps> = ({
  block,
  error,
}) => {
  const { watch, setValue } = useFormContext();
  const fieldName = `blocks.${block.id}` as const;
  const currentValue: AttachmentValue[] = watch(fieldName) || [];

  // State management
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Utility functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (SUPPORTED_TYPES.images.includes(mimeType as any)) return FileImage;
    if (SUPPORTED_TYPES.videos.includes(mimeType as any)) return FileVideo;
    return File;
  };

  const isValidFileType = (file: File): boolean => {
    const allSupportedTypes = [
      ...SUPPORTED_TYPES.images,
      ...SUPPORTED_TYPES.videos,
      ...SUPPORTED_TYPES.documents,
    ];
    return allSupportedTypes.includes(file.type as any);
  };

  // Mock upload function - would integrate with PhotoService
  const uploadFile = async (file: File): Promise<AttachmentValue> => {
    return new Promise((resolve, reject) => {
      // Simulate upload progress
      const attachment: AttachmentValue = {
        id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: `photos://${file.name}`, // Would be actual photos:// URL
        uploadStatus: 'uploading',
        uploadProgress: 0,
      };

      // Simulate thumbnail generation for images
      if (SUPPORTED_TYPES.images.includes(file.type as any)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.thumbnail = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }

      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        attachment.uploadProgress = Math.min(progress, 100);
        
        // Update the attachment in the array
        setValue(fieldName, (prev: AttachmentValue[]) =>
          prev.map(att => att.id === attachment.id ? { ...attachment } : att)
        );

        if (progress >= 100) {
          clearInterval(progressInterval);
          attachment.uploadStatus = 'completed';
          attachment.uploadProgress = 100;
          resolve(attachment);
        }
      }, 200);

      // Simulate potential errors
      if (Math.random() < 0.1) { // 10% chance of error
        setTimeout(() => {
          clearInterval(progressInterval);
          attachment.uploadStatus = 'error';
          attachment.error = 'Upload failed. Please try again.';
          reject(new Error('Upload failed'));
        }, 1000);
      }
    });
  };

  // Handle file selection
  const handleFileSelect = React.useCallback(async (files: FileList) => {
    if (currentValue.length + files.length > MAX_ATTACHMENTS) {
      console.warn(`Cannot add more than ${MAX_ATTACHMENTS} attachments`);
      return;
    }

    setIsUploading(true);
    const newAttachments: AttachmentValue[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!isValidFileType(file)) {
        console.warn(`Unsupported file type: ${file.type}`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File too large: ${file.name} (${formatFileSize(file.size)})`);
        continue;
      }

      try {
        const attachment = await uploadFile(file);
        newAttachments.push(attachment);
      } catch (error) {
        console.error('Failed to upload file:', file.name, error);
      }
    }

    // Add new attachments to the current list
    setValue(fieldName, [...currentValue, ...newAttachments]);
    setIsUploading(false);
  }, [currentValue, fieldName, setValue]);

  // Handle file removal
  const handleRemoveAttachment = React.useCallback((attachmentId: string) => {
    setValue(fieldName, currentValue.filter(att => att.id !== attachmentId));
  }, [currentValue, fieldName, setValue]);

  // Handle retry upload
  const handleRetryUpload = React.useCallback(async (attachmentId: string) => {
    const attachment = currentValue.find(att => att.id === attachmentId);
    if (!attachment) return;

    // Reset status and try again
    const updatedAttachment = {
      ...attachment,
      uploadStatus: 'uploading' as const,
      uploadProgress: 0,
      error: undefined,
    };

    setValue(fieldName, currentValue.map(att => 
      att.id === attachmentId ? updatedAttachment : att
    ));

    // Would retry actual upload here
  }, [currentValue, fieldName, setValue]);

  // Drag and drop handlers
  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // File input click handler
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Camera capture handler (would integrate with device camera)
  const handleCameraCapture = () => {
    // Would open camera interface
    console.log('Camera capture not yet implemented');
  };

  return (
    <Field
      label={block.label}
      required={block.required}
      error={error?.message}
      hint={block.config?.hint || `Upload photos, videos, or documents. Max ${MAX_ATTACHMENTS} files, ${formatFileSize(MAX_FILE_SIZE)} each.`}
      blockType="attachment"
      id={`attachment-${block.id}`}
    >
      <div className="space-y-4">
        {/* Upload area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 transition-all ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>

            <div>
              <p className="text-sm font-medium">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports images, videos, and documents
              </p>
            </div>

            <div className="flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                disabled={isUploading || currentValue.length >= MAX_ATTACHMENTS}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCameraCapture}
                disabled={isUploading || currentValue.length >= MAX_ATTACHMENTS}
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
            </div>

            {isUploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoadingSpinner className="w-4 h-4" />
                Uploading files...
              </div>
            )}
          </div>
        </div>

        {/* File input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={[
            ...SUPPORTED_TYPES.images,
            ...SUPPORTED_TYPES.videos,
            ...SUPPORTED_TYPES.documents,
          ].join(',')}
          onChange={(e) => {
            if (e.target.files) {
              handleFileSelect(e.target.files);
            }
          }}
          className="hidden"
        />

        {/* Attachment list */}
        {currentValue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Attachments ({currentValue.length})
              </h4>
              <Badge variant="outline" className="text-xs">
                {currentValue.filter(att => att.uploadStatus === 'completed').length} uploaded
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentValue.map((attachment) => {
                const FileIcon = getFileIcon(attachment.type);
                const isImage = SUPPORTED_TYPES.images.includes(attachment.type as any);
                const isCompleted = attachment.uploadStatus === 'completed';
                const hasError = attachment.uploadStatus === 'error';

                return (
                  <div
                    key={attachment.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg ${
                      hasError ? 'border-destructive/50 bg-destructive/5' : 'border-border'
                    }`}
                  >
                    {/* Thumbnail or icon */}
                    <div className="flex-shrink-0">
                      {isImage && attachment.thumbnail ? (
                        <img
                          src={attachment.thumbnail}
                          alt={attachment.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <FileIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {attachment.name}
                        </p>
                        <Badge 
                          variant={isCompleted ? 'default' : hasError ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {attachment.uploadStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)}
                      </p>

                      {/* Upload progress */}
                      {attachment.uploadStatus === 'uploading' && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1">
                              <div
                                className="bg-primary h-1 rounded-full transition-all"
                                style={{ width: `${attachment.uploadProgress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {attachment.uploadProgress || 0}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Error message */}
                      {hasError && attachment.error && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {attachment.error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {isCompleted && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label="Preview attachment"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label="Download attachment"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {hasError && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryUpload(attachment.id)}
                          className="text-xs"
                        >
                          Retry
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        aria-label="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Limits display */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>
            Attachments: {currentValue.length} / {MAX_ATTACHMENTS}
          </div>
          <div>
            Supported: JPEG, PNG, WebP, GIF, MP4, WebM, PDF, TXT
          </div>
          <div>
            Max file size: {formatFileSize(MAX_FILE_SIZE)}
          </div>
        </div>
      </div>
    </Field>
  );
};

export default AttachmentBlock;