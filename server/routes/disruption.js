const express = require('express');
const router = express.Router();
const runPython = require('../runPython');

// GET /api/disruption/plans - get recovery plans for a scenario
router.get('/plans', async (req, res) => {
    try {
        const { scenario } = req.query;
        const result = await runPython('disruption_agent.py', {
            action: 'get_plans',
            scenario: scenario || 'breakdown'
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/disruption/approve - approve a recovery plan
router.post('/approve', async (req, res) => {
    try {
        const { scenario, plan_title } = req.body;
        const result = await runPython('disruption_agent.py', {
            action: 'approve',
            scenario,
            plan_title
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
