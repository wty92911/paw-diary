import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import './global.d';

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Global test utilities and mocks can be added here
// Mock Tauri API for testing
(window as any).__TAURI_INTERNALS__ = {
  plugins: {},
  convertFileSrc: (filePath: string) => filePath,
};

// Mock the invoke function from Tauri
(window as any).__TAURI__ = {
  core: {
    invoke: vi.fn().mockResolvedValue({}),
  },
  event: {
    listen: vi.fn().mockResolvedValue(() => {}),
    emit: vi.fn().mockResolvedValue({}),
  },
  window: {
    getCurrentWindow: vi.fn().mockReturnValue({
      listen: vi.fn().mockResolvedValue(() => {}),
      emit: vi.fn().mockResolvedValue({}),
    }),
  },
};

// Mock ResizeObserver (needed for some UI components)
(globalThis as any).ResizeObserver = class ResizeObserver {
  observe() {
    // do nothing
  }
  unobserve() {
    // do nothing
  }
  disconnect() {
    // do nothing
  }
};

// Mock IntersectionObserver (needed for some UI components)
(globalThis as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};
