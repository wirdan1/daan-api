const axios = require('axios');
const cheerio = require('cheerio');

class Zerochan {
    // Ambil detail dari 1 URL (internal untuk dipakai di search)
    #fetchDetail = async function (url) {
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const scriptContent = $('script[type="application/ld+json"]').html();
            const jsonData = JSON.parse(scriptContent);
            return {
                title: jsonData.name,
                downloadLink: jsonData.contentUrl,
                id: url
            };
        } catch {
            return null;
        }
    }

    // Hasil search dengan langsung ambil detail (HD image)
    search = async function (search) {
        const url = `https://www.zerochan.net/search?q=${encodeURIComponent(search)}`;
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            // Kumpulkan semua link detail dari hasil pencarian
            const detailUrls = [];
            $('.thumb img').each((index, element) => {
                const href = $(element).closest('a').attr('href');
                if (href) detailUrls.push(`https://www.zerochan.net${href}`);
            });

            // Fetch semua detail (parallel dengan Promise.all)
            const results = await Promise.all(
                detailUrls.map(this.#fetchDetail)
            );

            // Filter hasil yang berhasil
            return results.filter(item => item !== null);
        } catch (error) {
            console.error('Search Error:', error.message);
            return [];
        }
    }

    // Tetap expose detail() jika ingin panggil manual
    detail = async function (url) {
        return await this.#fetchDetail(url);
    }
}

module.exports = new Zerochan();
