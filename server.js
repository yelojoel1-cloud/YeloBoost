const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();

/* =======================
   MIDDLEWARE
======================= */
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* =======================
   GEMINI SETUP
======================= */
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ GEMINI_API_KEY manquante");
}

const ai = new GoogleGenAI({ apiKey });

/* =======================
   TEST ROUTE
======================= */
app.get("/", (req, res) => {
    res.json({ status: "YELOX ONLINE 🚀" });
});

/* =======================
   GENERATE TEXT
======================= */
app.post("/generate", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt requis" });
        }

        const system = `
Tu es YELOX, IA de No Flop Studio à Abidjan.
Tu aides en marketing, branding et contenu digital.
Réponses claires, structurées et professionnelles.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                { role: "user", parts: [{ text: system }] },
                { role: "model", parts: [{ text: "YELOX activé." }] },
                { role: "user", parts: [{ text: prompt }] }
            ]
        });

        res.json({
            result: response.text || "Pas de réponse"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Erreur serveur YELOX"
        });
    }
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 YELOX ONLINE sur port ${PORT}`);
});