import SpotifyWebApi from 'spotify-web-api-node';
import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import FileType from 'file-type';

const spotifyApi = new SpotifyWebApi({
  clientId: 'acc6302297e040aeb6e4ac1fbdfd62c3',
  clientSecret: '0e8439a1280a43aba9a5bc0a16f3f009',
})
function extractTrackId(url) {
  const regex = /^https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)(?!\?is=)/;
  const match = url.match(regex)
  return match ? match[1] : null
}
const client_id = "acc6302297e040aeb6e4ac1fbdfd62c3";
const client_secret = "0e8439a1280a43aba9a5bc0a16f3f009";
const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

async function spotifyCreds() {
    try {
        const response = await axios.post(
            TOKEN_ENDPOINT,
            "grant_type=client_credentials", {
                headers: {
                    Authorization: "Basic " + basic
                },
            },
        );
        return {
            status: true,
            data: response.data,
        };
    } catch (error) {
        return {
            status: false,
            msg: "Failed to retrieve Spotify credentials."
        };
    }
}

const toTime = (ms) => {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
};

class Spotify {
    search = async function(query, type = "track", limit = 20) {
        try {
            const creds = await spotifyCreds();
            if (!creds.status) return creds;

            const response = await axios.get(
                `https://api.spotify.com/v1/search?query=${encodeURIComponent(query)}&type=${type}&offset=0&limit=${limit}`, {
                    headers: {
                        Authorization: "Bearer " + creds.data.access_token
                    },
                },
            );

            if (
                !response.data[type + "s"] ||
                !response.data[type + "s"].items.length
            ) {
                return {
                    msg: "Music not found!"
                };
            }

            return response.data[type + "s"].items.map((item) => ({
                title: item.name,
                id: item.id,
                duration: toTime(item.duration_ms),
                artist: item.artists.map((artist) => artist.name).join(" & "),
                url: item.external_urls.spotify,
            }));
        } catch (error) {
            return {
                status: false,
                msg: "Error searching for music. " + error.message,
            };
        }
    };

    download = async function spotifydl(url, quality = 'm4a') {
        try {
            let trackId = extractTrackId(url)
            if (!trackId) throw new Error("Invalid Spotify URL. Cannot extract track ID.");

            const tokenData = await spotifyApi.clientCredentialsGrant()
            spotifyApi.setAccessToken(tokenData.body['access_token'])

            const trackData = await spotifyApi.getTrack(trackId)
            const info = trackData.body
            let result = await axios.get(`https://cdn-spotify.zm.io.vn/download/${info.id}/${info.external_ids?.isrc}?name=${encodeURIComponent(info.name)}`, {
                responseType: 'arraybuffer'
            }).then(a => a.data);

            const fileType = await FileType.fromBuffer(result);
            if (!fileType || !fileType.ext) {
                throw new Error('Cannot determine file type');
            }

            const fileName = `${info.name || ''} - ${info.artists.map(a => a.name).join(', ') || ''}.${fileType.ext}`;
            const safeFileName = fileName.replace(/[\/\\?%*:|"<>]/g, '');
            const filePath = path.join('/tmp', safeFileName);

            await fs.writeFile(filePath, result);

            setTimeout(() => {
                fs.unlink(filePath).catch(() => {});
            }, 5 * 60 * 1000);

            return {
                id: info.id,
                title: info.name,
                artists: info.artists.map(a => a.name).join(', '),
                album: info.album.name,
                release_date: info.album.release_date,
                duration_ms: info.duration_ms,
                preview_url: info.preview_url,
                image: info.album.images[0]?.url || null,
                external_url: info.external_urls.spotify,
                download: `https://izumi-apis.aetherrr.biz.id/download?file=${encodeURIComponent(safeFileName)}`,
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            }
        } catch (err) {
            console.error('Gagal mengambil metadata:', err.message)
            return err.message
        }
    }
}

export default new Spotify()
