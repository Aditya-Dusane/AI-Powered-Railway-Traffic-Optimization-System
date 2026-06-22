const express = require('express');
const router = express.Router();
const runPython = require('../runPython');

// GET /api/dashboard - retrieve live dashboard info
router.get('/', async (req, res) => {
    try {
        const data = await runPython('dashboard_agent.py', { action: 'get_dashboard' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/dashboard/execute - execute a GenAI action plan
router.post('/execute', async (req, res) => {
    try {
        const { type, desc } = req.body;
        const result = await runPython('dashboard_agent.py', {
            action: 'execute',
            insight_type: type,
            description: desc
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
