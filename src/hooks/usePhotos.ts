import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { type PhotoInfo } from '../lib/types';
import { validateImageFile } from '../lib/utils';

export interface UsePhotosState {
  isUploading: boolean;
  uploadProgress?: number;
  error: string | null;
}

export interface UsePhotosActions {
  uploadPhoto: (file: File) => Promise<string>;
  uploadPhotoFromPath: (filePath: string) => Promise<string>;
  deletePhoto: (filename: string) => Promise<void>;
  getPhotoInfo: (filename: string) => Promise<PhotoInfo>;
}

export function usePhotos(): UsePhotosState & UsePhotosActions {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>();
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Validate the file first
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Convert file to bytes
      const arrayBuffer = await file.arrayBuffer();
      const imageData = Array.from(new Uint8Array(arrayBuffer));

      setUploadProgress(50);

      // Upload to Tauri backend
      const filename = await invoke<string>('upload_pet_photo', {
        filename: file.name,
        photoBytes: imageData,
      });

      setUploadProgress(100);
      return filename;
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload photo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(undefined), 1000);
    }
  };

  const uploadPhotoFromPath = async (filePath: string): Promise<string> => {
    try {
      setIsUploading(true);
      setError(null);

      return await invoke<string>('upload_pet_photo_from_path', {
        filePath: filePath,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload photo from path';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (filename: string): Promise<void> => {
    try {
      setError(null);
      await invoke('delete_pet_photo', {
        photoId: filename,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete photo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getPhotoInfo = async (filename: string): Promise<PhotoInfo> => {
    try {
      setError(null);
      return await invoke<PhotoInfo>('get_pet_photo_info', {
        photoId: filename,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get photo info';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    isUploading,
    uploadProgress,
    error,
    uploadPhoto,
    uploadPhotoFromPath,
    deletePhoto,
    getPhotoInfo,
  };
}
