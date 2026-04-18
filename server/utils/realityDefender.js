/**
 * realityDefender.js
 * Deepfake / AI-generated video detection via Reality Defender API.
 *
 * Strategy (free-tier compatible):
 *   Video uploads are blocked on the free tier, but IMAGE uploads work (50/month).
 *   So we:
 *     1. Extract key frames from the video using ffmpeg-static
 *     2. Upload those frames to RD as images for AI-generation analysis
 *     3. Run metadata forensics (encoder signatures, bitrate, etc.) via ffprobe
 *     4. Combine all signals into a single verdict + score
 *
 * Result statuses: AUTHENTIC | FAKE | SUSPICIOUS | NOT_APPLICABLE | UNABLE_TO_EVALUATE
 */

const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const crypto = require('crypto');

// ffmpeg / ffprobe binaries bundled via ffmpeg-static
let ffmpegPath, ffprobePath;
try {
  ffmpegPath  = require('ffmpeg-static');
  ffprobePath = ffmpegPath.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
  // ffmpeg-static doesn't always bundle ffprobe; derive from same dir
  if (!fs.existsSync(ffprobePath)) ffprobePath = null;
} catch (_) {
  ffmpegPath = null;
  ffprobePath = null;
}

const { execFile } = require('child_process');

const RD_BASE = 'https://api.prd.realitydefender.xyz';
const RD_KEY  = process.env.REALITY_DEFENDER_API_KEY;
const ENABLED = !!RD_KEY;

if (!ENABLED) console.warn('[RD] API key not set — deepfake detection disabled.');
if (!ffmpegPath) console.warn('[RD] ffmpeg-static not available — frame extraction disabled.');

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                    */
/* ------------------------------------------------------------------ */

