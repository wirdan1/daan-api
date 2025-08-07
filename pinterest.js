const axios = require("axios");
const cheerio = require("cheerio");

const base = "https://www.pinterest.com";
const search = "/resource/BaseSearchResource/get/";

const headers = {
    'accept': 'application/json, text/javascript, */*, q=0.01',
    'referer': 'https://www.pinterest.com/',
    'user-agent': 'Postify/1.0.0',
    'x-app-version': 'a9522f',
    'x-pinterest-appstate': 'active',
    'x-pinterest-pws-handler': 'www/[username]/[slug].js',
    'x-pinterest-source-url': '/search/pins/?rs=typed&q=kucing%20anggora/',
    'x-requested-with': 'XMLHttpRequest'
}

async function getCookies() {
    try {
        const response = await axios.get(base);
        const setHeaders = response.headers['set-cookie'];
        if (setHeaders) {
            const cookies = setHeaders.map(cookieString => {
                const cp = cookieString.split(';');
                const cv = cp[0].trim();
                return cv;
            });
            return cookies.join('; ');
        }
        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

class Pinterest {
    search = async function(query) {
        if (!query) {
            return {
                result: {
                    message: "Bree, lu ngetik apa sih? Query nya literally kosong begini? Emangnya gua punya third eye buat nebak apa? Minimal effort lah ya 🙄✋"
                }
            };
        }

        try {
            const cookies = await getCookies();
            if (!cookies) {
                return {
                    result: {
                        message: "Cookies nya failed retrieve nih. Nanti lagi ae yak.."
                    }
                };
            }

            const params = {
                source_url: `/search/pins/?q=${query}`,
                data: JSON.stringify({
                    options: {
                        isPrefetch: false,
                        query: query,
                        scope: "pins",
                        bookmarks: [""],
                        no_fetch_context_on_resource: false,
                        page_size: 10
                    },
                    context: {}
                }),
                _: Date.now()
            };

            const {
                data
            } = await axios.get(`${base}${search}`, {
                headers: {
                    ...headers,
                    'cookie': cookies
                },
                params: params
            });

            const container = [];
            const results = data.resource_response.data.results.filter((v) => v.images?.orig);

            results.forEach((result) => {
                container.push({
                    id: result.id,
                    title: result.title || "",
                    description: result.description,
                    pin_url: `https://pinterest.com/pin/${result.id}`,
                    media: {
                        images: {
                            orig: result.images.orig,
                            small: result.images['236x'],
                            medium: result.images['474x'],
                            large: result.images['736x']
                        },
                        video: result.videos ? {
                            video_list: result.videos.video_list,
                            duration: result.videos.duration,
                            video_url: result.videos.video_url
                        } : null
                    },
                    uploader: {
                        username: result.pinner.username,
                        full_name: result.pinner.full_name,
                        profile_url: `https://pinterest.com/${result.pinner.username}`
                    }
                });
            });

            if (container.length === 0) {
                return {
                    result: {
                        message: `Anjir bree, literally gua kagak nemu apa2 buat input "${query}". Like seriously, searching skill lu perlu diimprove deh. No offense yak, but try harder gitu 🤪`
                    }
                };
            }

            return {
                pins: container
            };

        } catch (error) {
            return {
                result: {
                    message: "Servernya lagi chaos bree! Lu ganggu mulu sih, Servernya butuh break. Try again later yak 😂",
                    error: error
                }
            };
        }
    }

    download = async function(url) {
        try {
            let response = await axios
                .get(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                    },
                })
                .catch((e) => e.response);
            let $ = cheerio.load(response.data);
            let tag = $('script[data-test-id="video-snippet"]');
            if (tag.length > 0) {
                let result = JSON.parse(tag.text());
                if (
                    !result ||
                    !result.name ||
                    !result.thumbnailUrl ||
                    !result.uploadDate ||
                    !result.creator
                ) {
                    return {
                        msg: "- Data tidak ditemukan, coba pakai url lain"
                    };
                }
                return {
                    title: result.name,
                    thumb: result.thumbnailUrl,
                    upload: new Date(result.uploadDate).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                    }),
                    source: result["@id"],
                    author: {
                        name: result.creator.alternateName,
                        username: "@" + result.creator.name,
                        url: result.creator.url,
                    },
                    keyword: result.keywords ?
                        result.keywords.split(", ").map((keyword) => keyword.trim()) : [],
                    download: result.contentUrl,
                };
            } else {
                let json = JSON.parse($("script[data-relay-response='true']").eq(0).text());
                let result = json.response.data["v3GetPinQuery"].data;
                return {
                    title: result.title,
                    upload: new Date(result.createAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                    }),
                    source: result.link,
                    author: {
                        name: result.pinner.username,
                        username: "@" + result.pinner.username,
                    },
                    keyword: result.pinJoin.visualAnnotation,
                    download: result.imageLargeUrl,
                };
            }
        } catch (e) {
            return {
                msg: "Error coba lagi nanti"
            };
        }
    };
}

module.exports = new Pinterest();
