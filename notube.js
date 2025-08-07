const axios = require('axios');
const cheerio = require('cheerio');

async function search(query) {
  const searchUrl = 'https://s60.notube.net/suggestion.php?lang=id';
  const payload = new URLSearchParams({
    keyword: query,
    format: 'mp3',
    subscribed: 'false'
  });

  try {
    const { data } = await axios.post(searchUrl, payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://notube.net',
        'Referer': 'https://notube.net/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const results = [];
    $('.row > a').each((i, element) => {
      const onclickAttr = $(element).attr('onclick');
      const urlMatch = onclickAttr.match(/DOWNL\('([^']+)'/);
      const videoUrl = urlMatch ? urlMatch[1] : null;

      if (videoUrl) {
        const title = $(element).find('p').text().trim();
        const thumbnail = $(element).find('img').attr('src');
        const duration = $(element).find('div[style*="background-color"]').text().trim();
        const author = $(element).find('small font').first().text().trim();
        const description = $(element).find('small font').last().text().trim();

        results.push({
          title,
          author,
          duration,
          description,
          thumbnail,
          url: videoUrl,
        });
      }
    });
    return results;
  } catch (error) {
    throw new Error('Gagal nggolek video. Ono sing salah iki.');
  }
}

async function pollForDownloadLink(token, retries = 15, delay = 2000) {
  const downloadPageUrl = `https://notube.net/id/download?token=${token}`;
  for (let i = 0; i < retries; i++) {
    const { data: pageData } = await axios.get(downloadPageUrl);
    const $ = cheerio.load(pageData);
    const finalDownloadUrl = $('#downloadButton').attr('href');

    if (finalDownloadUrl && finalDownloadUrl.includes('key=') && !finalDownloadUrl.endsWith('key=')) {
      const title = $('#blocLinkDownload h2').text().trim();
      return { title, download_url: finalDownloadUrl };
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('Suwi banget, link download-e ora ketemu. Sabar to!');
}

async function download(url, format = 'mp3') {
  const serverUrl = 'https://s60.notube.net';

  try {
    const weightPayload = new URLSearchParams({ url, format, lang: 'id', subscribed: 'false' });
    const { data: weightData } = await axios.post(`${serverUrl}/recover_weight.php`, weightPayload.toString());

    const { token, name_mp4 } = weightData;
    if (!token) throw new Error('Ora iso nemokke token, Rek!');

    const filePayload = new URLSearchParams({ url, format, name_mp4, lang: 'id', token, subscribed: 'false', playlist: 'false', adblock: 'false' });
    await axios.post(`${serverUrl}/recover_file.php?lang=id`, filePayload.toString());

    const conversionPayload = new URLSearchParams({ token });
    await axios.post(`${serverUrl}/conversion.php`, conversionPayload.toString());

    return await pollForDownloadLink(token);
  } catch (error) {
    throw new Error('Gagal ngunduh video. Coba maneh, Rek.');
  }
}
  
module.exports = download;
