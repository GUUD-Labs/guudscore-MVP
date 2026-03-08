import { secureTokenStore } from '@/lib/token-store';
import type { ApiResponse } from '@/types';

import { apiService } from './api';

// File upload response types
export interface FileUploadResponse {
  id?: string;
  photoId?: string;
  fileEntityId?: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
  file?: {
    uploadHash: string;
  };
}

class FileService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  /**
   * Upload a file to the server
   * @param file - The file to upload
   * @returns Promise with file upload response data
   */
  async uploadFile(file: File): Promise<ApiResponse<FileUploadResponse>> {
    this.setAuthHeaders();

    const formData = new FormData();
    formData.append('file', file);

    const response = await apiService.post<FileUploadResponse>(
      '/file',
      formData
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to upload file');
    }

    return response;
  }
}

export const fileService = new FileService();
