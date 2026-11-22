/**
 * Image storage utility.
 * Reads image as optimized Base64 data URL, perfectly compatible with MongoDB storage
 * and Cloudinary without requiring Firebase.
 */
export async function uploadImage(file, path = "uploads", onProgress = null) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (onProgress) onProgress(30);

    reader.onload = () => {
      if (onProgress) onProgress(100);
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      console.error("Image read error:", error);
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}
