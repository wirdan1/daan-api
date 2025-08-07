const axios = require('axios');
const cheerio = require('cheerio');
const { lookup } = require('mime-types');

async function mediafire(url) {
    try {
        if (!url.includes('www.mediafire.com')) throw new Error('Invalid url');
        
        const { data } = await axios.get('https://api.nekorinn.my.id/tools/rynn-stuff-v2', {
            params: {
                method: 'GET',
                url: url,
                accessKey: '3ebcf782818cfa0b7265086f112ae25c0954afec762aa05a2eac66580c7cb353'
            }
        });
        const $ = cheerio.load(data.result.response);
        const raw = $('div.dl-info');
        
        const filename = $('.dl-btn-label').attr('title') || raw.find('div.intro div.filename').text().trim() || null;
        const ext = filename.split('.').pop() || null;
        const mimetype = lookup(ext.toLowerCase()) || null;
        
        const filesize = raw.find('ul.details li:nth-child(1) span').text().trim();
        const uploaded = raw.find('ul.details li:nth-child(2) span').text().trim();
        
        const dl = $('a#downloadButton').attr('data-scrambled-url');
        if (!dl) throw new Error('File not found');
        
        return {
            filename,
            filesize,
            mimetype,
            uploaded,
            download_url: atob(dl)
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = mediafire;
