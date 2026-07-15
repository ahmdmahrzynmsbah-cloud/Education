import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './firebase';
import { toast } from 'react-hot-toast';

export interface UploadOptions {
  allowedTypes?: string[]; // e.g., ['image/png', 'image/jpeg', 'video/mp4']
  maxSizeBytes?: number; // e.g., 100 * 1024 * 1024
}

/**
 * Translates Firebase Storage errors into clear, user-friendly Arabic error messages.
 */
function translateStorageError(code: string): string {
  switch (code) {
    case 'storage/unauthorized':
      return 'ليست لديك الصلاحية لرفع هذا الملف. يرجى التأكد من تسجيل الدخول وإعادة المحاولة.';
    case 'storage/canceled':
      return 'تم إلغاء عملية الرفع من قبل المستخدم.';
    case 'storage/quota-exceeded':
      return 'تم تجاوز المساحة التخزينية المتاحة للمنصة. يرجى التواصل مع الدعم الفني.';
    case 'storage/retry-limit-exceeded':
      return 'انتهت مهلة الاتصال بسبب ضعف شبكة الإنترنت. يرجى التحقق من الاتصال والمحاولة مجدداً.';
    case 'storage/invalid-checksum':
      return 'حدث خطأ أثناء نقل الملف (خطأ في المجموع التدقيقي). يرجى إعادة المحاولة.';
    case 'storage/cannot-slice-blob':
      return 'الملف تالف أو غير مدعوم من المتصفح.';
    case 'storage/server-file-not-found':
      return 'لم يتم العثور على الملف في الخادم.';
    default:
      return 'حدث خطأ غير متوقع أثناء الرفع. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.';
  }
}

/**
 * Unified function to upload files (videos, images, etc.) to the local Express backend with robust error handling and translation.
 */
export async function uploadFileToFirebase(
  file: File,
  onProgress: (progress: number) => void,
  options?: UploadOptions
): Promise<string> {
  // 1. Initial Validations
  if (!file) {
    const errorMsg = 'لم يتم تحديد أي ملف للرفع.';
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  // File size validation (default: 500MB max)
  const maxLimit = options?.maxSizeBytes || 500 * 1024 * 1024; // 500 MB
  if (file.size > maxLimit) {
    const sizeInMB = (maxLimit / (1024 * 1024)).toFixed(0);
    const errorMsg = `حجم الملف كبير جداً. الحد الأقصى المسموح به هو ${sizeInMB} ميجابايت.`;
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  // File type validation if specified
  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    const isAllowed = options.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isAllowed) {
      const errorMsg = 'نوع الملف المختار غير مدعوم.';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

    // 2. Perform Resumable/Progress Upload to Firebase Storage
  return new Promise((resolve, reject) => {
    if (!auth.currentUser) {
      const errorMsg = 'يجب تسجيل الدخول لرفع الملفات.';
      toast.error(errorMsg);
      reject(new Error(errorMsg));
      return;
    }

    // Sanitize file name to avoid invalid characters
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const extension = sanitizedName.split('.').pop() || '';
    const baseName = sanitizedName.substring(0, sanitizedName.lastIndexOf('.')) || sanitizedName;
    const uniqueFileName = `${baseName}_${Date.now()}.${extension}`;
    const filePath = `uploads/${auth.currentUser.uid}/${uniqueFileName}`;
    
    const storageRef = ref(storage, filePath);

    // Metadata to help with content type
    const metadata = {
      contentType: file.type || 'application/octet-stream',
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Calculate progress percentage
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        
        // Prevent showing 100% until the final URL is available
        const displayProgress = Math.min(progress, 99.9);
        onProgress(displayProgress);
      },
      (error) => {
        console.error('Firebase Storage Upload Error:', error);
        const translatedError = translateStorageError(error.code);
        toast.error(translatedError);
        reject(new Error(translatedError));
      },
      async () => {
        try {
          // Upload completed successfully, get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress(100);
          resolve(downloadURL);
        } catch (error) {
          console.error('Error getting download URL:', error);
          const translatedError = translateStorageError((error as any).code || 'unknown');
          toast.error('تم الرفع ولكن فشل الحصول على الرابط: ' + translatedError);
          reject(error);
        }
      }
    );
  });
}

/**
 * Backward compatibility wrapper for uploadChunkedFile
 */
export async function uploadChunkedFile(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  // Determine validation options based on file type
  const isVideo = file.type.startsWith('video/');
  const options: UploadOptions = isVideo
    ? {
        allowedTypes: ['video/*'],
        maxSizeBytes: 150 * 1024 * 1024, // 150MB limit for videos
      }
    : {
        allowedTypes: ['image/*'],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB limit for images
      };

  return uploadFileToFirebase(file, onProgress, options);
}
