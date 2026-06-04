import { supabase } from './supabase';

const BUCKET_NAME = 'thesis-files';

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} folder - Subfolder (e.g., 'proposals', 'midterm', 'final')
 * @param {string} studentId - Student ID for path namespacing
 * @returns {Promise<{url: string, path: string} | null>}
 */
export async function uploadFile(file, folder, studentId) {
  if (!supabase) {
    console.error('Supabase client not configured');
    return null;
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${studentId}_${timestamp}_${safeName}`;

  try {
    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/zip',
          'application/x-zip-compressed',
          'image/jpeg',
          'image/png'
        ]
      });
    }

    // Upload file
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path
    };
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
}

/**
 * Get a download URL for a file path
 * @param {string} path - The storage path
 * @returns {string | null}
 */
export function getFileUrl(path) {
  if (!supabase || !path) return null;
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  return data?.publicUrl || null;
}
