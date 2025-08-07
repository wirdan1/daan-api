import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import tough from 'tough-cookie';

const jar = new tough.CookieJar();
const client = wrapper(axios.create({ jar }));

const cnvmp3 = {
  api: {
    base: 'https://cnvmp3.com',
    endpoints: {
      info: '/get_video_data.php',
      download: '/download_video_ucep.php'
    }
  },

  headers: {
    accept: '*/*',
    'content-type': 'application/json',
    origin: 'https://cnvmp3.com',
    referer: 'https://cnvmp3.com/v25',
    'user-agent': 'Postify/1.0.0'
  },

  getQuality: (fmt, value) => {
    if (fmt === 1) {
      const audios = { 320: 0, 256: 1, 192: 2, 160: 3, 128: 4, 96: 5 };
      return audios[value] ?? null;
    }
    if (fmt === 0) {
      const videos = [144, 360, 480, 720, 1080];
      return videos.includes(value) ? value : null;
    }
    return null;
  },

  info: async (url) => {
    try {
      const res = await client.post(`${cnvmp3.api.base}${cnvmp3.api.endpoints.info}`, {
        url,
        token: '1234'
      }, {
        headers: cnvmp3.headers,
        timeout: 10000
      });

      if (res.data?.success && res.data?.title) {
        return {
          success: true,
          code: 200,
          result: { title: res.data.title }
        };
      }

      return {
        success: false,
        code: 404,
        result: { error: 'The video title is empty bro 🤙🏻 Try again later..' }
      };
    } catch (err) {
      return {
        success: false,
        code: err?.response?.status || 500,
        result: {
          error: 'Error broo 🫵🏻😂',
          details: err.message
        }
      };
    }
  },

  download: async ({ url, fmt = 1, quality = 128 }, maxTries = 10, delayMs = 2000) => {
    const q = cnvmp3.getQuality(fmt, quality);

    if (!url || typeof url !== 'string' || !url.includes('youtu')) {
      return {
        success: false,
        code: 400,
        result: { error: 'The YouTube link is invalid, man 🗿' }
      };
    }

    if (![0, 1].includes(fmt)) {
      return {
        success: false,
        code: 400,
        result: { error: 'The format is only 0 (video) or 1 (audio) bro.' }
      };
    }

    if (q === null) {
      return {
        success: false,
        code: 400,
        result: {
          error: fmt === 1
            ? 'The audio bitrate is not valid, bro... you can use this: 96–320 kbps'
            : 'The video resolution is invalid bro... can you use this?: 144, 360, 480, 720, 1080'
        }
      };
    }

    const i = await cnvmp3.info(url);
    if (!i.success) return i;

    const payload = {
      url,
      title: i.result.title,
      quality: q,
      formatValue: fmt
    };

    for (let attempt = 1; attempt <= maxTries; attempt++) {
      try {
        const res = await client.post(`${cnvmp3.api.base}${cnvmp3.api.endpoints.download}`, payload, {
          headers: cnvmp3.headers,
          timeout: 20000,
          validateStatus: s => s === 200
        });

        const dlink = res.data?.download_link;
        if (!dlink || typeof dlink !== 'string' || dlink.trim() === '') {
          if (attempt < maxTries) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          }
          return {
            success: false,
            code: 422,
            result: { error: 'The download link is empty bro, aka invalid, ma\'am 😂' }
          };
        }

        return {
          success: true,
          code: 200,
          result: {
            type: fmt === 1 ? 'audio' : 'video',
            title: i.result.title,
            quality: q,
            attempt,
            dlink
          }
        };
      } catch (err) {
        if (attempt < maxTries) await new Promise(resolve => setTimeout(resolve, delayMs));
        else return {
          success: false,
          code: err?.response?.status || 500,
          result: {
            error: 'Error broo 🫵🏻',
            details: err.message
          }
        };
      }
    }
  }
};

export default cnvmp3;
