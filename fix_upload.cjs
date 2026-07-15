const fs = require('fs');
let code = fs.readFileSync('src/lib/upload.ts', 'utf8');
code = code.replace(/\/\/ 2\. Perform Resumable[\s\S]*?xhr\.send\(formData\);\n  \}\);/g, `  // 2. Perform Resumable/Progress Upload to Firebase Storage
  return new Promise((resolve, reject) => {
    if (!auth.currentUser) {
      const errorMsg = 'يجب تسجيل الدخول لرفع الملفات.';
      toast.error(errorMsg);
      reject(new Error(errorMsg));
      return;
    }

    // Sanitize file name to avoid invalid characters
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\\-_]/g, '_');
    const extension = sanitizedName.split('.').pop() || '';
    const baseName = sanitizedName.substring(0, sanitizedName.lastIndexOf('.')) || sanitizedName;
    const uniqueFileName = \`\${baseName}_\${Date.now()}.\${extension}\`;
    const filePath = \`uploads/\${auth.currentUser.uid}/\${uniqueFileName}\`;
    
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
  });`);
fs.writeFileSync('src/lib/upload.ts', code);
