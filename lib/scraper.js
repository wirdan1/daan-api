const path = require('node:path');
const fs = require('node:fs');
const { promisify } = require('node:util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const Scandir = async (dir) => {
    let subdirs = await readdir(path.resolve(dir));
    let files = await Promise.all(
        subdirs.map(async (subdir) => {
            let res = path.resolve(path.resolve(dir), subdir);
            return (await stat(res)).isDirectory() ? Scandir(res) : res;
        }),
    );
    return files.reduce((a, f) => a.concat(f), []);
};

class Scraper {
    #src;
    constructor(dir) {
        this.dir = dir;
        this.#src = {};
    }
    
  async #loadModule(filename) {
    const name = path.basename(filename).replace(/\.(js|mjs)$/, '');
    
    try {
      if (filename.endsWith('.mjs')) {
        // Dynamic import for ESM modules
        this.#src[name] = (await import(`file://${filename}`)).default
      } else if (filename.endsWith('.js')) {
        // Regular require for CommonJS
        if (require.cache[filename]) delete require.cache[filename];
        this.#src[name] = require(filename);
      }
    } catch (e) {
      console.log(chalk.red.bold(`- Gagal memuat Scraper ${name}: ${e.message}`));
      delete this.#src[name];
    }
  }

  load = async () => {
    let data = await Scandir("./lib/scrape_file");
    for (let filename of data) {
      if (filename.endsWith(".js") || filename.endsWith(".mjs")) {
        await this.#loadModule(filename);
      }
    }
    return this.#src;
  };
    
    list = () => this.#src;
}

module.exports = Scraper;
