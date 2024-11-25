export interface ColorSource {
  name: string;
  getHexByCode: (code: string) => Promise<string | null>;
  isAvailable: () => Promise<boolean>;
}

export interface PantoneColorResult {
  hex: string | null;
  source: string;
  error?: string;
}