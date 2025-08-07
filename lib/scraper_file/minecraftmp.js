const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://minecraft-mp.com/ajax.php';

// Function to scrape the data
async function minecraftmp(opsi = {}) {
  const requestData = {
     action: opsi.action || 'search',
     keyword: opsi.query || '',
     version: opsi.version || '',
     country: opsi.country || '',
     private: opsi.private || 'all',
     theme: opsi.theme || '',
     players_operator: opsi.plaop || '',
     players_count: opsi.placo || '',
     ping_operator: opsi.pinop || '',
     ping_count: opsi.plnco || '',
     ping_location: opsi.location || '',
     maxplayers_operator: opsi.mxplaop || '',
     maxplayers_count: opsi.mxplaco || '',
     orderby: opsi.orderby || 'rank',
     orderway: opsi.orderway || 'asc',
     teamspeak: opsi.teamspeak || 0,
     discord: opsi.discord || 0,
     flag_adult: opsi.flagadu || 0,
     flag_adventure: opsi.flagadv || 0,
     // ... (include all other flags as in the original request)
     flag_vanilla: opsi.flagvan || 0,
     flag_vehicle: opsi.flagvehi || 0,
     flag_war: opsi.flagwar || 0,
     flag_waterfall: opsi.flagwat || 0,
     flag_whitelist: opsi.flagwhite || 0,
     flag_zombie: opsi.flagzom || 0
  };
  
  try {
    // Send POST request with Axios
    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // Check if response contains results
    if (response.data.state === 'error' && response.data.results) {
      const $ = cheerio.load(response.data.results); // Load HTML into Cheerio
      const servers = [];

      // Iterate through each table row
      $('tbody tr').each((index, element) => {
        const server = {};

        // Extract Rank
        server.rank = $(element).find('td.hidden-xs strong').text().trim();

        // Extract Server Address
        server.address = $(element).find('td .btn-group a strong').text().trim();

        // Extract Version
        server.version = $(element).find('td a.btn-info.btn-sm').text().trim();

        // Extract Country
        server.country = $(element).find('td img[alt]').attr('alt') || 'N/A';

        // Extract Status
        server.status = $(element).find('td button').text().trim();

        // Extract Players
        server.players = $(element).find('td.hidden-xs').eq(1).text().trim();

        // Extract Tags
        server.tags = [];
        $(element).find('td.hidden-xs .badge').each((i, tag) => {
          server.tags.push($(tag).text().trim());
        });

        // Extract Favicon
        server.favicon = $(element).find('td img[src*="favicon"]').attr('src') || 'N/A';

        // Extract Banner (if available)
        server.banner = $(element).find('td video[src]').attr('src') || 'N/A';

        // Extract Details Page Link
        server.detailsPage = $(element).find('td a[href*="/server-s"]').attr('href') || 'N/A';

        servers.push(server);
      });

      return servers
    } else {
      console.log('No results found or unexpected response format');
    }

  } catch (error) {
    console.error('Error during scraping:', error.message);
  }
};

module.exports = minecraftmp;
