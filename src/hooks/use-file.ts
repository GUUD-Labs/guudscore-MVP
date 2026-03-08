import { useMutation } from '@tanstack/react-query';

import { fileService } from '@/services';

// Query keys
export const FILE_QUERY_KEYS = {
  all: ['file'] as const,
} as const;

/**
 * Hook to upload a file
 * @returns Mutation object to upload file and get file data
 */
export const useFileUpload = () => {
  return useMutation({
    mutationFn: (file: File) => fileService.uploadFile(file),
    onError: error => {
      console.error('Failed to upload file:', error);
    },
  });
};
