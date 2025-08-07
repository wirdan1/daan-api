const fetch = require('node-fetch');
const cheerio = require('cheerio');

const mimeTypeMap = {
  // Archive formats
  zip: 'application/zip',
  mcaddon: 'application/octet-stream',
  rar: 'application/vnd.rar',
  'tar.gz': 'application/gzip',
  // Video formats
  mp4: 'video/mp4',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  webm: 'video/webm',
  // Audio formats
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  aac: 'audio/aac',
  // Image formats
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp'
};

async function mfdl(url) {
  try {
    const response = await fetch('https://r.jina.ai/' + url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const bodyText = $('body').text();
    
    // Extract specific text elements
    const title = bodyText.match(/Title: (.*?)\n/)?.[1] || 'Not found';
    const urlSource = bodyText.match(/URL Source: (.*?)\n/)?.[1] || 'Not found';
    
    // Dynamically extract fileName from URL Source or page content
    const fileNameMatch = urlSource.match(/\/([^\/]+)\/file$/);
    const fileName = fileNameMatch
      ? fileNameMatch[1]
      : bodyText.match(/([^\s]+\.(?:zip|mcaddon|rar|tar\.gz|mp4|mkv|avi|mov|webm|mp3|wav|ogg|flac|aac|jpg|jpeg|png|gif|bmp|webp))/i)?.[1] || 'Unknown';

    // Extract MIME type based on file extension
    const fileExtension = fileName !== 'Unknown' ? fileName.split('.').pop().toLowerCase() : null;
    const mimeType = fileExtension && mimeTypeMap[fileExtension] ? mimeTypeMap[fileExtension] : 'application/octet-stream';

    const fileSize = bodyText.match(/File size: (.*?)\n/)?.[1] || 'Not found';
    const uploadedDate = bodyText.match(/Uploaded: (.*?)\n/)?.[1] || 'Not found';
    const uploadRegion = bodyText.match(/This file was uploaded from (.*?)\n/)?.[1] || 'Not found';
    const downloadLinkMatch = bodyText.match(/\[Download \((.*?)\)\]\((.*?)\)/);
    const downloadLink = downloadLinkMatch ? downloadLinkMatch[2] : 'Not found';

    // Structure the output
    const result = {
      metadata: {
        title,
        fileName,
        mimeType,
        fileSize,
        uploadedDate,
        uploadRegion,
        urlSource,
      },
      downloadLink
    };

    return result;
  } catch (error) {
    console.error('Error scraping the page:', error);
    return { error: error.message };
  }
}

module.exports = mfdl;
