export {};

declare global {
  interface Window {
    electronAPI: {
      selectOutputFolder: () => Promise<string | null>;
      selectInputFile: () => Promise<{ name: string; buffer: ArrayBuffer } | null>;
      compressPDFBuffer: (inputFile: { name: string; buffer: Uint8Array | null}, outputFolder: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}