export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  // For now, we'll convert the file to base64 and store it in the message
  // In a real production app, you'd upload to a service like:
  // - AWS S3
  // - Cloudinary  
  // - Firebase Storage
  // - Convex Storage (when available)
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      resolve({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: base64, // Store base64 data directly in the message
      });
    };
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
