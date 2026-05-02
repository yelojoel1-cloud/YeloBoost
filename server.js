const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = process.env.PORT || 3000;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("ATTENTION : GEMINI_API_KEY est introuvable dans le fichier .env");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

// Tableau pour stocker l'historique de la conversation en mémoire
let conversationHistory = [];

app.post("/generate", async (req, res) => {
    try {
        const { prompt } = req.body;

        let modelName = "gemini-2.5-flash";
        console.log(`Tentative de connexion avec le noyau principal : ${modelName}`);

        let contents = [];

        // 🟢 C'EST ICI QU'IL FAUT COLLER LE NOUVEAU TEXTE
        const systemInstruction = `
Agis en tant que YELOX, l'intelligence artificielle et l'extension numérique du savoir-faire de No Flop Studio, dirigé par Yelo. Tu es un expert en marketing digital, en stratégie social media et en branding, basé à Abidjan, en Côte d'Ivoire. Ton objectif est d'aider les créateurs de contenu, artistes, e-commerçants et entrepreneurs à percer sur les réseaux sociaux et à développer leurs ventes sans laisser de place au hasard.

Lorsqu'un utilisateur ou un client te demande de l'aide pour un projet (création de contenu, identité visuelle, ou stratégie), tu dois structurer ta réponse de manière claire, professionnelle et encourageante, selon les 3 parties suivantes :

1. IDÉATION ET SCÉNARIO DÉTAILLÉ
- Développe un concept clair, accrocheur et adapté à la thématique de l'utilisateur.
- Propose un découpage chronologique du scénario seconde par seconde :
    * 0 à 5 secondes (L'Accroche) : Le message fort qui retient l'attention immédiate.
    * 5 à 20 secondes (Le Développement / Problème) : L'explication claire du sujet abordé.
    * 20 à 45 secondes (La Solution) : La proposition de valeur ou le produit.
    * 45 à 60 secondes (L'Appel à l'Action) : Ce que le spectateur doit faire concrètement.
- Ajoute des notes de mise en scène (ton, posture, émotions à dégager).

2. GUIDE TECHNIQUE ET QUALITÉ
- Adapte tes recommandations selon la plateforme cible :
    * TikTok : Format vertical (9:16), rythme très dynamique, sous-titres visibles, musique tendance.
    * Instagram (Reels) : Format vertical (9:16), image HD, éclairage professionnel et son clair.
    * YouTube (Shorts / Vidéos longues) : Format (9:16) ou horizontal (16:9), vignette (thumbnail) claire et engageante.

3. OPTIMISATION SOCIAL MEDIA ET SEO
- Rédige une légende (caption) percutante avec des émojis pertinents.
- Fournis une liste de hashtags optimisés pour le marché local et international (ex: #Abidjan #225 #No Flop Studio).

En conclusion de chaque réponse, rappelle brièvement que YELOX est la solution de No Flop Studio pour propulser leur projet, et invite l'utilisateur à affiner son concept.
`;
        // 1. Instructions système
        contents.push({
            role: "user",
            parts: [{ text: "Consigne système : " + systemInstruction }]
        });
        contents.push({
            role: "model",
            parts: [{ text: "Identité YELOX activée. Prêt pour l'optimisation." }]
        });

        // 2. Injection de l'historique mémorisé
        if (conversationHistory && conversationHistory.length > 0) {
            conversationHistory.forEach(msg => {
                contents.push({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                });
            });
        }

        // 3. Ajout du nouveau message de l'utilisateur
        contents.push({
            role: "user",
            parts: [{ text: prompt || "Analyse cette requête selon tes protocoles." }]
        });

        let response;
        try {
            response = await ai.models.generateContent({
                model: modelName,
                contents: contents,
                config: {
                    temperature: 0.6,
                    maxOutputTokens: 4000
                }
            });
        } catch (err) {
            // Si le modèle principal est saturé, on bascule vers le modèle léger ou on intercepte l'erreur
            if (err.message && err.message.includes("quota")) {
                console.warn("Modèle principal saturé. Basculement vers gemini-2.0-flash-lite...");
                modelName = "gemini-2.0-flash-lite";

                try {
                    response = await ai.models.generateContent({
                        model: modelName,
                        contents: contents,
                        config: {
                            temperature: 0.6,
                            maxOutputTokens: 2000
                        }
                    });
                } catch (secondaryErr) {
                    if (secondaryErr.message && secondaryErr.message.includes("quota")) {
                        console.warn("Quota du plan gratuit épuisé. Envoi d'une réponse de secours...");
                        return res.json({
                            result: `<div class="p-6 bg-gray-900 border border-red-500/30 rounded-2xl text-red-400">
                                <h4 class="font-bold text-lg mb-2">⚠️ Noyau YELOX - Limite atteinte</h4>
                                <p class="text-sm mb-4">Le quota de requêtes gratuites (Free Tier) est épuisé pour aujourd'hui. En tant qu'infographe polyvalent, vous pouvez continuer manuellement vos projets avec le prompt ci-dessous :</p>
                                <blockquote class="border-l-4 border-red-500 pl-4 italic text-gray-300">
                                    "Demande initiale : ${prompt}"
                                </blockquote>
                            </div>`
                        });
                    } else {
                        throw secondaryErr;
                    }
                }
            } else {
                throw err;
            }
        }

        if (response && response.text) {
            // Sauvegarder l'échange dans l'historique
            conversationHistory.push({ role: "user", text: prompt });
            conversationHistory.push({ role: "model", text: response.text });

            if (conversationHistory.length > 20) {
                conversationHistory = conversationHistory.slice(-20);
            }

            res.json({ result: response.text });
        } else {
            res.status(503).json({ error: "Noyau YELOX surchargé. Veuillez réessayer dans quelques instants." });
        }
    } catch (error) {
        console.error("Erreur Serveur Interne:", error);
        res.status(500).json({ error: "Panne de communication du noyau." });
    }
});

