const axios = require('axios');

async function groqAi(model, messageArray = [{ }]) {
    return new Promise(async (resolve, reject) => {
        try {
            const modelMap = new Map([
                // Groq Internal
                [1, 'compound-beta'],
                [2, 'compound-beta-mini'],

                // DeepSeek / Meta
                [3, 'deepseek-r1-distill-llama-70b'],

                // Google
                [4, 'gemma2-9b-it'],

                // Hugging Face / OpenAI
                [5, 'distil-whisper-large-v3-en'],
                [6, 'whisper-large-v3'],
                [7, 'whisper-large-v3-turbo'],

                // Meta
                [8, 'llama3-8b-8192'],
                [9, 'llama3-70b-8192'],
                [10, 'llama-3.1-8b-instant'],
                [11, 'llama-3.3-70b-versatile'],
                [12, 'meta-llama/llama-4-maverick-17b-128e-instruct'],
                [13, 'meta-llama/llama-4-scout-17b-16e-instruct'],
                [14, 'meta-llama/llama-guard-4-12b'],
                [15, 'meta-llama/llama-prompt-guard-2-22m'],
                [16, 'meta-llama/llama-prompt-guard-2-86m'],

                // Mistral
                [17, 'mistral-saba-24b'],

                // PlayAI
                [18, 'playai-tts'],
                [19, 'playai-tts-arabic']
            ]);

            // ✅ Validasi ID Model
            if (!model || typeof model !== 'number') {
                const choices = [...modelMap.entries()]
                    .map(([num, name]) => `${num}. ${name}`)
                    .join('\n');
                throw `❌ Masukkan angka model yang valid.\n\nContoh: 11\n\nPilihan Tersedia:\n${choices}`;
            }

            const selectedModel = modelMap.get(model);
            if (!selectedModel) {
                const choices = [...modelMap.entries()]
                    .map(([num, name]) => `${num}. ${name}`)
                    .join('\n');
                throw `❌ Model tidak ditemukan!\n\nPilihan Tersedia:\n${choices}`;
            }

            // ✅ Validasi Message Array
            if (!Array.isArray(messageArray) || messageArray.length === 0 || !messageArray[0]?.content) {
                throw `❌ Masukkan messageArray yang valid. Contoh:\n[{ role: "user", content: "Halo!" }]`;
            }

            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: selectedModel,
                messages: messageArray
            }, {
                headers: {
                    "Authorization": "Bearer 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",
                    "Content-Type": "application/json"
                }
            });

            resolve({
                status: true,
                result: response.data.choices[0].message
            });

        } catch (err) {
            reject({
                status: false,
                msg: typeof err === 'string' ? err : '❌ Maaf Error, mungkin kebanyakan request.',
                error: err
            });
            console.error('Groq Error:', err);
        }
    });
}

module.exports = groqAi;
