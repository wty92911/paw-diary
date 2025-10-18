import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'portion_';

export const useBrandProductMemory = (category: string = 'food') => {
  const brandKey = `${STORAGE_KEY_PREFIX}brands_${category}`;
  const productKey = `${STORAGE_KEY_PREFIX}products_${category}`;

  // Load from localStorage
  const loadFromStorage = (key: string): string[] => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save to localStorage
  const saveToStorage = (key: string, values: string[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(values));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  const [brands, setBrands] = useState<string[]>(() => loadFromStorage(brandKey));
  const [products, setProducts] = useState<string[]>(() => loadFromStorage(productKey));

  // Sync with localStorage when values change
  useEffect(() => {
    saveToStorage(brandKey, brands);
  }, [brands, brandKey]);

  useEffect(() => {
    saveToStorage(productKey, products);
  }, [products, productKey]);

  // Add brand
  const addBrand = useCallback((brand: string) => {
    const trimmed = brand.trim();
    if (!trimmed) return;

    setBrands(prev => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
  }, []);

  // Remove brand
  const removeBrand = useCallback((brand: string) => {
    setBrands(prev => prev.filter(b => b !== brand));
  }, []);

  // Add product
  const addProduct = useCallback((product: string) => {
    const trimmed = product.trim();
    if (!trimmed) return;

    setProducts(prev => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
  }, []);

  // Remove product
  const removeProduct = useCallback((product: string) => {
    setProducts(prev => prev.filter(p => p !== product));
  }, []);

  return {
    brands,
    products,
    addBrand,
    removeBrand,
    addProduct,
    removeProduct,
  };
};
