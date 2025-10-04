/**
 * Resolves image paths from various sources including data URIs, public folder, and remote URLs
 * @param {string} img - The image path or data URI
 * @param {string} fallback - Fallback image path (set to null to prevent fallback)
 * @returns {string|null} Resolved image URL, data URI, or null if no image should be displayed
 */
export const resolvePublicImage = (img, fallback = null) => {
  // If explicitly set to not show any image
  if (img === null || img === false) {
    return null;
  }
  
  // If the image is a base64 data URI, return it directly
  if (typeof img === 'string' && img.startsWith('data:image/')) {
    return img;
  }

  // Base URL for public assets
  const base = (typeof window !== 'undefined' && import.meta?.env?.BASE_URL) 
    ? import.meta.env.BASE_URL 
    : '/';
  
  // Helper function to create proper URL paths
  const toBase = (path) => {
    if (!path) return '';
    // Remove leading slashes to prevent double slashes
    const clean = String(path).trim().replace(/^\/+/, '');
    // Ensure base ends with a single slash
    return base.replace(/\/$/, '') + '/' + clean;
  };

  // If no image is provided, return the fallback or null if no fallback is set
  if (!img) {
    return fallback !== null ? toBase(fallback) : null;
  }
  
  // Clean and normalize the image path early
  let imagePath = typeof img === 'string' ? String(img).trim() : '';
  // Normalize Windows backslashes to forward slashes BEFORE URL checks
  imagePath = imagePath.replace(/\\/g, '/');
  // Strip wrapping quotes if present
  imagePath = imagePath.replace(/^['"]|['"]$/g, '');
  // If after trimming it's empty or looks like a sentinel, use fallback
  if (!imagePath || /^(n\/?a|na|null|undefined|none|no\s*image)$/i.test(imagePath)) {
    return fallback !== null ? toBase(fallback) : null;
  }

  // If a data URI appears anywhere (e.g., malformed prefix like 'altdata:image/...'), extract it
  const embeddedDataIdx = imagePath.indexOf('data:image/');
  if (embeddedDataIdx >= 0) {
    return imagePath.slice(embeddedDataIdx);
  }

  // If it's already a full URL, data URI, or blob, return normalized as is
  if (
    typeof imagePath === 'string' && (
      imagePath.startsWith('http') || 
      imagePath.startsWith('data:') || 
      imagePath.startsWith('blob:')
    )
  ) {
    return imagePath;
  }
  
  // If the path looks like a backend upload (e.g., uploads/xyz.jpg), serve from API base
  const lower = imagePath.toLowerCase();
  if (/^\/?uploads\//i.test(imagePath) || lower.includes('/uploads/')) {
    const apiBase = (import.meta?.env?.VITE_API_BASE) || 'http://localhost:4000';
    // Extract from '/uploads/...' onward if present in the middle
    const idx = lower.indexOf('/uploads/');
    const tail = idx >= 0 ? imagePath.slice(idx) : (imagePath.startsWith('/') ? imagePath : `/${imagePath}`);
    return `${apiBase}${tail}`;
  }
  
  // If the image is in the public folder
  if (imagePath.startsWith('/')) {
    // Until real assets are added, any '/images/...' or '/food/...' should fallback to placeholder
    if (/^\/(images|food)\//i.test(imagePath)) {
      return toBase('images/placeholder.svg');
    }
    return toBase(imagePath.substring(1));
  }
  
  // If it's a relative path, only allow it if it looks like an asset filename with an image extension
  const hasImageExt = /\.(png|jpe?g|gif|webp|svg|bmp|ico|tiff?)$/i.test(imagePath);
  if (!hasImageExt) {
    return fallback !== null ? toBase(fallback) : null;
  }
  return toBase(imagePath);
};

// Alias for backward compatibility
export const resolveImageSrc = resolvePublicImage;
