// Example secure Node.js/Express endpoint for MotoBot.
// Install: npm install express openai dotenv
// Run: node server.js (set OPENAI_API_KEY in environment; never put it in browser code)
require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const app = express();
app.use(express.json({ limit: '16kb' }));
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.post('/api/chat', async (req, res) => {
  try {
    if (!client) return res.status(503).json({ error: 'AI is not configured' });
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 2000) return res.status(400).json({ error: 'Invalid message' });
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-10) : [];
    const messages = [
      { role: 'system', content: 'Ты MotoBot — дружелюбный русскоязычный помощник MotoAuction, сайта аукциона мотоциклов. Отвечай понятно и кратко. Помогай с навигацией, покупкой, продажей, ставками и доставкой. Не выдумывай актуальные цены, наличие, статус лота или гарантии; если точной информации нет, честно скажи об этом и предложи обратиться к поддержке. Не запрашивай пароли, коды или платёжные данные.' },
      ...history.filter(m => ['user', 'assistant'].includes(m?.role) && typeof m?.content === 'string')
        .map(m => ({ role: m.role, content: m.content.slice(0, 2000) })),
      { role: 'user', content: message }
    ];
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages, max_tokens: 350, temperature: 0.5
    });
    res.json({ reply: completion.choices?.[0]?.message?.content || 'Не получилось подготовить ответ. Попробуйте ещё раз.' });
  } catch (error) {
    console.error('MotoBot endpoint failed:', error.message);
    res.status(500).json({ error: 'Не удалось получить ответ ИИ' });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`MotoBot API listening on ${port}`));
