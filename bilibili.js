const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath); // ← penting untuk Railway
const axios = require('axios');
const path = require('path');
const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');
const { createWriteStream } = require('fs');

/**
 * Download dan convert video dari Bilibili ke file temporer
 * @param {string} biliUrl - URL Bilibili
 * @param {string} [format='mp4'] - Format keluaran (mp4, mp3, dll)
 * @returns {Promise<{ filePath: string, fileName: string, downloadUrl: string, expiresAt: string }>}
 */
async function biliDownloader(biliUrl, format = 'mp4', quality = '720') {
  if (!biliUrl) throw new Error('URL tidak boleh kosong');

  // 1. Request ke API Stuff.Solutions
  const { data } = await axios.post('https://downloadapi.stuff.solutions/api/json', {
    url: biliUrl,
    videoQuality: quality,
    downloadMode: "auto"
  }, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
  });

  if (!data || data.status !== 'stream' || !data.url) {
    throw new Error('Gagal mendapatkan link stream');
  }

  // 2. Ambil stream dari URL
  const videoStream = await axios.get(data.url, {
    responseType: 'stream'
  });

  // 3. Siapkan path dan nama file sementara
  const fileId = uuidv4();
  const fileName = `${fileId}.${format}`;
  const filePath = path.join('/tmp', fileName);

  // 4. Convert dan simpan ke file
  await new Promise((resolve, reject) => {
    ffmpeg(videoStream.data)
      .format(format)
      .on('end', resolve)
      .on('error', reject)
      .save(filePath);
  });

  // 5. Auto-delete file setelah 5 menit
  setTimeout(() => {
    fs.unlink(filePath).catch(() => {});
  }, 5 * 60 * 1000); // 5 menit

  // 6. Return data download
  return {
    fileName,
    downloadUrl: `https:/izumiiiiiiii.dpdns.org/download?file=${encodeURIComponent(fileName)}`,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  };
}

module.exports = biliDownloader;
