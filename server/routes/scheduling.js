const express = require('express');
const router = express.Router();
const runPython = require('../runPython');

// GET /api/scheduling - status check
router.get('/', async (req, res) => {
    try {
        const data = await runPython('scheduler_agent.py', { action: 'status' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/scheduling/optimize - run scheduler optimization
router.post('/optimize', async (req, res) => {
    try {
        const result = await runPython('scheduler_agent.py', { action: 'optimize' });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/scheduling/apply - apply AI recommendations
router.post('/apply', async (req, res) => {
    try {
        const { train_id, action_text } = req.body;
        const result = await runPython('scheduler_agent.py', {
            action: 'apply',
            train_id,
            action_text
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
