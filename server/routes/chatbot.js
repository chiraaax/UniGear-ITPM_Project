const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize the Gemini model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const chat = await model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'You are a helpful assistant for a campus sharing app called UniGear.' }],
        },
        {
          role: 'model',
          parts: [{ text: 'Okay, I am ready to assist users of UniGear!' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 200,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to get a response from the AI model.' });
  }
});

module.exports = router;