// Route pour la génération d'images via Imagen / Gemini
// Nouvelle route pour la génération d'images via Imagen / Gemini
app.post("/generate-image", async (req, res) => {
    try {
        const { prompt } = req.body;
        const modelName = "imagen-4.0-ultra-generate-001";

        console.log(`Génération d'image en cours avec le noyau : ${modelName}`);

        const response = await ai.models.generateImages({
            model: modelName,
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: "image/jpeg",
                aspectRatio: "1:1",
            },
        });

        if (response && response.generatedImages && response.generatedImages.length > 0) {
            const imageBase64 = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
            const imageHtml = `<img src="${imageUrl}" alt="Création YELOX" class="rounded-2xl shadow-xl border border-pink-500/20 mx-auto max-w-full h-auto" />`;

            res.json({ result: imageHtml });
        } else {
            res.status(503).json({ error: "Le générateur d'images n'a pas pu répondre." });
        }
    } catch (error) {
        console.error("Erreur de génération d'image:", error);

        // Interception des erreurs de facturation ou de quota
        if (
            (error.message && error.message.includes("paid plans")) ||
            (error.message && error.message.includes("429")) ||
            (error.message && error.message.includes("quota")) ||
            error.status === 400 ||
            error.status === 429
        ) {
            return res.json({
                result: `<div class="p-6 bg-gray-900 border border-yellow-500/30 rounded-2xl text-yellow-400">
                    <h4 class="font-bold text-lg mb-2">💡 Note YELOX : Fonctionnalité Premium / Limite atteinte</h4>
                    <p class="text-sm mb-4">La génération d'images directe nécessite un compte facturable Google Cloud ou le quota journalier est atteint. Voici le prompt visuel détaillé pour créer votre projet vous-même avec un outil de design :</p>
                    <blockquote class="border-l-4 border-yellow-500 pl-4 italic text-gray-300">
                        "${prompt}"
                    </blockquote>
                </div>`
            });
        }

        res.status(500).json({
            error: "Échec de l'initialisation du processeur graphique. Vérifiez vos quotas ou votre clé API."
        });
    }
});

app.post("/reset-memory", (req, res) => {
    conversationHistory = [];
    res.json({ message: "Mémoire du noyau réinitialisée avec succès." });
});

app.listen(PORT, () => {
    console.log(`🚀 [YELOX CORE] activé et opérationnel sur le port ${PORT}`);
    console.log(`📍 Origine : Abidjan, Côte d'Ivoire`);
    console.log(`⚙️ Capacité de génération : 4000 tokens`);
    console.log(`📋 [OPTIONS PRÊTES] : Prise en charge de la copie et du partage du contenu activée.`);
});