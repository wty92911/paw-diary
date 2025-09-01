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
 * Hook for selective photo preloading with memory optimization
 * Preloads only visible photos and implements priority-based loading
 */
export function usePreloadPetPhotos(
  pets: Array<{ photo_path?: string | null }>,
  options: {
    maxPreload?: number;
    priorityCount?: number;
    preloadAll?: boolean;
  } = {},
) {
  const { preloadPhoto } = usePhotoCache();
  const preloadedPaths = useRef(new Set<string>());
  const { maxPreload = 10, priorityCount = 5, preloadAll = false } = options;

  useEffect(() => {
    const validPaths = pets
      .map(pet => pet.photo_path)
      .filter((path): path is string => Boolean(path));

    if (validPaths.length === 0) return;

    const preloadPhotos = async () => {
      // If preloadAll is true, use the old behavior for backward compatibility
      if (preloadAll) {
        const newPaths = validPaths.filter(path => !preloadedPaths.current.has(path));
        await Promise.all(newPaths.map(path => preloadPhoto(path)));
        newPaths.forEach(path => preloadedPaths.current.add(path));
        return;
      }

      // Selective preloading strategy
      const pathsToPreload = validPaths.slice(0, Math.min(maxPreload, validPaths.length));

      // Priority loading - load first few immediately
      const priorityPaths = pathsToPreload.slice(0, priorityCount);
      const backgroundPaths = pathsToPreload.slice(priorityCount);

      // Load priority photos immediately
      for (const path of priorityPaths) {
        if (!preloadedPaths.current.has(path)) {
          await preloadPhoto(path);
          preloadedPaths.current.add(path);
        }
      }

      // Load background photos with delay to prevent memory spike
      if (backgroundPaths.length > 0) {
        setTimeout(() => {
          backgroundPaths.forEach(async path => {
            if (!preloadedPaths.current.has(path)) {
              await preloadPhoto(path);
              preloadedPaths.current.add(path);
            }
          });
        }, 1000);
      }
    };

    preloadPhotos();

    // Cleanup function to manage memory
    return () => {
      // Clear preloaded paths tracking when pets change
      const currentPaths = new Set(validPaths);
      preloadedPaths.current = new Set(
        Array.from(preloadedPaths.current).filter(path => currentPaths.has(path)),
      );
    };
  }, [pets, preloadPhoto, maxPreload, priorityCount, preloadAll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      preloadedPaths.current.clear();
    };
  }, []);
}

/**
 * Hook for preloading visible pets with intersection observer optimization
 * Only preloads photos for pets currently in or near the viewport
 */
export function useVisiblePetPhotos(
  pets: Array<{ id: number; photo_path?: string | null }>,
  containerRef: React.RefObject<HTMLElement>,
) {
  const { preloadPhoto } = usePhotoCache();
  const [visiblePetIds, setVisiblePetIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        setVisiblePetIds(prev => {
          const newVisible = new Set(prev);

          entries.forEach(entry => {
            const petId = parseInt(entry.target.getAttribute('data-pet-id') || '0');
            if (entry.isIntersecting) {
              newVisible.add(petId);
            } else if (!entry.isIntersecting && entry.intersectionRatio === 0) {
              newVisible.delete(petId);
            }
          });

          return newVisible;
        });
      },
      {
        root: containerRef.current,
        rootMargin: '50px', // Preload photos 50px before they come into view
        threshold: 0.1,
      },
    );

    // Observe all pet elements
    const petElements = containerRef.current.querySelectorAll('[data-pet-id]');
    petElements.forEach(element => observer.observe(element));

    return () => observer.disconnect();
  }, [containerRef]);

  // Preload visible pet photos
  useEffect(() => {
    const visiblePets = pets.filter(pet => visiblePetIds.has(pet.id));
    const photosToPreload = visiblePets
      .map(pet => pet.photo_path)
      .filter((path): path is string => Boolean(path));

    photosToPreload.forEach(photoPath => {
      preloadPhoto(photoPath);
    });
  }, [visiblePetIds, pets, preloadPhoto]);

  return { visiblePetIds };
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
