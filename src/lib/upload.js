import { supabase } from './supabase';

const BUCKET_NAME = 'thesis-files';

/**
 * Read a file as base64 data URL (fallback when Storage fails)
 */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a file: try Supabase Storage first, fall back to base64 data URL
 * @param {File} file
 * @param {string} folder - 'proposals' | 'midterm' | 'final'
 * @param {string} studentId
 * @returns {Promise<{url: string, path?: string} | null>}
 */
export async function uploadFile(file, folder, studentId) {
  // Try Supabase Storage first
  if (supabase) {
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${folder}/${studentId}_${timestamp}_${safeName}`;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(path);
        if (urlData?.publicUrl) {
          return { url: urlData.publicUrl, path };
        }
      }
      console.warn('Supabase Storage upload failed, falling back to base64:', error?.message);
    } catch (err) {
      console.warn('Supabase Storage error, falling back to base64:', err.message);
    }
  }

  // Fallback: read as base64 data URL
  try {
    const dataUrl = await readFileAsDataUrl(file);
    return { url: dataUrl };
  } catch (err) {
    console.error('Base64 read failed:', err);
    return null;
  }
}

/**
 * Get a download URL for a file path
 */
export function getFileUrl(path) {
  if (!supabase || !path) return null;
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  return data?.publicUrl || null;
}
