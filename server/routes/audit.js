const express = require('express');
const router = express.Router();
const runPython = require('../runPython');

// GET /api/audit/logs - read immutable log data and KPIs
router.get('/logs', async (req, res) => {
    try {
        const data = await runPython('audit_agent.py', { action: 'list' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/audit/add - manually add log entry
router.post('/add', async (req, res) => {
    try {
        const { type, module, source, action_text, status } = req.body;
        const result = await runPython('audit_agent.py', {
            action: 'add',
            type,
            module,
            source,
            action_text,
            status
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
