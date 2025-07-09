// Storage service mock/stub
export interface UploadResult {
  url: string;
  key: string;
  size?: number;
}

export const uploadFile = async (): Promise<UploadResult> => {
  // Mock implementation - in real app, file would be uploaded to storage
  return {
    url: 'https://storage.example.com/files/test.jpg',
    key: 'files/test.jpg',
    size: 1024,
  };
};

export const deleteFile = async (key: string): Promise<void> => {
  // Mock implementation
  console.log(`Mock delete file: ${key}`);
};

export const getSignedUrl = async (key: string, expires?: number): Promise<string> => {
  console.log(`Mock get signed URL for key: ${key}, expires: ${expires}`);
  return 'https://storage.example.com/signed-url';
};

export interface StorageInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

export class MemoryStorage implements StorageInterface {
  private storage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  size(): number {
    return this.storage.size;
  }
}

const StorageService = {
  uploadFile,
  deleteFile,
  getSignedUrl,
};

export default StorageService;
