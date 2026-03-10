export {};

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default';

declare global {
  interface Window {
    electronAPI: {
      selectOutputFolder: () => Promise<string | null>;
      selectInputFiles: () => Promise<{ name: string; buffer: ArrayBuffer }[]>;
      compressPDFBuffer: (inputFiles: { name: string; buffer: Uint8Array }[], outputFolder: string, level: CompressionLevel) => Promise<{ success: boolean; error?: string }>;
      mergePDFBuffer: (inputFiles: { name: string; buffer: Uint8Array }[], outputFolder: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
