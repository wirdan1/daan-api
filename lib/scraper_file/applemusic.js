const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const FileType = require('file-type');

class AppleMusic {
    constructor() {
        this.basesearchUrl = 'https://music.apple.com/id/search?term=';
        this.basedownloadUrl = "https://aaplmusicdownloader.com";
        this.userAgent =
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36";
        this.headers = {
            authority: "aaplmusicdownloader.com",
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "ms-MY,ms;q=0.9,en-US;q=0.8,en;q=0.7",
            "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"Android"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": this.userAgent,
            "x-requested-with": "XMLHttpRequest",
        };
    }

    /**
     * Scrape Apple Music search results for a given term.
     * @param {string} term — kata kunci pencarian, misal "sempurna"
     * @returns {Promise<Array<{ title: string, subtitle: string, link: string, image: string|null }>>}
     */
    search = async function(term) {
        const url = `${this.basesearchUrl}${encodeURIComponent(term)}`;

        try {
            // 1. Fetch halaman
            const {
                data: html
            } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });

            // 2. Parse dengan Cheerio
            const $ = cheerio.load(html);
            const results = [];

            // 3. Ekstrak tiap item grid
            $('li.grid-item').each((_, li) => {
                const el = $(li);

                const link = el.find('a.click-action').attr('href');
                const title = el
                    .find('[data-testid="top-search-result-title"] .top-search-lockup__primary__title')
                    .text()
                    .trim();
                const subtitle = el
                    .find('[data-testid="top-search-result-subtitle"]')
                    .text()
                    .trim();
                // ambil srcset pertama dari <source type="image/jpeg">
                const imgSrc = el
                    .find('picture source[type="image/jpeg"]')
                    .first()
                    .attr('srcset')
                    ?.split(' ')[0] || null;

                if (title && link) {
                    results.push({
                        title,
                        subtitle,
                        link,
                        image: imgSrc
                    });
                }
            });

            return results;
        } catch (err) {
            console.error(`Error scraping "${term}":`, err.message);
            return [];
        }
    }

    track = async function(url) {
        try {
            const response = await axios.get(url);
            const html = response.data;
            const $ = cheerio.load(html);

            // Extract song title (specific track)
            const songTitle = $('meta[property="og:title"]').attr('content') || 'Unknown Title';

            // Extract image URL
            const imageUrl = $('meta[property="og:image"]').attr('content') || 'Unknown Image URL';

            // Extract URL (song-specific URL)
            const link = $('meta[property="music:song"]').attr('content') || 'Unknown URL';

            // Extract album name
            const album = $('h1.headings__title span[dir="auto"]').text().trim() || 'Unknown Album';

            // Attempt to extract track list with song URLs
            let tracks = [];
            const jsonLdScript = $('script[type="application/ld+json"]').html();
            if (jsonLdScript) {
                try {
                    const jsonLd = JSON.parse(jsonLdScript);
                    if (jsonLd.inAlbum && jsonLd.inAlbum['@type'] === 'MusicAlbum') {
                        tracks.push({
                            name: jsonLd.name,
                            trackNumber: $('meta[property="music:song:track"]').attr('content') || null,
                            songUrl: $('meta[property="music:song"]').attr('content') || null
                        });
                    }
                } catch (e) {
                    console.warn('Failed to parse JSON-LD:', e.message);
                }
            }

            // Try to extract tracks from HTML (hypothetical selector for track list)
            const trackElements = $('.tracklist-item'); // Adjust selector if track list is in full HTML
            if (trackElements.length > 0) {
                trackElements.each((i, el) => {
                    const trackName = $(el).find('.tracklist-item__title').text().trim();
                    const trackNumber = $(el).find('.tracklist-item__number').text().trim() || (i + 1).toString();
                    const songUrl = $(el).find('a').attr('href') || null;
                    if (trackName) {
                        tracks.push({
                            name: trackName,
                            trackNumber,
                            songUrl
                        });
                    }
                });
            }

            // Remove duplicates
            tracks = [...new Map(tracks.map(item => [item.name, item])).values()];

            // Return the scraped data as an array to match your example
            return [{
                songTitle,
                imageUrl,
                link,
                album,
                tracks: tracks.length > 0 ? tracks : 'Track list not found in static HTML'
            }];
        } catch (error) {
            console.error('Error scraping data:', error.message);
            throw new Error('Failed to scrape Apple Music page');
        }
    }

    /***
     *** ᠁᠁᠁᠁᠁᠁᠁᠁᠁᠁᠁᠁᠁
     *** - Dev: FongsiDev
     *** - Contact: t.me/dashmodz
     *** - Gmail: fongsiapi@gmail.com & fgsidev@neko2.net
     *** - Group: chat.whatsapp.com/Ke94ex9fNLjE2h8QzhvEiy
     *** - Telegram Group: t.me/fongsidev
     *** - Github: github.com/Fgsi-APIs/RestAPIs/issues/new
     *** - Huggingface: huggingface.co/fgsi1
     *** - Website: fgsi1-restapi.hf.space
     *** ᠁᠁᠁᠁᠁᠁᠁᠁᠁᠁᠁᠁᠁
     ***/

    // Scraper By Fgsi
    download = async function(url, quality = "128") {
        const getSessionCookie = async () => {
            const response = await axios.get(this.basedownloadUrl, {
                headers: {
                    ...this.headers,
                    referer: `${this.basedownloadUrl}/`,
                },
            });
            const setCookie = response.headers["set-cookie"]?.[0];
            if (!setCookie) throw new Error("No Set-Cookie header found");
            const cookie = setCookie.split(";")[0];
            return cookie;
        }

        const cookie = await getSessionCookie();
        const song = await axios.get(`${this.basedownloadUrl}/api/song_url.php`, {
            params: {
                url
            },
            headers: {
                ...this.headers,
                referer: `${this.basedownloadUrl}/`,
            },
        });

        const zipDownload = false
        const form = new URLSearchParams({
            song_name: song.data.name,
            artist_name: song.data.artist,
            url: song.data.url,
            token: "none",
            zip_download: zipDownload.toString(),
            quality,
        });

        const response = await axios.post(
            `${this.basedownloadUrl}/api/composer/swd.php`,
            form, {
                headers: {
                    ...this.headers,
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    cookie: `${cookie}; _ga=; _ga_382FSD5WBG=`,
                    origin: this.basedownloadUrl,
                    referer: `${this.basedownloadUrl}/song.php`,
                },
            },
        );

        const result = await axios.get(
            response.data.dlink,
              { 
                 responseType: 'arraybuffer'
              }
           ).then(a => a.data);
        
        const fileType = await FileType.fromBuffer(result);
        if (!fileType || !fileType.ext) {
            return res.status(500).json({ status: false, error: 'Cannot determine file type' });
        }

        const id = crypto.randomBytes(8).toString('hex');
        const fileName = `${song.data.name || ''} - ${song.data.artist || ''}.${id}.${fileType.ext}`;
        const filePath = path.join('/tmp', fileName);

        await fs.writeFile(filePath, result);

        setTimeout(() => {
           fs.unlink(filePath).catch(() => {});
        }, 5 * 60 * 1000);

        return {
            ...song.data,
            downloadLink: `https://izumi-apis.zone.id/download?file=${encodeURIComponent(fileName)}`,
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        };
    }
}

module.exports = new AppleMusic();
