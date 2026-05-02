from dotenv import load_dotenv
load_dotenv() # Charge les variables du fichier .env

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from google import genai

app = FastAPI()

# Configuration du CORS pour autoriser les requêtes depuis votre frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Autorise toutes les origines pour le développement local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation du client genai officiel
client = genai.Client()

class GenerationRequest(BaseModel):
    nom_produit: str
    categorie: str

@app.get("/api/boutique")
async def lire_boutique():
    try:
        chemin_fichier = "../No Flop Studio/boutique.json"
        with open(chemin_fichier, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Le fichier boutique.json est introuvable.")

@app.post("/api/yelox/generer-description")
async def generer_description(data: GenerationRequest):
    try:
        # Prompt simplifié et robuste
        prompt = (
            f"Tu es YELOX, un assistant expert des créateurs et entrepreneurs. "
            f"Analyse le projet suivant pour générer des conseils structurés et professionnels :\n\n"
            f"- Projet : {data.nom_produit}\n"
            f"- Domaine : {data.categorie}\n\n"
            "Structure ta réponse ainsi :\n"
            "1. Accroche marketing et branding\n"
            "2. Conseil infographie et identité visuelle\n"
            "3. Stratégie de production / musicale\n"
            "4. Conseil technique (développement / code)\n"
            "5. Monétisation et engagement"
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        texte_genere = response.text if response and response.text else "Aucun texte généré."

        # C'est ici que vous devez mettre le code :
        return {
            "statut": "succès",
            "produit": data.nom_produit,
            "categorie": data.categorie,
            "resultat_marketing": texte_genere,
            "description_generee": texte_genere 
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'appel à YELOX : {str(e)}")
@app.get("/")
async def racine():
    return {"message": "Serveur VendiPro et YELOX opérationnel (version moderne) !"}