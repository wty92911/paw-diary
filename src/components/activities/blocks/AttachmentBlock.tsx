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

// Supported file types and limits (aligned with PhotoService capabilities)
const SUPPORTED_TYPES = {
  images: [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/bmp',
    'image/tiff',
    'image/tif'
  ],
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

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    const allSupportedTypes = [
      ...SUPPORTED_TYPES.images,
      ...SUPPORTED_TYPES.videos,
      ...SUPPORTED_TYPES.documents,
    ];
    
    if (!allSupportedTypes.includes(file.type as any)) {
      return {
        isValid: false,
        error: `Unsupported file type: ${file.type || 'unknown'}. Supported types: images (JPEG, PNG, WebP, BMP, TIFF), videos (MP4, WebM, MOV), documents (PDF, TXT)`,
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large: ${file.name} (${formatFileSize(file.size)}). Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`,
      };
    }

    // Check file name length and characters
    if (file.name.length > 255) {
      return {
        isValid: false,
        error: `File name too long: ${file.name.length} characters. Maximum: 255 characters`,
      };
    }

    // Security check for filename
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return {
        isValid: false,
        error: `Invalid characters in filename: ${file.name}`,
      };
    }

    return { isValid: true };
  };

  // Real upload function integrated with PhotoService and photos:// protocol
  const uploadFile = async (file: File): Promise<AttachmentValue> => {
    // Create initial attachment with uploading status
    const attachment: AttachmentValue = {
      id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: '', // Will be set after upload
      uploadStatus: 'uploading',
      uploadProgress: 0,
    };

    // Generate thumbnail for images
    if (SUPPORTED_TYPES.images.includes(file.type as any)) {
      try {
        const reader = new FileReader();
        const thumbnailPromise = new Promise<string>((resolve) => {
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
        });
        reader.readAsDataURL(file);
        attachment.thumbnail = await thumbnailPromise;
      } catch (error) {
        console.warn('Failed to generate thumbnail:', error);
      }
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Update progress to show we're starting
      attachment.uploadProgress = 10;
      setValue(fieldName, (prev: AttachmentValue[]) =>
        prev.map(att => att.id === attachment.id ? { ...attachment } : att)
      );

      // Upload file via Tauri command (assuming we have an upload command)
      const { invoke } = await import('@tauri-apps/api/core');
      
      // Convert file to bytes for Tauri
      const arrayBuffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));

      attachment.uploadProgress = 50;
      setValue(fieldName, (prev: AttachmentValue[]) =>
        prev.map(att => att.id === attachment.id ? { ...attachment } : att)
      );

      // Call Tauri command to store the file
      // Note: Currently using photo service for all file types
      // In future, videos and documents might need separate handling
      const result = await invoke('upload_pet_photo', {
        filename: file.name,
        photo_bytes: bytes,
        thumbnail_size: null, // Optional thumbnail size
      });

      attachment.uploadProgress = 90;
      setValue(fieldName, (prev: AttachmentValue[]) =>
        prev.map(att => att.id === attachment.id ? { ...attachment } : att)
      );

      // Set the photos:// URL
      const storedFilename = result as string;
      attachment.url = `photos://localhost/${storedFilename}`;
      attachment.uploadStatus = 'completed';
      attachment.uploadProgress = 100;

      return attachment;
    } catch (error) {
      console.error('File upload failed:', error);
      attachment.uploadStatus = 'error';
      attachment.error = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      throw error;
    }
  };

  // Handle file selection
  const handleFileSelect = React.useCallback(async (files: FileList) => {
    if (currentValue.length + files.length > MAX_ATTACHMENTS) {
      console.warn(`Cannot add more than ${MAX_ATTACHMENTS} attachments`);
      return;
    }

    setIsUploading(true);
    const newAttachments: AttachmentValue[] = [];
    const validationErrors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        console.warn(`File validation failed: ${file.name} - ${validation.error}`);
        validationErrors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        // Start upload and immediately add to list with uploading status
        const uploadPromise = uploadFile(file);
        newAttachments.push(await uploadPromise);
      } catch (error) {
        console.error('Failed to upload file:', file.name, error);
        
        // Create failed attachment entry
        const failedAttachment: AttachmentValue = {
          id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: '',
          uploadStatus: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        };
        newAttachments.push(failedAttachment);
      }
    }

    // Show validation errors to user (in a real app, you'd show these in UI)
    if (validationErrors.length > 0) {
      console.warn('File validation errors:', validationErrors);
      // Could dispatch a toast notification or set an error state here
    }

    // Add new attachments to the current list
    setValue(fieldName, [...currentValue, ...newAttachments]);
    setIsUploading(false);
  }, [currentValue, fieldName, setValue, validateFile]);

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

    // Note: We can't retry with the original File object as it's lost
    // In a real implementation, we'd need to store the file reference
    // For now, just show an error asking user to re-upload
    setTimeout(() => {
      const errorAttachment = {
        ...updatedAttachment,
        uploadStatus: 'error' as const,
        error: 'Please remove and re-upload this file',
      };
      
      setValue(fieldName, currentValue.map(att => 
        att.id === attachmentId ? errorAttachment : att
      ));
    }, 1000);
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
            Supported: JPEG, PNG, WebP, BMP, TIFF, MP4, WebM, MOV, PDF, TXT
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