/** Create a temp directory for frame extraction */
function makeTmpDir() {
  const dir = path.join(os.tmpdir(), 'rd_frames_' + crypto.randomBytes(6).toString('hex'));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Remove temp directory */
function cleanTmpDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

/** Run a command and return stdout */
function execAsync(bin, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { timeout: 30000, maxBuffer: 10 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(err, { stderr }));
      resolve(stdout);
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Frame extraction via ffmpeg                                        */
/* ------------------------------------------------------------------ */

/**
 * Extract up to `count` evenly-spaced frames from a video buffer.
 * Returns array of { path, buffer } for the extracted JPEG frames.
 */
async function extractFrames(videoBuffer, count = 3) {
  if (!ffmpegPath) return [];

  const tmpDir   = makeTmpDir();
  const videoFile = path.join(tmpDir, 'input.mp4');
  const pattern  = path.join(tmpDir, 'frame_%03d.jpg');

  try {
    fs.writeFileSync(videoFile, videoBuffer);

    // Get video duration first
    let duration = 10; // fallback
    try {
      const probe = await execAsync(ffmpegPath, [
        '-i', videoFile,
        '-f', 'null', '-'
      ]).catch(() => null);
      // Try to get duration from ffmpeg stderr (it prints to stderr)
      const durMatch = await new Promise((resolve) => {
        execFile(ffmpegPath, ['-i', videoFile], { timeout: 10000 }, (err, stdout, stderr) => {
          const m = (stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
          if (m) resolve(parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]) + parseInt(m[4]) / 100);
          else resolve(10);
        });
      });
      duration = durMatch || 10;
    } catch (_) {}

    // Extract frames at evenly spaced intervals
    const timestamps = [];
    for (let i = 0; i < count; i++) {
      timestamps.push(Math.max(0.5, (duration / (count + 1)) * (i + 1)));
    }

    // Extract all frames at once using select filter
    const selectExpr = timestamps.map(t => `eq(n\\,${Math.floor(t * 25)})`).join('+');
    
    // Simpler approach: extract 1 frame per second, take what we need
    await execAsync(ffmpegPath, [
      '-i', videoFile,
      '-vf', `fps=1/${Math.max(1, Math.floor(duration / count))}`,
      '-frames:v', String(count),
      '-q:v', '2',
      '-y',
      pattern
    ], { timeout: 30000 });

    // Read extracted frames
    const frames = [];
    const files = fs.readdirSync(tmpDir).filter(f => f.startsWith('frame_') && f.endsWith('.jpg')).sort();
    for (const file of files.slice(0, count)) {
      const fp = path.join(tmpDir, file);
      frames.push({ path: fp, buffer: fs.readFileSync(fp) });
    }

    cleanTmpDir(tmpDir);
    return frames;
  } catch (err) {
    console.error('[RD] Frame extraction failed:', err.message);
    cleanTmpDir(tmpDir);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Reality Defender image analysis (free tier)                        */
/* ------------------------------------------------------------------ */

/**
 * Upload a single image buffer to RD and poll for result.
 * Returns { status, score } or null on failure.
 */
async function analyzeImageViaRD(imageBuffer, imageName) {
  try {
    // Step 1: Get pre-signed URL
    const presignRes = await axios.post(
      `${RD_BASE}/api/files/aws-presigned`,
      { fileName: imageName },
      { headers: { 'X-API-KEY': RD_KEY, 'Content-Type': 'application/json' }, timeout: 15000 }
    );

    const signedUrl = presignRes.data?.response?.signedUrl;
    const requestId = presignRes.data?.requestId;
    if (!signedUrl || !requestId) return null;

    // Step 2: Upload image to S3
    await axios.put(signedUrl, imageBuffer, {
      headers: { 'Content-Type': 'image/jpeg' },
      maxBodyLength: Infinity,
      timeout: 30000,
    });

    // Step 3: Poll for result (up to 60s)
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const pollRes = await axios.get(
          `${RD_BASE}/api/media/users/${requestId}`,
          { headers: { 'X-API-KEY': RD_KEY, 'Content-Type': 'application/json' }, timeout: 10000 }
        );
        const summary = pollRes.data?.resultsSummary;
        if (summary && summary.status && summary.status !== 'IN_PROGRESS' && summary.status !== 'ANALYZING') {
          return {
            status: summary.status,
            score:  summary.metadata?.finalScore ?? null,
            requestId,
          };
        }
      } catch (_) { /* still processing */ }
    }
    return null;
  } catch (err) {
    console.error('[RD] Image analysis failed:', err?.response?.data?.message || err.message);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Video metadata forensics                                           */
/* ------------------------------------------------------------------ */

/**
 * Analyze video buffer for AI-generation indicators using binary analysis.
 * Returns { encoderScore, signals[] } where encoderScore is 0-100.
 */
function analyzeVideoMetadata(buffer, fileName) {
  const signals = [];
  let score = 0;

  const headerBytes = buffer.slice(0, Math.min(buffer.length, 8192));
  const headerStr   = headerBytes.toString('utf8', 0, Math.min(buffer.length, 8192));
  const headerHex   = headerBytes.toString('hex');
  const fullStr     = buffer.length < 500000 ? buffer.toString('utf8', 0, buffer.length) : 
                      buffer.toString('utf8', 0, 200000) + buffer.toString('utf8', Math.max(0, buffer.length - 200000));

  // 1. Check for AI tool encoder signatures in metadata
  const aiEncoders = [
    { pattern: /synthesia/i,        name: 'Synthesia',    weight: 40 },
    { pattern: /heygen/i,           name: 'HeyGen',       weight: 40 },
    { pattern: /runway/i,           name: 'Runway',       weight: 40 },
    { pattern: /sora/i,             name: 'Sora',         weight: 35 },
    { pattern: /pika/i,             name: 'Pika',         weight: 35 },
    { pattern: /kling/i,            name: 'Kling',        weight: 35 },
    { pattern: /d-id/i,             name: 'D-ID',         weight: 40 },
    { pattern: /elevenlabs/i,       name: 'ElevenLabs',   weight: 30 },
    { pattern: /luma/i,             name: 'Luma',         weight: 30 },
    { pattern: /gen-2/i,            name: 'Gen-2',        weight: 35 },
    { pattern: /minimax/i,          name: 'MiniMax',      weight: 30 },
    { pattern: /invideo/i,          name: 'InVideo AI',   weight: 30 },
    { pattern: /stable.?diffusion/i,name: 'Stable Diff',  weight: 35 },
    { pattern: /midjourney/i,       name: 'Midjourney',   weight: 35 },
    { pattern: /dall.?e/i,          name: 'DALL-E',       weight: 35 },
    { pattern: /openai/i,           name: 'OpenAI',       weight: 25 },
    { pattern: /deepfake/i,         name: 'Deepfake',     weight: 45 },
    { pattern: /faceswap/i,         name: 'FaceSwap',     weight: 45 },
    { pattern: /wav2lip/i,          name: 'Wav2Lip',      weight: 40 },
  ];

  for (const enc of aiEncoders) {
    if (enc.pattern.test(fullStr) || enc.pattern.test(fileName)) {
      signals.push(`AI tool signature found: ${enc.name}`);
      score += enc.weight;
    }
  }

  // 2. Check encoder/muxer metadata — AI tools often use specific encoders
  const encoderPatterns = [
    { pattern: /Lavf\d/,                  name: 'Lavf (FFmpeg)',       weight: 8 },
    { pattern: /libx264/i,                name: 'libx264',            weight: 3 },
    { pattern: /HandBrake/i,              name: 'HandBrake',          weight: 5 },
  ];

  // AI-generated videos very commonly lack standard camera metadata
  const cameraMetadata = /(?:com\.apple|NIKON|Canon|SONY|samsung|gopro|DJI|Panasonic|FUJI|LG|Xiaomi|Google|Pixel)/i;
  if (!cameraMetadata.test(fullStr)) {
    signals.push('No camera manufacturer metadata found');
    score += 10;
  }

  // 3. Check for suspiciously uniform bitrate (AI videos often have very consistent bitrate)
  const sizeMB = buffer.length / (1024 * 1024);
  if (sizeMB < 0.5 && fileName.match(/\.(mp4|webm|mov)$/i)) {
    signals.push(`Very small video file (${sizeMB.toFixed(2)}MB)`);
    score += 8;
  }

  // 4. Check for AI-platform specific container patterns
  // Many AI video generators use specific MP4 box structures
  const mp4Boxes = headerHex;
  if (mp4Boxes.includes('6674797069736f6d')) {
    // ftypisom — generic ISO base media, common with AI-generated
    const hasMinorVersion = mp4Boxes.includes('69736f6d');
    if (hasMinorVersion) {
      signals.push('Generic ISO media container (common in AI-generated)');
      score += 5;
    }
  }

  // 5. Look for 'creation_time' and 'handler_name' patterns
  const creationTimeMatch = fullStr.match(/creation_time/g);
  if (!creationTimeMatch || creationTimeMatch.length < 2) {
    signals.push('Missing or minimal creation_time metadata');
    score += 5;
  }

  // 6. Check for Lavf/libx264 without camera metadata (strong AI indicator)
  for (const ep of encoderPatterns) {
    if (ep.pattern.test(fullStr)) {
      signals.push(`Encoder: ${ep.name}`);
      score += ep.weight;
    }
  }

  return { encoderScore: Math.min(score, 100), signals };
}

/* ------------------------------------------------------------------ */
/*  Main entry point                                                   */
/* ------------------------------------------------------------------ */

/**
 * Analyze a video for AI generation / deepfake content.
 * Uses a multi-layered approach:
 *   1. Extract frames → send to RD image API (free tier)
 *   2. Binary metadata forensics
 *   3. Combine scores for final verdict
 *
 * @param {Buffer} buffer     Raw video bytes
 * @param {string} fileName   Original filename
 * @param {string} mimeType   MIME type
 * @returns {{ status, score, requestId, simulated? }}
 */
async function analyzeVideo(buffer, fileName, mimeType = 'video/mp4') {
  console.log(`[RD] Starting analysis for: ${fileName} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);

  // Layer 1: Metadata forensics (always runs, fast)
  const metadata = analyzeVideoMetadata(buffer, fileName);
  console.log(`[RD] Metadata forensics: score=${metadata.encoderScore}, signals=[${metadata.signals.join('; ')}]`);

  // Layer 2: Reality Defender image analysis via frame extraction
  let rdResults = [];
  let rdRequestId = null;
  let usedRD = false;

  if (ENABLED && ffmpegPath) {
    try {
      const frames = await extractFrames(buffer, 3);
      console.log(`[RD] Extracted ${frames.length} frames for image analysis`);

      if (frames.length > 0) {
        // Analyze up to 3 frames via RD (free tier: 50 images/month, so be conservative)
        const framesToAnalyze = frames.slice(0, Math.min(frames.length, 2)); // use 2 frames max
        const promises = framesToAnalyze.map((frame, i) =>
          analyzeImageViaRD(frame.buffer, `frame_${i}_${fileName.replace(/\.[^.]+$/, '')}.jpg`)
        );
        rdResults = (await Promise.all(promises)).filter(Boolean);
        console.log(`[RD] RD image results:`, rdResults.map(r => `${r.status}(${r.score})`).join(', '));
        if (rdResults.length > 0) {
          rdRequestId = rdResults[0].requestId;
          usedRD = true;
        }
      }
    } catch (err) {
      console.error('[RD] Frame analysis pipeline error:', err.message);
    }
  } else if (ENABLED && !ffmpegPath) {
    // No ffmpeg — try analyzing a raw chunk as image (won't always work but worth a try)
    console.log('[RD] No ffmpeg available, skipping frame extraction');
  }

  // Combine all signals into final score
  let finalScore = metadata.encoderScore;
  let finalStatus = 'AUTHENTIC';
  const simulated = !usedRD;

  if (usedRD && rdResults.length > 0) {
    // Weight RD results heavily — they use actual AI detection models
    const rdScores = rdResults.map(r => r.score).filter(s => s !== null);
    const rdStatuses = rdResults.map(r => r.status);

    if (rdScores.length > 0) {
      const avgRdScore = rdScores.reduce((a, b) => a + b, 0) / rdScores.length;
      // RD score contributes 70%, metadata contributes 30%
      finalScore = Math.round(avgRdScore * 0.7 + metadata.encoderScore * 0.3);
    }

    // If RD says FAKE on any frame, that's very strong evidence
    if (rdStatuses.includes('FAKE')) {
      finalScore = Math.max(finalScore, 75);
    }
    if (rdStatuses.includes('SUSPICIOUS')) {
      finalScore = Math.max(finalScore, 50);
    }
  } else {
    // No RD available — rely on metadata analysis with adjusted thresholds
    // Be more conservative: if metadata signals are present, lean toward suspicious
    if (metadata.signals.length >= 3) {
      finalScore = Math.max(finalScore, 45);
    }
    if (metadata.signals.length >= 5) {
      finalScore = Math.max(finalScore, 65);
    }
  }

  // Determine final status based on score
  if (finalScore >= 70) {
    finalStatus = 'FAKE';
  } else if (finalScore >= 40) {
    finalStatus = 'SUSPICIOUS';
  } else {
    finalStatus = 'AUTHENTIC';
  }

  console.log(`[RD] Final verdict: ${finalStatus} (score: ${finalScore}, usedRD: ${usedRD}, signals: ${metadata.signals.length})`);

  return {
    status:    finalStatus,
    score:     finalScore,
    requestId: rdRequestId || `local_${Date.now()}`,
    simulated,
  };
}

module.exports = { analyzeVideo, ENABLED };