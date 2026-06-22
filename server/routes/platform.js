const express = require('express');
const router = express.Router();
const runPython = require('../runPython');

// GET /api/platform - status check
router.get('/', async (req, res) => {
    try {
        const data = await runPython('platform_agent.py', { action: 'status' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/platform/optimize - run platform optimization
router.post('/optimize', async (req, res) => {
    try {
        const result = await runPython('platform_agent.py', { action: 'optimize' });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/platform/assign - manually assign platform
router.post('/assign', async (req, res) => {
    try {
        const { train_id, platform } = req.body;
        const result = await runPython('platform_agent.py', {
            action: 'assign',
            train_id,
            platform
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
