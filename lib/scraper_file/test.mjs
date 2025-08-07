import axios from 'axios';

/*
 * @class Cobalt
 * @classdesc Kelas untuk mengelola unduhan dari dl@s.yt-dl.click.
 * Credit: By Nyxz / https://whatsapp.com/channel/0029VaAMjXT4yltWm1NBJV3J
 */
class Cobalt {
    /*
     * @constructor
     * @description Inisialisasi konfigurasi dasar untuk kelas Cobalt.
     */
    constructor() {
        /*
         * @type {string}
         * @description URL dasar untuk API unduhan.
         */
        this.baseurl = "https://dl@s.yt-dl.click";
        /*
         * @type {object}
         * @description Konfigurasi Axios untuk melakukan permintaan HTTP.
         * @property {object} headers - Header yang digunakan dalam permintaan.
         * @property {string} headers["Content-Type"] - Tipe konten permintaan.
         * @property {string} headers.Accept - Tipe konten yang diterima.
         */
        this.axios_config = {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        };
        /*
         * @type {object}
         * @description Format audio dan video yang tersedia untuk diunduh.
         * @property {string[]} audio - Daftar format audio yang tersedia.
         * @property {string[]} video - Daftar format video yang tersedia.
         */
        this.format = {
            audio: ["320k", "256k", "128k", "96k", "64k", "8k"],
            video: ["max", "4320", "2160", "1440", "1080", "720", "480", "360", "240", "144"]
        };
        /*
         * @type {object}
         * @description Batasan server yang digunakan untuk mengunduh.
         * @property {number} min - ID server minimum.
         * @property {number} max - ID server maksimum.
         */
        this.server = {
            min: 4,
            max: 36
        };
    }

    /*
     * @function getRandom
     * @description Menghasilkan angka acak dalam rentang tertentu.
     * @param {number} min - Nilai minimum rentang.
     * @param {number} max - Nilai maksimum rentang.
     * @returns {number} Angka acak antara min dan max (inklusif).
     */
    getRandom(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /*
     * @function getServer
     * @description Mendapatkan URL server acak berdasarkan konfigurasi.
     * @returns {string} URL server yang dipilih secara acak.
     */
    getServer() {
        const id = this.getRandom(this.server.min, this.server.max).toString().padStart(2, '0');
        return this.baseurl.replace('@s', id);
    }

    /*
     * @async
     * @function download
     * @description Mengunduh file audio atau video dari URL yang diberikan.
     * @param {string} url - URL video atau audio yang akan diunduh.
     * @param {string} [type="audio"] - Tipe file yang akan diunduh ("audio" atau "video").
     * @param {string} [format="128"] - Format kualitas file yang akan diunduh.
     * @param {number} [retry=5] - Jumlah percobaan ulang jika unduhan gagal.
     * @returns {Promise<object>} Objek yang berisi status, data, server, dan jumlah percobaan.
     * @throws {Error} Jika terjadi kesalahan selama proses pengunduhan.
     */
    download = async function(url, type = "audio", format = "128k", retry = 1000) {
        try {
            if (type === "audio") {
                if (!this.format.audio.includes(format)) {
                    return {
                        status: false,
                        msg: "Format audio yang dipilih tidak valid",
                        available_formats: this.format.audio
                    };
                }
            } else if (type === "video") {
                if (url.includes('youtu') && !this.format.video.includes(format)) {
                    return {
                        status: false,
                        msg: "Format video yang dipilih tidak valid",
                        available_formats: this.format.video
                    };
                }
            } else {
                return {
                    status: false,
                    msg: "Tipe harus berupa 'audio' atau 'video'"
                };
            }

            let payload = {
                url: url,
                filenameStyle: "pretty"
            };

            if (type === "audio") {
                payload = {
                    ...payload,
                    audioBitrate: format,
                    downloadMode: "audio",
                    audioFormat: "mp3"
                };
            } else {
                payload = {
                    ...payload,
                    videoQuality: format,
                    downloadMode: "auto"
                };
            }

            let attempt = 0;
            let error = null;

            while (attempt < retry) {
                try {
                    const api_url = this.getServer();
                    const response = await axios.post(api_url, payload, this.axios_config);

                    return {
                        status: true,
                        data: response.data,
                        server: api_url,
                        attempt: attempt + 1
                    };
                } catch (err) {
                    error = err;
                    attempt++;

                    if (attempt < retry) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }

            return {
                status: false,
                msg: `Gagal mencoba ${retry} kali, Eror: ${error.message}`
            };
        } catch (e) {
            return {
                status: false,
                msg: `Terjadi kesalahan, pesan eror: ${e.message}`
            };
        }
    }
}

export default new Cobalt();
