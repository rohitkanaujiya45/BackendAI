require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SITE_NAME = 'OpenRouter';

if (!API_KEY) {
    console.error("⚠️ OPENROUTER_API_KEY is missing. Check your .env file.");
}

exports.handler = async (event) => {
    try {
        const { message } = JSON.parse(event.body);

        if (!message) {
            return { statusCode: 400, body: JSON.stringify({ error: "Message is required" }) };
        }

        const isDetailedQuery = message.toLowerCase().includes("explain in detail") ||
                                message.toLowerCase().includes("how does it work in depth?") ||
                                message.toLowerCase().includes("step-by-step") ||
                                message.toLowerCase().includes("detailed process") ||
                                message.toLowerCase().includes("full explanation") ||
                                message.toLowerCase().includes("describe fully") ||
                                message.toLowerCase().includes("technical explanation");

        const maxTokens = isDetailedQuery ? 1800 : 200;

        const prompt = `You are a **solar energy expert**. Your goal is to provide **the most accurate and structured response possible**.

        - **For Beginners:** Give a short, simple explanation (2-3 sentences).
        - **For Technical Users:** If a detailed response is requested, provide a **FULL STRUCTURED STEP-BY-STEP EXPLANATION**.
        - **DO NOT summarize when a detailed explanation is needed. Always provide depth.**
        - **Use bullet points, numbering, and formatting for clarity.**
        - **Ensure the response is complete, technically accurate, and well-structured.**

        **User Query:** ${message}
        **Mode Detected:** ${isDetailedQuery ? "DETAILED MODE - Full technical explanation required." : "CONCISE MODE - Short answer only."}

        **Assistant Response:**`;

        const response = await axios.post(
            SITE_URL,
            {
                model: 'google/gemini-2.0-pro-exp-02-05:free',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: 0.6,
                top_p: 0.9
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': SITE_URL,
                    'X-Title': SITE_NAME
                },
                timeout: 30000
            }
        );

        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
            throw new Error("No valid response received from AI.");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ response: response.data.choices[0]?.message?.content?.trim() || "No relevant data found." })
        };

    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.response?.data || error.message })
        };
    }
};
