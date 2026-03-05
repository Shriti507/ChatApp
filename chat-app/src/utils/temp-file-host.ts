export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

// Temporary solution: Create downloadable data URLs that work across devices
export async function uploadFile(file: File): Promise<UploadedFile> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const base64Data = reader.result as string;
      
      // Store file info in Convex message (simplified approach)
      resolve({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: base64Data, // Store full base64 data in message
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

export function triggerDownload(attachment: any) {
  try {
    // Create download from base64 data
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Download failed:', error);
    alert('Download failed. Please try again.');
  }
}
