

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

const API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SITE_NAME = 'OpenRouter';

if (!API_KEY) {
    console.error("⚠️ OPENROUTER_API_KEY is missing. Check your .env file.");
    process.exit(1);
}

async function getAIResponse(userMessage) {
    try {
        if (!userMessage) {
            throw new Error("User message is required.");
        }

        const isDetailedQuery = userMessage.toLowerCase().includes("explain in detail") || 
                                userMessage.toLowerCase().includes("how does it work in depth?") || 
                                userMessage.toLowerCase().includes("step-by-step") ||
                                userMessage.toLowerCase().includes("detailed process") ||
                                userMessage.toLowerCase().includes("full explanation") ||
                                userMessage.toLowerCase().includes("describe fully") ||
                                userMessage.toLowerCase().includes("technical explanation");

        const maxTokens = isDetailedQuery ? 1800 : 200;

        const prompt = `You are a **solar energy expert**. Your goal is to provide **the most accurate and structured response possible**.

        - **For Beginners:** Give a short, simple explanation (2-3 sentences).
        - **For Technical Users:** If a detailed response is requested, provide a **FULL STRUCTURED STEP-BY-STEP EXPLANATION**.
        - **DO NOT summarize when a detailed explanation is needed. Always provide depth.**
        - **Use bullet points, numbering, and formatting for clarity.**
        - **Ensure the response is complete, technically accurate, and well-structured.**

        **User Query:** ${userMessage}
        **Mode Detected:** ${isDetailedQuery ? "DETAILED MODE - Full technical explanation required." : "CONCISE MODE - Short answer only."}

        **Assistant Response:** ${isDetailedQuery ? `

        🔹 **Complete Breakdown of How Solar Panels Work**

        **1 What is a Solar Panel?**
        - A **solar panel** (photovoltaic module) is a device that converts **sunlight into electricity** using semiconductor materials like silicon.

        **2 Key Components of a Solar Panel**
        - **Photovoltaic (PV) Cells:** Convert sunlight into electrical energy.
        - **Glass Cover:** Protects solar cells while allowing maximum light absorption.
        - **Encapsulant Layer:** Prevents moisture damage and enhances durability.
        - **Backsheet:** Acts as insulation and provides mechanical protection.
        - **Aluminum Frame:** Gives structure and rigidity.
        - **Junction Box & Wiring:** Connects the panel to the electrical system.

        **3 Step-by-Step Process of How Solar Panels Work**
        1 **Photon Absorption:** Sunlight (photons) hits the photovoltaic (PV) cells.
        2 **Electron Excitation:** The photons transfer energy to electrons in the silicon, making them move freely.
        3 **Electric Field Formation:** The PV cells have a built-in electric field that directs electron movement.
        4 **Direct Current (DC) Generation:** This movement of electrons generates **direct current (DC)** electricity.
        5 **DC to AC Conversion:** An **inverter** converts DC electricity into **alternating current (AC)**, which is used in homes and businesses.
        6 **Power Distribution:** The AC electricity is used to power household appliances or sent to the power grid.
        7 **Energy Storage (If Applicable):** Extra electricity is stored in **solar batteries** for later use.
        8 **Net Metering (If Connected to Grid):** Excess electricity sent back to the grid earns energy credits.

         **This process makes solar panels an efficient source of clean, renewable energy.**
        
        **End of Detailed Explanation.**` : ""}`;

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

        return response.data.choices[0]?.message?.content?.trim() || "No relevant data found.";
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        return `Error: ${JSON.stringify(error.response?.data) || error.message}`;
    }
}


app.post('/ask', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const answer = await getAIResponse(message);
        res.json({ response: answer });
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
