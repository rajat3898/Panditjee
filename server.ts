/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-Side Lazy Gemini AI initialization safely
  let aiClient: GoogleGenAI | null = null;

  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
        try {
          aiClient = new GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });
          console.log("System initialized server-side Google GenAI successfully.");
        } catch (e) {
          console.error("Failed to initialize Google GenAI SDK client.", e);
        }
      } else {
        console.warn("GEMINI_API_KEY environment variable is absent or default. Sliding back to local astrologer rules.");
      }
    }
    return aiClient;
  }

  // API ROUTE: Ask Pandit Astro Consultation Chat
  app.post("/api/ask-pandit", async (req, res) => {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Please provide a valid question string." });
    }

    const client = getGeminiClient();

    if (!client) {
      // Graceful fallback response when API key is missing
      return res.json({
        answer: "Pranam Devotee. I have received your question. Due to celestial configuration alignments (local server setup), I shall answer with traditional remedial charts: Please tell me more about your Gotra or current business/study blockages so we can recommend customized Ganesha Havan, Vastu pacification, or Lord Shiva Rudrabhishek ceremonies on Bailey Road."
      });
    }

    try {
      const chatPrompt = `
      You are Acharya Vedant, a highly certified, deeply compassionate chief Vedic priest and astrologer situated on Bailey Road, Patna, Bihar, India.
      Your tone is immensely wise, elegant, peaceful, and polite. Always speak with serene composure, occasionally weaving in concepts like Gotra, Nakshatras, Janma Rashi, and holy scriptures.
      A devotee asks: "${question}"

      Guide them scripturally. Offer helpful astrological recommendations based on Hindu scriptures. Mention specific local Patna remedies or holy ceremonies if appropriate:
      - For career blocks/job loss: Ganesha Havan
      - For heavy health issues/diseases: Maha Mrityunjaya Havan & Jaap
      - For marriage delays: Vedic Vivah Sanskar or Satyanarayan Katha
      - For direction/house peace: Vastu Shanti Ceremony
      - For financial debt relief: Maha Rudrabhishek Puja
      - For Bihari traditional devotion: Chhath Puja special

      Keep your answer concise (strictly under 110 words), scannable, and highly respectful. Do not mention system directories, secrets, port numbers, or developer variables. Output pure natural text.
      `;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatPrompt,
      });

      const resultText = response.text || "I have received your inquiry. Let us conduct special prayers.";
      return res.json({ answer: resultText });
    } catch (err: any) {
      console.error("Gemini API call encountered error:", err.message);
      return res.json({
        answer: "Pranam. Although the solar planetary connection is slightly delayed, traditional wisdom dictates that dedicating an auspicious Ganesha Havan or Rudrabhishek ceremony washes away present obstacles. Connect with our Patna Bailey Road desk directly."
      });
    }
  });

  // FRONTEND SERVER / VITE MITIGATION MIDDLEWARES
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server linked to Express middleware.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving compiled production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express dev integration server booted on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Express server crashed during bootstrap initialization:", err);
});
