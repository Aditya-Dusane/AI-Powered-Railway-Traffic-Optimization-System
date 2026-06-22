const express = require('express');
const router = express.Router();
const runPython = require('../runPython');

// GET /api/hitl - pending recommendations & history
router.get('/', async (req, res) => {
    try {
        const data = await runPython('hitl_agent.py', { action: 'list' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/hitl/reasoning/:id - generate AI reasoning explanation
router.get('/reasoning/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await runPython('hitl_agent.py', {
            action: 'reasoning',
            id
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/hitl/decision - record operator decision
router.post('/decision', async (req, res) => {
    try {
        const { id, decision, operator } = req.body;
        const result = await runPython('hitl_agent.py', {
            action: 'decision',
            id,
            decision,
            operator
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
