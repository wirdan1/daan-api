const axios = require('axios');

async function ttdl(url) {
    try {
        if (!/^https?:\/\/(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)\/.+/i.test(url)) throw new Error('Invalid url');
        
        const { data } = await axios.get('https://tiktok-scraper7.p.rapidapi.com', {
            headers: {
                'Accept-Encoding': 'gzip',
                'Connection': 'Keep-Alive',
                'Host': 'tiktok-scraper7.p.rapidapi.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
                'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com',
                'X-RapidAPI-Key': 'ca5c6d6fa3mshfcd2b0a0feac6b7p140e57jsn72684628152a'
            },
            params: {
                url: url,
                hd: '1'
            }
        });
        
        return data.data;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = ttdl;
