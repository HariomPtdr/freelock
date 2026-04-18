/**
 * imagekit.js
 * When ImageKit keys are configured, uploads to ImageKit CDN.
 * When disabled (no keys), falls back to local disk storage under server/uploads/
 * and returns a relative URL path that the Express static middleware can serve.
 */

const fs = require('fs');
const path = require('path');

const imagekit = null; // ImageKit SDK instance — disabled (keys not configured)

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Save a file buffer. Returns a URL path.
 *  - If ImageKit is configured: uploads to CDN and returns the full HTTPS URL.
 *  - If ImageKit is disabled:   saves to /uploads/<timestamp>-<filename>
 *    and returns `/uploads/<timestamp>-<filename>` (served by express.static).
 *
 * @param {Buffer} buffer        File contents
 * @param {string} fileName      Original file name
 * @param {string} [folder]      ImageKit folder (ignored in local mode)
 * @returns {Promise<string>}    URL or local path to the saved file
 */
async function uploadToImageKit(buffer, fileName, folder = '/safelancer') {
  // --- ImageKit path (currently disabled) ---
  // if (imagekit) {
  //   const res = await imagekit.upload({ file: buffer, fileName, folder });
  //   return res.url;
  // }

  // --- Local fallback ---
  // Sanitise filename: remove unsafe characters, keep extension
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}-${safeName}`;
  const filePath = path.join(UPLOADS_DIR, uniqueName);

  await fs.promises.writeFile(filePath, buffer);
  console.log(`[LocalUpload] Saved: ${filePath}`);

  // Return the path relative to the server root — express.static('/uploads', ...) serves this
  return `/uploads/${uniqueName}`;
}

module.exports = { imagekit, uploadToImageKit };
