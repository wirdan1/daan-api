const axios = require('axios')
const cheerio = require('cheerio')

class Komiku {
  constructor() {
    this.baseURL = "https://komiku.id", this.dataBaseURL = "https://data.komiku.id";
  }
  latest = () => {
    return new Promise(async (resolve, reject) => {
      const {
        data
      } = await axios.get(this.baseURL).catch(e => e?.response);
      const $ = cheerio.load(data);
      const result = $("#Terbaru > div.ls4w > .ls4").map((_, e) => {
        return {
          title: $(e).find("div.ls4j > h4 a").text(),
          chapter: $("div.ls4j > .ls24").map((_, e) => $(e).text().trim()).get(),
          img: $(e).find("div.ls4v > a img").attr("data-src"),
          link: this.baseURL + $(e).find("div.ls4v > a").attr("href")
        };
      }).get();
      resolve(result);
    });
  };
  search = query => {
    return new Promise(async (resolve, reject) => {
      const {
        data
      } = await axios.get(this.dataBaseURL + "/cari/?post_type=manga&s=" + query).catch(e => e?.response);
      const $ = cheerio.load(data);
      const result = $("div.daftar > div.bge").map((_, el) => {
        return {
          title: $(el).find("div.kan > a h3").text().trim(),
          img: $(el).find("div.bgei > a img").attr("data-src"),
          chapter: {
            awal: $(el).find("div.kan > div.new1 > a > span").eq(1).text(),
            akhir: $(el).find("div.kan > div.new1 > a > span").eq(3).text()
          },
          link: $(el).find("div.bgei > a").attr("href")
        };
      }).get();
      resolve(result);
    });
  };
  detail = url => {
    return new Promise(async (resolve, reject) => {
      const {
        data
      } = await axios.get(url).catch(e => e?.response);
      const $ = cheerio.load(data);
      const result = {};
      result.title = $("#Judul > h1").text().trim();
      result.img = $("div.ims > img").attr("src");
      result.metadata = {};
      $(".inftable tbody tr").each((a, b) => {
        const param = $(b).find("td:first-child").text().replace(/ /g, "_").toLowerCase();
        const value = $(b).find("td:nth-child(2)").text().trim();
        result.metadata[param] = value;
      });
      result.metadata.genre = $("#Informasi > .genre li").map((a, b) => $(b).find("a").text().trim()).get();
      result.sinopsis = $(".desc").text().replace(/\n/g, "").trim();
      result.chapters = [];
      $("#Daftar_Chapter tbody tr").each((a, b) => {
        const chapter = $(b).find("td:first-child > a span").text().trim();
        const title = $(b).find("td:first-child > a").attr("title");
        const upload = $(b).find("td:nth-child(2)").text().trim();
        const url = this.baseURL + $(b).find("td:first-child > a").attr("href");
        if (chapter !== "" && title !== undefined && upload !== "" && url !== this.baseURL + "undefined") {
          result.chapters.push({
            chapter: chapter,
            title: title,
            upload: upload,
            url: url
          });
        }
      });
      resolve(result);
    });
  };
  getChapter = url => {
    return new Promise(async (resolve, reject) => {
      const {
        data
      } = await axios.get(url).catch(e => e?.response);
      const $ = cheerio.load(data);
      const result = {};
      result.title = $(".content > #Judul h1").eq(0).text().trim();
      result.images = [];
      $("#Baca_Komik img").each((a, b) => {
        result.images.push({
          id: $(b).attr("id"),
          title: $(b).attr("alt"),
          url: $(b).attr("src")
        });
      });
      resolve(result);
    });
  };
}

module.exports = new Komiku()
