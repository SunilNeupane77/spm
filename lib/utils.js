import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
}

export const useUploadResource = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file, metadata = {}) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      // Create a URL for uploading
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // This allows us to track upload progress
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      setIsUploading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setIsUploading(false);
      throw err;
    }
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress,
    error,
  };
};

export const getFileIcon = (fileType) => {
  if (!fileType) return '/file.svg';
  
  if (fileType.includes('pdf')) {
    return '/file-pdf.svg';
  } else if (fileType.includes('image')) {
    return '/file-image.svg';
  } else if (fileType.includes('word') || fileType.includes('document')) {
    return '/file-word.svg';
  } else if (fileType.includes('excel') || fileType.includes('sheet')) {
    return '/file-excel.svg';
  } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
    return '/file-powerpoint.svg';
  } else if (fileType.includes('zip') || fileType.includes('archive')) {
    return '/file-archive.svg';
  } else if (fileType.includes('video')) {
    return '/file-video.svg';
  } else if (fileType.includes('audio')) {
    return '/file-audio.svg';
  } else if (fileType.includes('text') || fileType.includes('plain')) {
    return '/file-text.svg';
  } else if (fileType.includes('code') || 
            fileType.includes('javascript') || 
            fileType.includes('html') || 
            fileType.includes('css') || 
            fileType.includes('json')) {
    return '/file-code.svg';
  }
  
  return '/file.svg';
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
