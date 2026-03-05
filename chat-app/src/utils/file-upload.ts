export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  // Create a unique file ID
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // For now, we'll create a local object URL
  // In a real app, you'd upload to a service like AWS S3, Cloudinary, or Convex storage
  const url = URL.createObjectURL(file);
  
  return {
    id: fileId,
    name: file.name,
    size: file.size,
    type: file.type,
    url: url
  };
}

export function formatFileForMessage(file: UploadedFile): string {
  const icon = getFileEmoji(file.type);
  return `${icon} [${file.name}] (${formatFileSize(file.size)})`;
}

export function getFileEmoji(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  return '📎';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
