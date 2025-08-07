const axios = require('axios');

class Animob {
    constructor() {
        this.client = axios.create({
            baseURL: 'https://aniwatch-api-2-animob.vercel.app/api/v2',
            headers: {
                'accept-encoding': 'gzip',
                'user-agent': 'okhttp/4.9.2'
            }
        });
        this._client = axios.create({
            baseURL: 'https://animob-api-v4.vercel.app/api',
            headers: {
                'accept-encoding': 'gzip',
                'user-agent': 'okhttp/4.9.2'
            }
        });
    }
    
    home = async function () {
        try {
            const { data } = await this.client('/hianime/home');
            
            return data.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    genre = async function (genre = 'action', page = 1) {
        try {
            const _genre = ['action', 'adventure', 'cars', 'comedy', 'dementia', 'demons', 'drama', 'ecchi', 'fantasy', 'game', 'harem', 'historical', 'horror', 'isekai', 'josei', 'kids', 'magic', 'martial-arts', 'mecha', 'military', 'music', 'mystery', 'parody', 'police', 'psychological', 'romance', 'samurai', 'school', 'sci-fi', 'seinen', 'shoujo', 'shoujo-ai', 'shounen', 'shounen-ai', 'slice-of-life', 'space', 'sports', 'super-power', 'supernatural', 'thriller', 'vampire'];
            if (!_genre.includes(genre)) throw new Error(`Available genres: ${_genre.join}`);
            
            const { data } = await this.client(`/hianime/genre/${genre}`, {
                params: {
                    page: page
                }
            });
            
            return data.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    search = async function (query, page = 1) {
        try {
            if (!query) throw new Error('Query is required');
            
            const { data } = await this.client('/hianime/search', {
                params: {
                    q: query,
                    page: page
                }
            });
            
            return data.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    detail = async function (id) {
        try {
            if (!id) throw new Error('Id is required');
            
            const { data } = await this.client(`/hianime/anime/${id}`);
            const { data: ep } = await this.client(`/hianime/anime/${id}/episodes`);
            
            return {
                ...data.data.anime,
                episodes: ep.data
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    episode = async function (episodeId, server = 'HD-1') {
        try {
            const { data: sv } = await this._client(`/servers/${episodeId}`);
            const _server = sv.results.map(s => s.serverName);
            
            if (!episodeId || !episodeId.includes('?ep=')) throw new Error('Invalid episode id');
            if (!_server.includes(server)) throw new Error(`Available servers: ${_server.join(', ')}`);
            
            const { data } = await this._client(`/stream`, {
                params: {
                    id: episodeId,
                    server: server,
                    type: sv.results.find(s => s.serverName === server).type
                }
            });
            
            return data.results;
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

module.exports = new Animob();
