// TypeScript declarations for test environment

declare global {
  interface Window {
    __TAURI_INTERNALS__: {
      plugins: Record<string, unknown>;
      convertFileSrc: (filePath: string) => string;
    };
    __TAURI__: {
      core: {
        invoke: any;
      };
      event: {
        listen: any;
        emit: any;
      };
      window: {
        getCurrentWindow: any;
      };
    };
  }

  var ResizeObserver: {
    new (callback: any): {
      observe(element: Element): void;
      unobserve(element: Element): void;
      disconnect(): void;
    };
  };

  var IntersectionObserver: {
    new (callback?: any): {
      observe(element: Element): void;
      unobserve(element: Element): void;
      disconnect(): void;
    };
  };
}

export {};
