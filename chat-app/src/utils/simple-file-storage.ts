export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

// Simple file storage that creates shareable URLs
export async function uploadFile(file: File): Promise<UploadedFile> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store file data in localStorage for demo purposes
      // In production, you'd upload to a real storage service
      const fileData = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result as string
      };
      
      // Store in localStorage (limited by browser storage)
      try {
        localStorage.setItem(`file_${fileId}`, JSON.stringify(fileData));
      } catch (e) {
        console.warn('LocalStorage full, using fallback');
      }
      
      resolve({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: `file-share://${fileId}`, // Custom protocol for file sharing
      });
    };
    reader.readAsDataURL(file);
  });
}

export function getFileData(fileId: string): any {
  try {
    const data = localStorage.getItem(`file_${fileId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function downloadFile(fileId: string, fileName: string) {
  const fileData = getFileData(fileId);
  if (!fileData) {
    alert('File no longer available');
    return;
  }
  
  // Create download from stored data
  const link = document.createElement('a');
  link.href = fileData.data;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
