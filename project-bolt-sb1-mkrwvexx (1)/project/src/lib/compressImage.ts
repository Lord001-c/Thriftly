import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    quality: 0.85,
    fileType: 'image/jpeg' as const,
  };

  try {
    const compressed = await imageCompression(file, options);
    return new File([compressed], file.name, { type: 'image/jpeg' });
  } catch (error) {
    console.error('Compression failed, using original:', error);
    return file;
  }
}
