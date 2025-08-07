import file from 'file-type';
import axios from 'axios';

async function upscale(buffer) {
    const { ext, mime } = await file.fromBuffer(buffer)
    const fileName = Math.random().toString(36).slice(2, 8) + '.' + ext

    const {
        data
    } = await axios.post("https://pxpic.com/getSignedUrl", {
        folder: "uploads",
        fileName
    }, {
        headers: {
            "Content-Type": "application/json"
        }
    })

    await axios.put(data.presignedUrl, buffer, {
        headers: {
            "Content-Type": mime
        }
    })
    const url = "https://files.fotoenhancer.com/uploads/" + fileName

    const api = await (await axios.post("https://pxpic.com/callAiFunction", new URLSearchParams({
        imageUrl: url,
        targetFormat: 'png',
        needCompress: 'no',
        imageQuality: '100',
        compressLevel: '6',
        fileOriginalExtension: 'png',
        aiFunction: 'upscale',
        upscalingLevel: ''
    }).toString(), {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
            'Content-Type': 'application/x-www-form-urlencoded',
            'accept-language': 'id-ID'
        }
    }).catch(e => e.response)).data;

    const formatSize = size => {
        function round(value, precision) {
            var multiplier = Math.pow(10, precision || 0);
            return Math.round(value * multiplier) / multiplier;
        }
        var kiloByte = 1024;
        var megaByte = kiloByte * kiloByte;
        var gigaByte = kiloByte * megaByte;
        var teraByte = kiloByte * gigaByte;
        if (size < kiloByte) {
            return size + "B";
        } else if (size < megaByte) {
            return round(size / kiloByte, 1) + "KB";
        } else if (size < gigaByte) {
            return round(size / megaByte, 1) + "MB";
        } else if (size < teraByte) {
            return round(size / gigaByte, 1) + "GB";
        } else {
            return round(size / teraByte, 1) + "TB";
        }
    };

    const buffersize = await (await axios.get(api.resultImageUrl, {
        responseType: 'arraybuffer'
    }).catch(e => e.response)).data;
    const size = await formatSize(buffer.length);
    return {
        status: 200,
        success: true,
        result: {
            size,
            imageUrl: api.resultImageUrl
        }
    }
}

export default upscale;
