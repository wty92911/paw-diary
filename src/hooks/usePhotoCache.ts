import { useState, useEffect, useCallback, useRef } from 'react';
import { getDefaultPetPhoto } from '../lib/utils';

interface CachedPhoto {
  url: string;
  isLoading: boolean;
  error: boolean;
  timestamp: number;
}

interface PhotoCache {
  [photoPath: string]: CachedPhoto;
}

interface UsePhotoCacheReturn {
  getPhotoUrl: (photoPath: string | null | undefined) => string;
  preloadPhoto: (photoPath: string) => Promise<void>;
  preloadAllPhotos: (photoPaths: (string | null | undefined)[]) => Promise<void>;
  clearCache: () => void;
  isPhotoLoading: (photoPath: string) => boolean;
  hasPhotoError: (photoPath: string) => boolean;
}

// Global cache instance (shared across all components)
const globalPhotoCache: PhotoCache = {};
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 50; // Maximum number of cached photos

/**
 * Global photo cache hook for managing pet photos across the application
 * Prevents duplicate loading of the same photos and provides instant access to cached images
 */
export function usePhotoCache(): UsePhotoCacheReturn {
  const [, setCacheVersion] = useState(0);
  const loadingPromises = useRef<Map<string, Promise<void>>>(new Map());

  // Clean up expired cache entries
  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    const expiredKeys = Object.keys(globalPhotoCache).filter(
      key => now - globalPhotoCache[key].timestamp > CACHE_EXPIRY_TIME,
    );

    expiredKeys.forEach(key => {
      delete globalPhotoCache[key];
    });
  }, []);

  // Enforce cache size limit
  const enforceCacheSizeLimit = useCallback(() => {
    const entries = Object.entries(globalPhotoCache);
    if (entries.length > MAX_CACHE_SIZE) {
      // Sort by timestamp (oldest first) and remove excess entries
      const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const excessCount = entries.length - MAX_CACHE_SIZE;

      for (let i = 0; i < excessCount; i++) {
        delete globalPhotoCache[sortedEntries[i][0]];
      }
    }
  }, []);

  // Load a single photo into cache
  const loadPhotoIntoCache = useCallback(async (photoPath: string): Promise<void> => {
    // Check if already cached and not expired
    const now = Date.now();
    const cached = globalPhotoCache[photoPath];

    if (cached && now - cached.timestamp < CACHE_EXPIRY_TIME) {
      return; // Already cached and valid
    }

    // Check if already loading
    if (loadingPromises.current.has(photoPath)) {
      return loadingPromises.current.get(photoPath);
    }

    // Mark as loading
    globalPhotoCache[photoPath] = {
      url: getDefaultPetPhoto(),
      isLoading: true,
      error: false,
      timestamp: now,
    };

    // Create loading promise
    const loadingPromise = new Promise<void>(resolve => {
      const photoUrl = `photos://localhost/${photoPath}`;

      // Preload image to validate it loads successfully
      const img = new Image();

      img.onload = () => {
        globalPhotoCache[photoPath] = {
          url: photoUrl,
          isLoading: false,
          error: false,
          timestamp: now,
        };
        setCacheVersion(prev => prev + 1);
        resolve();
      };

      img.onerror = () => {
        console.error('Failed to load pet photo:', photoPath);
        globalPhotoCache[photoPath] = {
          url: getDefaultPetPhoto(),
          isLoading: false,
          error: true,
          timestamp: now,
        };
        setCacheVersion(prev => prev + 1);
        resolve(); // Resolve instead of reject to avoid breaking the flow
      };

      img.src = photoUrl;
    });

    loadingPromises.current.set(photoPath, loadingPromise);

    try {
      await loadingPromise;
    } finally {
      loadingPromises.current.delete(photoPath);
    }
  }, []);

  // Get photo URL (returns cached URL or default)
  const getPhotoUrl = useCallback(
    (photoPath: string | null | undefined): string => {
      if (!photoPath) {
        return getDefaultPetPhoto();
      }

      const cached = globalPhotoCache[photoPath];
      if (cached && !cached.isLoading && !cached.error) {
        return cached.url;
      }

      // If not cached, start loading it
      if (!cached || cached.isLoading) {
        loadPhotoIntoCache(photoPath);
      }

      return getDefaultPetPhoto();
    },
    [loadPhotoIntoCache],
  );

  // Preload a single photo
  const preloadPhoto = useCallback(
    async (photoPath: string): Promise<void> => {
      if (!photoPath) return;
      await loadPhotoIntoCache(photoPath);
    },
    [loadPhotoIntoCache],
  );

  // Preload multiple photos
  const preloadAllPhotos = useCallback(
    async (photoPaths: (string | null | undefined)[]): Promise<void> => {
      const validPaths = photoPaths.filter((path): path is string => Boolean(path));

      // Load all photos concurrently
      await Promise.all(validPaths.map(path => loadPhotoIntoCache(path)));
    },
    [loadPhotoIntoCache],
  );

  // Clear the entire cache
  const clearCache = useCallback(() => {
    Object.keys(globalPhotoCache).forEach(key => {
      delete globalPhotoCache[key];
    });
    loadingPromises.current.clear();
    setCacheVersion(prev => prev + 1);
  }, []);

  // Check if a photo is currently loading
  const isPhotoLoading = useCallback((photoPath: string): boolean => {
    const cached = globalPhotoCache[photoPath];
    return cached?.isLoading || false;
  }, []);

  // Check if a photo has an error
  const hasPhotoError = useCallback((photoPath: string): boolean => {
    const cached = globalPhotoCache[photoPath];
    return cached?.error || false;
  }, []);

  // Periodic cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(
      () => {
        cleanupExpiredCache();
        enforceCacheSizeLimit();
      },
      5 * 60 * 1000,
    ); // Clean up every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [cleanupExpiredCache, enforceCacheSizeLimit]);

  return {
    getPhotoUrl,
    preloadPhoto,
    preloadAllPhotos,
    clearCache,
    isPhotoLoading,
    hasPhotoError,
  };
}

/**
 * Hook for preloading all pet photos when the app starts
 * This ensures all photos are cached and ready for instant display
 */
export function usePreloadPetPhotos(pets: Array<{ photo_path?: string | null }>) {
  const { preloadAllPhotos } = usePhotoCache();

  useEffect(() => {
    const photoPaths = pets.map(pet => pet.photo_path).filter(Boolean);
    if (photoPaths.length > 0) {
      preloadAllPhotos(photoPaths);
    }
  }, [pets, preloadAllPhotos]);
}

/**
 * Hook for managing photo loading states
 * Provides loading and error states for individual photos
 */
export function usePhotoState(photoPath: string | null | undefined) {
  const { getPhotoUrl, isPhotoLoading, hasPhotoError } = usePhotoCache();

  const photoUrl = getPhotoUrl(photoPath);
  const isLoading = photoPath ? isPhotoLoading(photoPath) : false;
  const hasError = photoPath ? hasPhotoError(photoPath) : false;

  return {
    photoUrl,
    isLoading,
    hasError,
  };
}
