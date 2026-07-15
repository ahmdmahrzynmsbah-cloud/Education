const fs = require('fs');
let code = fs.readFileSync('src/lib/upload.ts', 'utf8');

const compressLogic = `
/**
 * Compresses an image file before upload
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif') return file; // Don't compress GIFs
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.7 // quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**`;

code = code.replace('/**\n * Unified function', compressLogic + '\n * Unified function');

const processFileLogic = `
export async function uploadFileToFirebase(
  originalFile: File,
  onProgress: (progress: number) => void,
  options?: UploadOptions
): Promise<string> {
  // Compress image if applicable
  const file = await compressImage(originalFile);
`;

code = code.replace(/export async function uploadFileToFirebase\([\s\S]*?\): Promise<string> {/g, processFileLogic);

fs.writeFileSync('src/lib/upload.ts', code);
