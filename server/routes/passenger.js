const express = require('express');
const router = express.Router();
const runPython = require('../runPython');

// POST /api/passenger/generate - generate multilingual announcement
router.post('/generate', async (req, res) => {
    try {
        const { prompt, language } = req.body;
        const result = await runPython('passenger_agent.py', {
            action: 'generate',
            prompt,
            language
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/passenger/broadcast - execute broadcast
router.post('/broadcast', async (req, res) => {
    try {
        const { prompt, announcement, language, channels } = req.body;
        const result = await runPython('passenger_agent.py', {
            action: 'broadcast',
            prompt,
            announcement,
            language,
            channels
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
