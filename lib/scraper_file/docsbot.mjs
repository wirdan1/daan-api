import axios from 'axios';
import ua from 'user-agents';

async function docsbot(buffer, {
    type = 'ocr',
    vibe = 'fun'
} = {}) {
    const vibeList = ['fun', 'joke', 'funny', 'happy', 'serious', 'sad', 'angry', 'ecstatic', 'curious', 'informative', 'cute', 'cool', 'controversial'];
    const typeList = ['ocr', 'toprompt', 'todesc', 'tocaption'];

    if (!type || !typeList.includes(type)) throw new Error(`List available type: ${typeList.join(', ')}`);
    if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('Image buffer is required');
    if (type === 'tocaption' && !vibeList.includes(vibe)) throw new Error(`List available vibe: ${vibeList.join(', ')}`);

    const {
        data
    } = await axios.post(`https://docsbot.ai/api/tools/image-prompter`, {
        image: buffer.toString('base64'),
        type: type === 'toprompt' ? 'prompt' : type === 'todesc' ? 'description' : type === 'ocr' ? 'text' : 'caption',
        ...(type === 'tocaption' && {
            vibe
        })
    }, {
        headers: {
            'content-type': 'application/json',
            'user-agent': (new ua()).toString()
        }
    }).catch(error => {
        throw new Error('No result found')
    });

    return data;
}

export default docsbot;
