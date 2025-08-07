const axios = require('axios');
const cheerio = require('cheerio');

class Anoboy {
    latest = async function() {
        try {
            // Mengambil data HTML dari URL
            const response = await axios.get('https://ww3.anoboy.app/');
            const $ = cheerio.load(response.data);

            // Objek untuk menyimpan hasil scraping
            const result = {
                schedule: [],
                latestEpisodes: [],
                movies: [],
                liveAction: [],
                newlyAdded: []
            };

            // Scraping jadwal update
            $('div#jadwal table tr').each((index, element) => {
                if (index === 0) return; // Skip header row
                const title = $(element).find('td:nth-child(1) a').text().trim();
                const link = $(element).find('td:nth-child(1) a').attr('href');
                const day = $(element).find('td:nth-child(2)').text().trim();
                const time = $(element).find('td:nth-child(3)').text().trim();
                result.schedule.push({
                    title,
                    link,
                    day,
                    time
                });
            });

            // Scraping episode terbaru
            $('div.container a[rel="bookmark"]').each((index, element) => {
                const title = $(element).find('h3.ibox1').text().trim();
                const link = $(element).attr('href');
                const thumbnail = $(element).find('amp-img').attr('src');
                const updateTime = $(element).find('div.jamup').text().trim();
                if (title.includes('Episode')) {
                    result.latestEpisodes.push({
                        title,
                        link,
                        thumbnail,
                        updateTime
                    });
                }
            });

            // Scraping film anime
            $('div.side_home a[rel="bookmark"]').each((index, element) => {
                const title = $(element).find('h3.ibox').text().trim();
                const link = $(element).attr('href');
                const thumbnail = $(element).find('amp-img').attr('src');
                if ($(element).parent().prev('h2.jdl').text().includes('Movie')) {
                    result.movies.push({
                        title,
                        link,
                        thumbnail
                    });
                }
            });

            // Scraping live action
            $('div.side_home a[rel="bookmark"]').each((index, element) => {
                const title = $(element).find('h3.ibox').text().trim();
                const link = $(element).attr('href');
                const thumbnail = $(element).find('amp-img').attr('src');
                if ($(element).parent().prev('h2.jdl').text().includes('Live Action')) {
                    result.liveAction.push({
                        title,
                        link,
                        thumbnail
                    });
                }
            });

            // Scraping anime baru ditambahkan
            $('div.side_home a[rel="bookmark"]').each((index, element) => {
                const title = $(element).find('h3.ibox').text().trim();
                const link = $(element).attr('href');
                const thumbnail = $(element).find('amp-img').attr('src');
                if ($(element).parent().prev('h2.jdl').text().includes('Baru ditambahkan')) {
                    result.newlyAdded.push({
                        title,
                        link,
                        thumbnail
                    });
                }
            });

            // Mengembalikan hasil
            return result;

        } catch (error) {
            // Mengembalikan objek error jika gagal
            return {
                error: 'Error saat melakukan scraping: ' + error.message
            };
        }
    }
    search = async function(query) {
        try {
            // Mengambil data HTML dari URL
            const response = await axios.get(`https://ww3.anoboy.app/?s=${query}`);
            const $ = cheerio.load(response.data);

            // Array untuk menyimpan hasil scraping
            const results = [];

            // Seleksi elemen dengan class 'amv' yang berisi hasil pencarian
            $('div.amv').each((index, element) => {
                const title = $(element).find('h3.ibox1').text().trim();
                const link = $(element).parent().attr('href');
                const updateTime = $(element).find('div.jamup').text().trim();

                // Menyimpan data ke dalam array
                results.push({
                    title: title,
                    link: link,
                    updateTime: updateTime
                });
            });

            // Mengembalikan hasil
            return results;

        } catch (error) {
            // Mengembalikan objek error jika gagal
            return {
                error: 'Error saat melakukan scraping: ' + error.message
            };
        }
    }

    detail = async function(url) {
        try {
            // Mengambil data HTML dari URL
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            // Objek untuk menyimpan hasil scraping
            const result = {
                metadata: {},
                episodes: []
            };

            // Scraping metadata dari tabel
            const metadataTable = $('div.unduhan table tbody tr');
            metadataTable.each((index, element) => {
                const key = $(element).find('th').text().trim();
                const value = $(element).find('td').text().trim();
                result.metadata[key.toLowerCase()] = value;
            });

            // Scraping deskripsi
            const description = $('div.unduhan').first().text().trim();
            result.metadata.description = description;

            // Scraping daftar episode
            $('div.singlelink ul.lcp_catlist li a').each((index, element) => {
                const title = $(element).text().trim();
                const link = $(element).attr('href');
                result.episodes.push({
                    title: title,
                    link: link
                });
            });

            // Mengembalikan hasil
            return result;

        } catch (error) {
            // Mengembalikan objek error jika gagal
            return {
                error: 'Error saat melakukan scraping: ' + error.message
            };
        }
    }

    episode = async function(url) {
        try {
            // Mengambil data HTML dari URL
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            // Objek untuk menyimpan hasil scraping
            const result = {
                streaming: [],
                downloads: {}
            };

            // Scraping link streaming
            $('div#fplay div.vmiror').each((index, element) => {
                const provider = $(element).contents().filter((_, el) => el.type === 'text').text().trim().replace('|', '').trim();
                const links = [];
                $(element).find('a#allmiror').each((_, link) => {
                    const resolution = $(link).text().trim();
                    const url = $(link).attr('data-video');
                    links.push({
                        resolution,
                        url
                    });
                });
                result.streaming.push({
                    provider,
                    links
                });
            });

            // Scraping link download
            $('div#colomb span.ud').each((index, element) => {
                const provider = $(element).find('span.udj').text().trim();
                const links = [];
                $(element).find('a.udl').each((_, link) => {
                    const resolution = $(link).text().trim();
                    const url = $(link).attr('href');
                    if (url !== 'none') {
                        links.push({
                            resolution,
                            url
                        });
                    }
                });
                result.downloads[provider] = links;
            });

            // Mengembalikan hasil
            return result;

        } catch (error) {
            // Mengembalikan objek error jika gagal
            return {
                error: 'Error saat melakukan scraping: ' + error.message
            };
        }
    }
}

module.exports = new Anoboy();
