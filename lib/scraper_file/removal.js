const fetch = require('node-fetch')

const removal = {
    // fetch boilerplate lol
    _hit: async (url, fetchName = "lu lupa isi fetch name", returnType = "text", opts = {}) => {
        const r = await fetch(url, opts)
        if (!r.ok) throw Error(`fetch fail\n${r.status} ${r.statusText}\nat: ${fetchName}\nnih text nya: ${await r.text() || null}`)
        try {
            if (returnType == "json") return await r.json()
            return await r.text()
        } catch (err) {
            throw Error(`fetch berhasil tapi gagal convert ke json\n${err.message}\nat: ${fetchName}\nnih text nya :${await r.text() || null}`)
        }
    },
 
    // function buat bikin formdata gw hardcode >:v
    _formData: (imageBuffer) => {
        const randomBoundary = "----WebKitFormBoundary" + Math.random().toString(32).slice(2)
        const buffers = []
        buffers.push(Buffer.from("--" + randomBoundary + "\r\nContent-Disposition: form-data; name=\"image_file\"; filename=\"Untitled-1_magicstudio_" + Math.random().toString(32).slice(2) + ".png\"\r\nContent-Type: image/png\r\n\r\n"))
        buffers.push(imageBuffer)
        buffers.push(Buffer.from("\r\n--" + randomBoundary + "--\r\n"))
        const body = Buffer.concat(buffers)
        const formDataHeaders = { "content-type": "multipart/form-data; boundary=" + randomBoundary }
        return { formDataHeaders, body }
    },
 
    // function buat dapetin web token, kalau berhasil bakalan return string kayak b42622b7fe912a89fd27646476fe4eab
    getWebToken: async () => {
        // fetch home page
        const html = await removal._hit("https://removal.ai/", "hit homepage")
        const match = html.match(/var ajax_upload_object = (.*?);/)?.[1]
        if (!match) throw Error(`tidak menemukan match pada homepage`)
        const { webtoken_url, security } = JSON.parse(match)
 
        // second fetch to get Web-Token
        const webTokenUrl = `${webtoken_url}?action=ajax_get_webtoken&security=${security}`
        const json = await removal._hit(webTokenUrl, "mendapatkan web token", "json")
        const webToken = json?.data?.webtoken
        if (!webToken) throw Error(`berhasil hit url web token tapi gak ada token nya`)
        return webToken
    },
 
    // main function
    removeBackground: async (imageBuffer) => {
 
        const { formDataHeaders, body } = removal._formData(imageBuffer)
        
        const headers = {
            "web-token": await removal.getWebToken(),
            ...formDataHeaders
        }
 
        const opts = {
            headers,
            body,
            "method": "POST"
        }
 
        const result = await removal._hit("https://api.removal.ai/3.0/remove", "remove background", "json", opts)
        return result
    }
}
 
module.exports = removal;
