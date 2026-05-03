const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'https://no-flop-studio.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Route principale
app.get('/api', (req, res) => {
  res.json({ message: "Le noyau YELOX fonctionne !" });
});

// Route /generate acceptant à la fois GET et POST
app.get('/api/generate', (req, res) => {
  res.json({ success: true, message: "Le générateur YELOX est prêt (GET)" });
});

app.post('/api/generate', (req, res) => {
  res.json({ success: true, message: "Génération en cours (POST)" });
});

module.exports = app;