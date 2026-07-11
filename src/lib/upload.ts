export async function uploadChunkedFile(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  const CHUNK_SIZE = 1024 * 512; // 512KB chunks to bypass proxy limits
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const fileId = Date.now().toString() + '-' + Math.round(Math.random() * 1E9);

  if (file.size <= CHUNK_SIZE) {
    // If file is small, upload normally
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress((e.loaded / e.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText).url);
        } else {
          reject(new Error('Upload failed with status ' + xhr.status));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  }

  // Chunked upload
  let uploadedBytes = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk, file.name);
    formData.append('fileId', fileId);
    formData.append('chunkIndex', chunkIndex.toString());

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload-chunk', true);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const currentProgress = ((uploadedBytes + e.loaded) / file.size) * 100;
          onProgress(currentProgress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          uploadedBytes += (end - start);
          resolve();
        } else {
          reject(new Error(`Chunk upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during chunk upload'));
      xhr.send(formData);
    });
  }

  // Merge chunks
  const mergeResponse = await fetch('/api/upload-merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      totalChunks,
      originalName: file.name
    })
  });

  if (!mergeResponse.ok) {
    throw new Error('Failed to merge uploaded chunks');
  }

  const { url } = await mergeResponse.json();
  onProgress(100);
  return url;
}
