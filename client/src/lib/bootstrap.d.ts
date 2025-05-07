// Type definitions for Bootstrap
interface Modal {
  show(): void;
  hide(): void;
  toggle(): void;
  dispose(): void;
  static getInstance(element: Element): Modal | null;
}

interface BootstrapStatic {
  Modal: {
    getInstance(element: Element): Modal | null;
    getOrCreateInstance(element: Element, options?: any): Modal;
  }
}

interface Window {
  bootstrap?: BootstrapStatic;
}