export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

// Upload to temporary file hosting service
export async function uploadFile(file: File): Promise<UploadedFile> {
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // For demo purposes, we'll use a simple approach
    // In production, you'd use services like:
    // - AWS S3 with presigned URLs
    // - Cloudinary
    // - Firebase Storage
    // - Imgur for images
    // - Temporary file hosting services
    
    // Create a simple data URL that works
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        
        resolve({
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: base64Data,
        });
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error('File upload failed');
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function downloadFile(attachment: any) {
  try {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error('Download failed:', error);
    alert('Download failed. Please try again.');
  }
}
