const express = require('express');
const router = express.Router();
const runPython = require('../runPython');

// GET /api/monitoring - telemetry data
router.get('/', async (req, res) => {
    try {
        const data = await runPython('monitoring_agent.py', { action: 'status' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/monitoring/restart - restart a service container
router.post('/restart', async (req, res) => {
    try {
        const { name } = req.body;
        const result = await runPython('monitoring_agent.py', {
            action: 'restart',
            name
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
